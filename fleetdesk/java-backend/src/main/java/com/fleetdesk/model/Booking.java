package com.fleetdesk.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Booking entity demonstrating Composition with Customer and Vehicle.
 */
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_reference", nullable = false, unique = true, length = 50)
    private String bookingReference;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @NotNull
    @Column(name = "pickup_datetime", nullable = false)
    private LocalDateTime pickupDatetime;

    @NotNull
    @Column(name = "expected_return_datetime", nullable = false)
    private LocalDateTime expectedReturnDatetime;

    @Column(name = "actual_pickup_datetime")
    private LocalDateTime actualPickupDatetime;

    @Column(name = "actual_return_datetime")
    private LocalDateTime actualReturnDatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "agreed_daily_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal agreedDailyRate;

    @Column(name = "start_odometer")
    private Integer startOdometer;

    @Column(name = "end_odometer")
    private Integer endOdometer;

    @Column(name = "start_fuel_level", length = 20)
    private String startFuelLevel;

    @Column(name = "end_fuel_level", length = 20)
    private String endFuelLevel;

    @Column(name = "handover_notes", columnDefinition = "TEXT")
    private String handoverNotes;

    @Column(name = "return_notes", columnDefinition = "TEXT")
    private String returnNotes;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public boolean isEligibleForCancellation() {
        return this.status == BookingStatus.PENDING || this.status == BookingStatus.CONFIRMED;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public LocalDateTime getPickupDatetime() { return pickupDatetime; }
    public void setPickupDatetime(LocalDateTime pickupDatetime) { this.pickupDatetime = pickupDatetime; }

    public LocalDateTime getExpectedReturnDatetime() { return expectedReturnDatetime; }
    public void setExpectedReturnDatetime(LocalDateTime expectedReturnDatetime) { this.expectedReturnDatetime = expectedReturnDatetime; }

    public LocalDateTime getActualPickupDatetime() { return actualPickupDatetime; }
    public void setActualPickupDatetime(LocalDateTime actualPickupDatetime) { this.actualPickupDatetime = actualPickupDatetime; }

    public LocalDateTime getActualReturnDatetime() { return actualReturnDatetime; }
    public void setActualReturnDatetime(LocalDateTime actualReturnDatetime) { this.actualReturnDatetime = actualReturnDatetime; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public BigDecimal getAgreedDailyRate() { return agreedDailyRate; }
    public void setAgreedDailyRate(BigDecimal agreedDailyRate) { this.agreedDailyRate = agreedDailyRate; }

    public Integer getStartOdometer() { return startOdometer; }
    public void setStartOdometer(Integer startOdometer) { this.startOdometer = startOdometer; }

    public Integer getEndOdometer() { return endOdometer; }
    public void setEndOdometer(Integer endOdometer) { this.endOdometer = endOdometer; }

    public String getStartFuelLevel() { return startFuelLevel; }
    public void setStartFuelLevel(String startFuelLevel) { this.startFuelLevel = startFuelLevel; }

    public String getEndFuelLevel() { return endFuelLevel; }
    public void setEndFuelLevel(String endFuelLevel) { this.endFuelLevel = endFuelLevel; }

    public String getHandoverNotes() { return handoverNotes; }
    public void setHandoverNotes(String handoverNotes) { this.handoverNotes = handoverNotes; }

    public String getReturnNotes() { return returnNotes; }
    public void setReturnNotes(String returnNotes) { this.returnNotes = returnNotes; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public enum BookingStatus { PENDING, CONFIRMED, ACTIVE, CANCELLED, COMPLETED, OVERDUE }
}
