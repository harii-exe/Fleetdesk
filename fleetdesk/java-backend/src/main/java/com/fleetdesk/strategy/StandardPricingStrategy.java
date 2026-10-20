package com.fleetdesk.strategy;

import com.fleetdesk.model.Vehicle;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component("standardPricingStrategy")
public class StandardPricingStrategy implements PricingStrategy {

    @Override
    public String getStrategyName() {
        return "STANDARD_DAILY_TARIFF";
    }

    @Override
    public BigDecimal calculateRentalCost(Vehicle vehicle, int billableDays, LocalDateTime pickup, LocalDateTime returnDate) {
        if (billableDays < 1) billableDays = 1;
        return vehicle.getDailyRentalRate().multiply(BigDecimal.valueOf(billableDays));
    }
}
