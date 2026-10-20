package com.fleetdesk.strategy;

import com.fleetdesk.model.Invoice;
import com.fleetdesk.model.Payment;
import java.math.BigDecimal;

/**
 * PaymentMethod interface demonstrating Abstraction & Polymorphism for payment processing.
 */
public interface PaymentMethod {

    Payment.Method getMethodType();

    Payment executePayment(Invoice invoice, BigDecimal amount, String details, boolean simulateFailure);
}
