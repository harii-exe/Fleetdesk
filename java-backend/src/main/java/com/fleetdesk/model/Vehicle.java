package com.fleetdesk.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Abstract Vehicle base class demonstrating Encapsulation and Inheritance.
 * Subclasses include Car, Bike, Suv, and ElectricVehicle.
 */
@Entity
@Table(name = "vehicles")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "category", discriminatorType = DiscriminatorType.STRING)
public abstract class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Registration number is required")
    @Column(name = "registration_number", nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @NotBlank(message = "Brand name is required")
    @Column(nullable = false, length = 100)
    private String brand;

    @NotBlank(message = "Model name is required")
    @Column(nullable = false, length = 100)
    private String model;

    @NotNull(message = "Manufacturing year is required")
    @Min(value = 2000, message = "Year must be 2000 or later")
    @Column(name = "manufacturing_year", nullable = false)
    private Integer manufacturingYear;

    @NotNull(message = "Fuel type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 30)
    private FuelType fuelType;

    @NotNull(message = "Seating capacity is required")
    @Min(value = 1, message = "At least 1 seat required")
    @Column(name = "seating_capacity", nullable = false)
    private Integer seatingCapacity;

    @NotNull(message = "Transmission is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Transmission transmission;

    @NotNull(message = "Daily rate is required")
    @DecimalMin(value = "0.01", message = "Daily rate must be positive")
    @Column(name = "daily_rental_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRentalRate;

    @NotNull(message = "Operational status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "operational_status", nullable = false, length = 30)
    private OperationalStatus operationalStatus = OperationalStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Min(0)
    @Column(name = "odometer_reading", nullable = false)
    private Integer odometerReading = 0;

    @NotNull(message = "Insurance expiry date is required")
    @Column(name = "insurance_expiry", nullable = false)
    private LocalDate insuranceExpiry;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Polymorphic abstract methods
    public abstract String getVehicleTypeDescription();
    public abstract BigDecimal calculateInspectionSurcharge();

    // Domain validation methods
    public boolean isAvailableForRental() {
        return this.operationalStatus == OperationalStatus.AVAILABLE &&
               this.insuranceExpiry.isAfter(LocalDate.now());
    }

    public void updateOdometer(int newReading) {
        if (newReading < this.odometerReading) {
            throw new IllegalArgumentException("New odometer reading (" + newReading + " KM) cannot be less than current (" + this.odometerReading + " KM)");
        }
        this.odometerReading = newReading;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters (Encapsulation)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber != null ? registrationNumber.toUpperCase().trim() : null;
    }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Integer getManufacturingYear() { return manufacturingYear; }
    public void setManufacturingYear(Integer manufacturingYear) { this.manufacturingYear = manufacturingYear; }

    public FuelType getFuelType() { return fuelType; }
    public void setFuelType(FuelType fuelType) { this.fuelType = fuelType; }

    public Integer getSeatingCapacity() { return seatingCapacity; }
    public void setSeatingCapacity(Integer seatingCapacity) { this.seatingCapacity = seatingCapacity; }

    public Transmission getTransmission() { return transmission; }
    public void setTransmission(Transmission transmission) { this.transmission = transmission; }

    public BigDecimal getDailyRentalRate() { return dailyRentalRate; }
    public void setDailyRentalRate(BigDecimal dailyRentalRate) {
        if (dailyRentalRate == null || dailyRentalRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Daily rental rate must be strictly positive");
        }
        this.dailyRentalRate = dailyRentalRate;
    }

    public OperationalStatus getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(OperationalStatus operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Integer getOdometerReading() { return odometerReading; }
    public void setOdometerReading(Integer odometerReading) { this.odometerReading = odometerReading; }

    public LocalDate getInsuranceExpiry() { return insuranceExpiry; }
    public void setInsuranceExpiry(LocalDate insuranceExpiry) { this.insuranceExpiry = insuranceExpiry; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public enum FuelType { PETROL, DIESEL, ELECTRIC, HYBRID, CNG }
    public enum Transmission { MANUAL, AUTOMATIC, SINGLE_SPEED }
    public enum OperationalStatus { AVAILABLE, RENTED, MAINTENANCE, DEACTIVATED }
}
