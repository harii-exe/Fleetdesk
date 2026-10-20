package com.fleetdesk.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.math.BigDecimal;

@Entity
@DiscriminatorValue("BIKE")
public class Bike extends Vehicle {

    private Integer engineCc;
    private Boolean helmetIncluded = true;

    public Bike() {
        setSeatingCapacity(2);
        setTransmission(Transmission.MANUAL);
    }

    @Override
    public String getVehicleTypeDescription() {
        return "Two-Wheeler Motorcycle / Scooter (" + (engineCc != null ? engineCc + "cc" : "Commuter") + ")";
    }

    @Override
    public BigDecimal calculateInspectionSurcharge() {
        return BigDecimal.valueOf(50.00); // Two-wheeler inspection fee
    }

    public Integer getEngineCc() { return engineCc; }
    public void setEngineCc(Integer engineCc) { this.engineCc = engineCc; }

    public Boolean getHelmetIncluded() { return helmetIncluded; }
    public void setHelmetIncluded(Boolean helmetIncluded) { this.helmetIncluded = helmetIncluded; }
}
