package com.fleetdesk.strategy;

import com.fleetdesk.model.Vehicle;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Strategy interface demonstrating Abstraction & Polymorphism in pricing calculation.
 */
public interface PricingStrategy {

    String getStrategyName();

    BigDecimal calculateRentalCost(Vehicle vehicle, int billableDays, LocalDateTime pickup, LocalDateTime returnDate);
}
