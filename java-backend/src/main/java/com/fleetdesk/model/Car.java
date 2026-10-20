package com.fleetdesk.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.math.BigDecimal;

@Entity
@DiscriminatorValue("CAR")
public class Car extends Vehicle {

    private Integer engineCc;
    private Integer bootCapacityLiters = 400;

    public Car() {}

    @Override
    public String getVehicleTypeDescription() {
        return "Passenger Sedan/Hatchback with " + getSeatingCapacity() + " seats and " + bootCapacityLiters + "L luggage space.";
    }

    @Override
    public BigDecimal calculateInspectionSurcharge() {
        return BigDecimal.valueOf(150.00); // Standard car inspection fee
    }

    public Integer getEngineCc() { return engineCc; }
    public void setEngineCc(Integer engineCc) { this.engineCc = engineCc; }

    public Integer getBootCapacityLiters() { return bootCapacityLiters; }
    public void setBootCapacityLiters(Integer bootCapacityLiters) { this.bootCapacityLiters = bootCapacityLiters; }
}
