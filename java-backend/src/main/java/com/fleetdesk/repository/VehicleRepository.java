package com.fleetdesk.repository;

import com.fleetdesk.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumberIgnoreCase(String registrationNumber);

    List<Vehicle> findByOperationalStatusNot(Vehicle.OperationalStatus status);
}
