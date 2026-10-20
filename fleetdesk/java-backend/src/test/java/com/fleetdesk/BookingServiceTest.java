package com.fleetdesk;

import com.fleetdesk.exception.BookingConflictException;
import com.fleetdesk.exception.InvalidBookingException;
import com.fleetdesk.model.*;
import com.fleetdesk.repository.*;
import com.fleetdesk.service.BillingService;
import com.fleetdesk.service.BookingService;
import com.fleetdesk.strategy.StandardPricingStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    private StandardPricingStrategy pricingStrategy;

    private BookingService bookingService;

    private Customer testCustomer;
    private Car testCar;

    @BeforeEach
    void setUp() {
        pricingStrategy = new StandardPricingStrategy();
        bookingService = new BookingService(bookingRepository, vehicleRepository, customerRepository, invoiceRepository, pricingStrategy);

        testCustomer = new Customer();
        testCustomer.setId(1L);
        testCustomer.setFullName("Rahul Sharma");
        testCustomer.setPhone("+91 98765 43210");
        testCustomer.setDrivingLicenceNumber("KL-07-20180012345");
        testCustomer.setLicenceExpiryDate(LocalDate.now().plusYears(4));

        testCar = new Car();
        testCar.setId(10L);
        testCar.setBrand("Honda");
        testCar.setModel("City ZX");
        testCar.setRegistrationNumber("KL-07-CD-1002");
        testCar.setDailyRentalRate(BigDecimal.valueOf(2200.00));
        testCar.setOperationalStatus(Vehicle.OperationalStatus.AVAILABLE);
        testCar.setInsuranceExpiry(LocalDate.now().plusYears(2));
    }

    @Test
    @DisplayName("Test 05 & 07: Valid booking creation succeeds when no interval conflict exists")
    void testCreateBooking_Success() {
        LocalDateTime pickup = LocalDateTime.now().plusDays(2);
        LocalDateTime returnDate = pickup.plusDays(3);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(testCar));
        when(bookingRepository.findConflictingBookings(10L, pickup, returnDate)).thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking booking = bookingService.createBooking(1L, 10L, pickup, returnDate);

        assertNotNull(booking);
        assertEquals(Booking.BookingStatus.CONFIRMED, booking.getStatus());
        assertEquals(BigDecimal.valueOf(2200.00), booking.getAgreedDailyRate());
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    @DisplayName("Test 07: Overlapping booking is blocked by BookingConflictException")
    void testCreateBooking_ConflictThrowsException() {
        LocalDateTime pickup = LocalDateTime.now().plusDays(2);
        LocalDateTime returnDate = pickup.plusDays(3);

        Booking existing = new Booking();
        existing.setPickupDatetime(pickup.plusDays(1));
        existing.setExpectedReturnDatetime(returnDate.plusDays(1));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(testCar));
        when(bookingRepository.findConflictingBookings(10L, pickup, returnDate)).thenReturn(List.of(existing));

        assertThrows(BookingConflictException.class, () -> {
            bookingService.createBooking(1L, 10L, pickup, returnDate);
        });

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Test 06: Invalid date range (return before pickup) rejected")
    void testCreateBooking_InvalidDateRange() {
        LocalDateTime pickup = LocalDateTime.now().plusDays(3);
        LocalDateTime returnDate = pickup.minusDays(1); // Invalid!

        assertThrows(InvalidBookingException.class, () -> {
            bookingService.createBooking(1L, 10L, pickup, returnDate);
        });
    }

    @Test
    @DisplayName("Test 12: Late fee calculation: ₹1,000 daily rate & 26 hrs overdue -> 2 late days = ₹3,000 late fee")
    void testCalculateLateFee() {
        BillingService billingService = new BillingService(bookingRepository, invoiceRepository, vehicleRepository);

        LocalDateTime expectedReturn = LocalDateTime.of(2026, 10, 1, 10, 0);
        LocalDateTime actualReturn = LocalDateTime.of(2026, 10, 2, 12, 0); // 26 hours late
        BigDecimal dailyRate = BigDecimal.valueOf(1000.00);

        BigDecimal lateFee = billingService.calculateLateFee(expectedReturn, actualReturn, dailyRate);

        // 26 hours / 24 = ceil(1.08) = 2 days
        // 2 days * 1000 * 1.5 multiplier = 3000.00
        assertEquals(0, BigDecimal.valueOf(3000.00).compareTo(lateFee));
    }
}
