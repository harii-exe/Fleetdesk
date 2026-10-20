package com.fleetdesk.repository;

import com.fleetdesk.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerIdOrderByPickupDatetimeDesc(Long customerId);

    List<Booking> findByVehicleIdOrderByPickupDatetimeDesc(Long vehicleId);

    /**
     * Checks for interval collision:
     * Overlap occurs when requestedStart < existingEnd AND requestedEnd > existingStart.
     * Excludes cancelled and completed bookings.
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.vehicle.id = :vehicleId
          AND b.status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'OVERDUE')
          AND :requestedStart < b.expectedReturnDatetime
          AND :requestedEnd > b.pickupDatetime
    """)
    List<Booking> findConflictingBookings(
            @Param("vehicleId") Long vehicleId,
            @Param("requestedStart") LocalDateTime requestedStart,
            @Param("requestedEnd") LocalDateTime requestedEnd
    );
}
