package com.fleetdesk.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.math.BigDecimal;

@Entity
@DiscriminatorValue("ELECTRIC_VEHICLE")
public class ElectricVehicle extends Vehicle {

    private Double batteryCapacityKwh;
    private Integer certifiedRangeKm;

    public ElectricVehicle() {
        setFuelType(FuelType.ELECTRIC);
        setTransmission(Transmission.SINGLE_SPEED);
    }

    @Override
    public String getVehicleTypeDescription() {
        return "Zero-Emission Electric Vehicle with " + (batteryCapacityKwh != null ? batteryCapacityKwh + " kWh pack" : "EV powertrain");
    }

    @Override
    public BigDecimal calculateInspectionSurcharge() {
        return BigDecimal.valueOf(100.00); // Low-maintenance EV diagnostic fee
    }

    public Double getBatteryCapacityKwh() { return batteryCapacityKwh; }
    public void setBatteryCapacityKwh(Double batteryCapacityKwh) { this.batteryCapacityKwh = batteryCapacityKwh; }

    public Integer getCertifiedRangeKm() { return certifiedRangeKm; }
    public void setCertifiedRangeKm(Integer certifiedRangeKm) { this.certifiedRangeKm = certifiedRangeKm; }
}
