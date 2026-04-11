# Invoice Events Overview

## Purpose

This document lists the main events published by `Invoice Service`.

`Invoice Service` is the canonical publisher for invoice-domain events.

## Core Events

`Invoice Service` publishes these events:

- `InvoiceIssued`
- `InvoicePaid`
- `InvoicePaymentFailed`
- `InvoiceMarkedOverdue`

## Payment Failure Integration

When `Invoice Service` consumes a `PaymentFailed` event from `Payment Orchestrator`, it updates the invoice state and then publishes `InvoicePaymentFailed`.

This event is consumed by `Notification Dispatcher` so the customer can be informed that the payment attempt failed.

## Event Ownership Rule

Even when another service causes the state change, invoice events must still be published by `Invoice Service`.

For example:

- `Payment Orchestrator` publishes `PaymentFailed`
- `Invoice Service` publishes `InvoicePaymentFailed`

This prevents other services from publishing invoice-domain events directly.

## Common Question

If someone asks, "Which service publishes invoice events?", the answer is `Invoice Service`.
