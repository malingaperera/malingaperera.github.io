# Engineering Onboarding Notes

## Purpose

This document helps new engineers understand the main services in the billing platform.

## Service Summary

- `Payment Orchestrator` runs payment attempts and retry logic
- `Invoice Service` owns invoice state and invoice-domain events
- `Webhook Gateway` validates inbound provider webhooks
- `Notification Dispatcher` sends customer notifications

## Important Reminder

This document is only a high-level orientation note.

It is not a runbook and it should not be used as the final source for production operational actions such as secret rotation or payment incident response.
