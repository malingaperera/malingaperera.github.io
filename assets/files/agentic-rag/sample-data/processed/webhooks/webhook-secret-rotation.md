# Webhook Signing Secret Rotation

## Purpose

Use this runbook when rotating the inbound webhook signing secret for external providers.

This runbook applies to `Webhook Gateway`.

## Secret Name

The signing secret is stored as `WEBHOOK_SIGNING_SECRET`.

## When to Rotate

Rotate the secret when:

- a credential exposure is suspected
- a routine quarterly rotation is due
- a provider integration has been reissued

## Rotation Steps

1. create a new secret value in AWS Secrets Manager
2. update the `WEBHOOK_SIGNING_SECRET` reference used by `Webhook Gateway`
3. deploy the configuration change
4. validate that new webhook deliveries are accepted
5. revoke the old provider secret after validation

## Validation

Confirm the rotation by:

- sending a signed test event from the provider sandbox
- checking that signature verification succeeds
- confirming that no spike in `WebhookSignatureValidationFailed` appears after deployment

## Related Documents

For provider onboarding steps, see the generic webhook onboarding guide.

For emergency response after secret exposure, use this runbook rather than the onboarding guide.
