package com.fleetdesk.service;

import com.fleetdesk.exception.InvalidBookingException;
import com.fleetdesk.model.*;
import com.fleetdesk.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class BillingService {

    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final VehicleRepository vehicleRepository;

    @Value("${fleetdesk.billing.default-penalty-multiplier:1.5}")
    private double penaltyMultiplier;

    public BillingService(
            BookingRepository bookingRepository,
            InvoiceRepository invoiceRepository,
            VehicleRepository vehicleRepository) {
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * Calculates late days and fee using:
     * Late days = ceil(hours overdue / 24)
     * Late fee = late days * agreed daily rate * penalty multiplier
     */
    public BigDecimal calculateLateFee(LocalDateTime expectedReturn, LocalDateTime actualReturn, BigDecimal dailyRate) {
        if (actualReturn == null || !actualReturn.isAfter(expectedReturn)) {
            return BigDecimal.ZERO;
        }

        long hoursOverdue = Duration.between(expectedReturn, actualReturn).toHours();
        if (hoursOverdue <= 0) return BigDecimal.ZERO;

        int lateDays = (int) Math.ceil((double) hoursOverdue / 24.0);
        return dailyRate
                .multiply(BigDecimal.valueOf(lateDays))
                .multiply(BigDecimal.valueOf(penaltyMultiplier));
    }

    @Transactional
    public void processHandover(Long bookingId, int startOdometer, String fuelLevel, String notes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED && booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new InvalidBookingException("Cannot handover booking in status: " + booking.getStatus());
        }

        booking.setStatus(Booking.BookingStatus.ACTIVE);
        booking.setActualPickupDatetime(LocalDateTime.now());
        booking.setStartOdometer(startOdometer);
        booking.setStartFuelLevel(fuelLevel);
        booking.setHandoverNotes(notes);

        Vehicle vehicle = booking.getVehicle();
        vehicle.setOperationalStatus(Vehicle.OperationalStatus.RENTED);
        vehicle.updateOdometer(startOdometer);

        bookingRepository.save(booking);
        vehicleRepository.save(vehicle);
    }

    @Transactional
    public Invoice processReturn(Long bookingId, int endOdometer, String fuelLevel, BigDecimal damageCharges, boolean markMaintenance, String notes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        if (booking.getStatus() != Booking.BookingStatus.ACTIVE && booking.getStatus() != Booking.BookingStatus.OVERDUE) {
            throw new InvalidBookingException("Only ACTIVE or OVERDUE bookings can be returned.");
        }

        LocalDateTime actualReturn = LocalDateTime.now();
        booking.setActualReturnDatetime(actualReturn);
        booking.setEndOdometer(endOdometer);
        booking.setEndFuelLevel(fuelLevel);
        booking.setReturnNotes(notes);
        booking.setStatus(Booking.BookingStatus.COMPLETED);

        // Update Vehicle
        Vehicle vehicle = booking.getVehicle();
        vehicle.updateOdometer(endOdometer);
        if (markMaintenance || (damageCharges != null && damageCharges.compareTo(BigDecimal.ZERO) > 0)) {
            vehicle.setOperationalStatus(Vehicle.OperationalStatus.MAINTENANCE);
        } else {
            vehicle.setOperationalStatus(Vehicle.OperationalStatus.AVAILABLE);
        }

        // Reconcile Invoice
        Invoice invoice = invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalStateException("Invoice missing for booking: " + bookingId));

        LocalDateTime pickupTime = booking.getActualPickupDatetime() != null ? booking.getActualPickupDatetime() : booking.getPickupDatetime();
        long totalHours = Duration.between(pickupTime, actualReturn).toHours();
        int billableDays = Math.max(1, (int) Math.ceil((double) totalHours / 24.0));

        BigDecimal rentalCharge = booking.getAgreedDailyRate().multiply(BigDecimal.valueOf(billableDays));
        BigDecimal lateFee = calculateLateFee(booking.getExpectedReturnDatetime(), actualReturn, booking.getAgreedDailyRate());

        invoice.setBillableDays(billableDays);
        invoice.setRentalCharge(rentalCharge);
        invoice.setExtraCharges(damageCharges != null ? damageCharges : BigDecimal.ZERO);
        invoice.setLateFee(lateFee);
        invoice.recalculateTotals();

        bookingRepository.save(booking);
        vehicleRepository.save(vehicle);
        return invoiceRepository.save(invoice);
    }
}
