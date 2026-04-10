# Customer Notification Flow

## Overview

`Notification Dispatcher` is the service that sends customer-facing email and SMS messages for billing events.

It does not execute payments and it does not publish invoice events.

## Failure Notification Path

For a payment failure, the normal path is:

1. `Payment Orchestrator` publishes `PaymentFailed`
2. `Invoice Service` publishes `InvoicePaymentFailed`
3. `Notification Dispatcher` consumes `InvoicePaymentFailed`
4. `Notification Dispatcher` sends the customer email notification

## Why Notification Dispatcher Waits for Invoice Events

Customer communication is triggered from invoice-domain events rather than directly from payment-domain events.

This ensures the customer message reflects the current invoice state rather than only the payment processor result.

## Important Boundary

`Notification Dispatcher` should not read payment processor webhooks directly when deciding whether to notify the customer about a payment failure.
