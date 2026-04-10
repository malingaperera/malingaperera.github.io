# Payment Failure Handling

## Overview

This note describes what happens after a payment fails permanently in the internal commerce platform.

The main services involved are:

- `Payment Orchestrator`
- `Invoice Service`
- `Notification Dispatcher`

## Permanent Failure Flow

When retries are exhausted or the processor returns a non-retryable failure:

1. `Payment Orchestrator` records the final failure
2. `Payment Orchestrator` publishes `PaymentFailed`
3. `Invoice Service` consumes `PaymentFailed`
4. `Invoice Service` publishes `InvoicePaymentFailed`
5. `Notification Dispatcher` consumes `InvoicePaymentFailed`
6. `Notification Dispatcher` sends the customer email notification

## Why the Flow Is Split Across Services

The payment system owns payment execution and failure detection.

The invoice domain owns invoice status and invoice-related events.

The notification system owns customer-facing communication.

This split keeps each service responsible for one part of the flow instead of mixing payment logic with notification delivery.

## Related Events

The most important events in this flow are:

- `PaymentFailed`
- `InvoicePaymentFailed`

`PaymentFailed` is the payment-domain event.

`InvoicePaymentFailed` is the invoice-domain event that triggers customer communication.

## Operational Note

If the customer did not receive a failure email, check whether `InvoicePaymentFailed` was published before checking the notification templates. In practice, many notification incidents start earlier in the event chain.
