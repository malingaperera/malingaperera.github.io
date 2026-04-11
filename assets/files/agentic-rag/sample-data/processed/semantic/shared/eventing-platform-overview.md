# Eventing Platform Overview

## Purpose

This document gives a high-level overview of the internal eventing platform used across services.

## Platform Summary

Services publish domain events to Amazon EventBridge.

Consumers subscribe to events through rules that forward messages to service-specific handlers.

## What This Document Is Good For

This overview is useful when you need to understand:

- how events move between services
- where replay and dead-letter handling exist
- why multiple services can subscribe to the same event

## What This Document Is Not Good For

This document does not define which service publishes a specific invoice event or which service sends a specific customer notification.

For those questions, use the domain-specific documents instead of this platform overview.
