# Webhook Provider Onboarding Guide

## Purpose

This guide explains how to onboard a new external provider to `Webhook Gateway`.

## Typical Onboarding Steps

1. register the provider endpoint
2. map the provider event types to internal event names
3. configure retry rules for provider delivery failures
4. set the initial webhook signing secret
5. run a sandbox validation

## Scope Boundary

This guide is for first-time integration setup.

It is not the operational runbook for rotating an existing signing secret in production.

## Why This Distinction Matters

Search results for "webhook secret" may retrieve this guide because it discusses the initial signing secret.

But if the actual question is how to rotate the current secret safely, the secret rotation runbook is the correct document.
