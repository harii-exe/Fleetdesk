package com.fleetdesk.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.math.BigDecimal;

@Entity
@DiscriminatorValue("SUV")
public class Suv extends Vehicle {

    private Boolean allWheelDrive = false;
    private Integer groundClearanceMm = 200;

    public Suv() {}

    @Override
    public String getVehicleTypeDescription() {
        return "High-Rider Sports Utility Vehicle (SUV) with " + getSeatingCapacity() + " seats & " + (allWheelDrive ? "AWD" : "FWD/RWD");
    }

    @Override
    public BigDecimal calculateInspectionSurcharge() {
        return BigDecimal.valueOf(250.00); // Heavy SUV inspection fee
    }

    public Boolean getAllWheelDrive() { return allWheelDrive; }
    public void setAllWheelDrive(Boolean allWheelDrive) { this.allWheelDrive = allWheelDrive; }

    public Integer getGroundClearanceMm() { return groundClearanceMm; }
    public void setGroundClearanceMm(Integer groundClearanceMm) { this.groundClearanceMm = groundClearanceMm; }
}
