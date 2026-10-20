package com.fleetdesk.service;

import com.fleetdesk.exception.BookingConflictException;
import com.fleetdesk.exception.InvalidBookingException;
import com.fleetdesk.exception.VehicleNotFoundException;
import com.fleetdesk.model.*;
import com.fleetdesk.repository.*;
import com.fleetdesk.strategy.PricingStrategy;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PricingStrategy pricingStrategy;

    public BookingService(
            BookingRepository bookingRepository,
            VehicleRepository vehicleRepository,
            CustomerRepository customerRepository,
            InvoiceRepository invoiceRepository,
            @Qualifier("standardPricingStrategy") PricingStrategy pricingStrategy) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.pricingStrategy = pricingStrategy;
    }

    /**
     * Checks if vehicle is available during interval [pickup, returnDate].
     * Formula: requestedStart < existingEnd AND requestedEnd > existingStart
     */
    @Transactional(readOnly = true)
    public boolean isVehicleAvailable(Long vehicleId, LocalDateTime pickup, LocalDateTime returnDate) {
        if (returnDate.isBefore(pickup) || returnDate.isEqual(pickup)) {
            throw new InvalidBookingException("Return date/time must be strictly after pickup date/time.");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + vehicleId));

        if (vehicle.getOperationalStatus() != Vehicle.OperationalStatus.AVAILABLE &&
            vehicle.getOperationalStatus() != Vehicle.OperationalStatus.RENTED) {
            return false;
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(vehicleId, pickup, returnDate);
        return conflicts.isEmpty();
    }

    /**
     * Creates a new booking, snapshots rate, and initializes invoice atomically.
     */
    @Transactional
    public Booking createBooking(Long customerId, Long vehicleId, LocalDateTime pickup, LocalDateTime expectedReturn) {
        if (expectedReturn.isBefore(pickup) || expectedReturn.isEqual(pickup)) {
            throw new InvalidBookingException("Rental return time must be strictly after pickup time.");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + customerId));

        if (!customer.isLicenceValidThrough(expectedReturn.toLocalDate())) {
            throw new InvalidBookingException("Customer driving licence expires on " + customer.getLicenceExpiryDate() +
                    ", which is before the intended rental return date.");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + vehicleId));

        // Revalidate availability inside transaction
        List<Booking> conflicts = bookingRepository.findConflictingBookings(vehicleId, pickup, expectedReturn);
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException("Conflict detected: Vehicle is already reserved between " +
                    conflicts.get(0).getPickupDatetime() + " and " + conflicts.get(0).getExpectedReturnDatetime());
        }

        Booking booking = new Booking();
        booking.setBookingReference("BK-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setPickupDatetime(pickup);
        booking.setExpectedReturnDatetime(expectedReturn);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setAgreedDailyRate(vehicle.getDailyRentalRate()); // Snapshot agreed daily rate!

        Booking savedBooking = bookingRepository.save(booking);

        // Calculate billable days: ceil(hours / 24), min 1
        long hours = Duration.between(pickup, expectedReturn).toHours();
        int billableDays = Math.max(1, (int) Math.ceil((double) hours / 24.0));
        BigDecimal rentalCharge = pricingStrategy.calculateRentalCost(vehicle, billableDays, pickup, expectedReturn);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        invoice.setBooking(savedBooking);
        invoice.setBillableDays(billableDays);
        invoice.setRentalCharge(rentalCharge);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setExtraCharges(BigDecimal.ZERO);
        invoice.setLateDays(0);
        invoice.setLateFee(BigDecimal.ZERO);
        invoice.recalculateTotals();

        invoiceRepository.save(invoice);

        return savedBooking;
    }

    @Transactional
    public void cancelBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with ID: " + bookingId));

        if (!booking.isEligibleForCancellation()) {
            throw new InvalidBookingException("Cannot cancel booking in status: " + booking.getStatus());
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setCancelledAt(LocalDateTime.now());
        bookingRepository.save(booking);

        invoiceRepository.findByBookingId(bookingId).ifPresent(inv -> {
            if (inv.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
                inv.setPaymentStatus(Invoice.PaymentStatus.CANCELLED);
                invoiceRepository.save(inv);
            }
        });
    }
}
