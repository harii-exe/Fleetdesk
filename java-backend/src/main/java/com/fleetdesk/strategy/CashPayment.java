package com.fleetdesk.strategy;

import com.fleetdesk.model.Invoice;
import com.fleetdesk.model.Payment;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component
public class CashPayment implements PaymentMethod {

    @Override
    public Payment.Method getMethodType() {
        return Payment.Method.CASH;
    }

    @Override
    public Payment executePayment(Invoice invoice, BigDecimal amount, String details, boolean simulateFailure) {
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setPaymentMethod(Payment.Method.CASH);
        payment.setType(Payment.Type.PAYMENT);
        payment.setPaymentDetails(details);
        payment.setTransactionReference("TXN-CASH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setStatus(Payment.Status.SUCCESS);
        return payment;
    }
}
