# Payment Retry Runbook

## Purpose

Use this runbook when a payment attempt fails but the failure may be temporary and a retry is allowed.

This document applies to the `Payment Orchestrator` service in the production environment.

## Retryable Failure Types

The payment platform retries only these failure classes:

- upstream gateway timeout
- processor temporary unavailable
- issuer soft decline

The platform does not retry hard declines, invalid cards, or fraud rejections.

## Retry Schedule

For a retryable failure, `Payment Orchestrator` uses this schedule:

1. first retry after 5 minutes
2. second retry after 30 minutes
3. third retry after 6 hours

If all retries fail, the payment is marked as permanently failed.

## Events Published

When a retry is scheduled, `Payment Orchestrator` publishes the event `PaymentRetryScheduled`.

When all retries are exhausted, `Payment Orchestrator` publishes the event `PaymentFailed`.

## Downstream Consumers

`Retry Scheduler` consumes `PaymentRetryScheduled` and places the next payment attempt back onto the execution queue.

`Invoice Service` consumes `PaymentFailed` and updates the invoice state for the affected order.

## Operator Checks

When debugging a retry issue, confirm the following:

- the payment attempt is marked as retryable
- the retry count is below the maximum of 3
- a `PaymentRetryScheduled` event exists for the payment ID
- `Retry Scheduler` consumed the event successfully

## Escalation

Escalate to the payments platform team if:

- the retry count is not increasing
- the same payment is retried beyond the allowed schedule
- `PaymentFailed` is emitted for a payment that should still be retryable
