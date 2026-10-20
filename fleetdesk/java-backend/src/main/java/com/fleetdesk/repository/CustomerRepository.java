package com.fleetdesk.repository;

import com.fleetdesk.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByUserId(Long userId);

    Optional<Customer> findByDrivingLicenceNumberIgnoreCase(String drivingLicenceNumber);
}
