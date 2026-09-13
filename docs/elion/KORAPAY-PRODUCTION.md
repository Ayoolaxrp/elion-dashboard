# KoraPay production configuration

ELION uses KoraPay Checkout Redirect for hosted payment collection. Secrets are server-only and must be configured in the deployment environment, never in a client component or committed file.

## Required server environment variables

```dotenv
KORAPAY_PUBLIC_KEY=
KORAPAY_SECRET_KEY=
KORAPAY_ENCRYPTION_KEY=
```

`KORAPAY_PUBLIC_KEY` and `KORAPAY_ENCRYPTION_KEY` are retained for Kora account configuration and future direct-card flows. The current hosted Checkout Redirect flow requires `KORAPAY_SECRET_KEY` on the server. Do not expose any of these values through `NEXT_PUBLIC_*` variables.

The existing ELION server variables are also required for admin/client authentication and database access:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
```

## Kora dashboard configuration

Set the Kora webhook URL to:

```text
https://elion.com.ng/api/webhooks/kora
```

The initialize request also sends this URL as `notification_url`, so the deployment origin must be the public HTTPS ELION origin. Kora webhook requests must be unauthenticated at the HTTP layer and are authenticated by the `x-korapay-signature` HMAC-SHA256 header.

## Payment lifecycle

1. An admin or authenticated client starts payment for an unpaid invoice.
2. ELION creates a provider-linked `pending` payment row and initializes Kora Checkout Redirect server-side.
3. Kora returns the hosted checkout URL; no frontend secret is used.
4. The customer returns to ELION, which uses the return only as a verification trigger.
5. ELION verifies the transaction server-side and also accepts signed Kora webhooks.
6. Exact amount and currency must match the invoice. Underpayments, overpayments, and currency mismatches remain pending for reconciliation.
7. A confirmed payment marks the invoice paid, promotes a linked lead, activates the linked client organization, advances pending onboarding, and records an admin notification/activity event when those links exist.
8. Replayed webhooks are acknowledged without repeating downstream work.

Supported invoice/proposal currencies: `NGN`, `USD`, `GBP`, `EUR`.

## Manual production checklist

- [ ] Configure the three `KORAPAY_*` values in the secure deployment environment.
- [ ] Confirm the Kora account is in live mode and Checkout Redirect/pay-in channels are enabled.
- [ ] Register `https://elion.com.ng/api/webhooks/kora` in the Kora dashboard.
- [ ] Apply migrations through `036_proposal_document_fields.sql` to the intended Supabase project.
- [ ] Create or select an unpaid NGN invoice and complete a real low-value NGN payment.
- [ ] Repeat with an invoice denominated in USD, GBP, and EUR if those settlement currencies are enabled on the Kora account.
- [ ] Verify a failed/closed/expired checkout remains non-successful.
- [ ] Resend the same successful webhook and confirm no duplicate payment, invoice update, onboarding activation, or notification is created.
- [ ] Confirm the invoice, payment reference, amount, currency, status, and date are visible in Admin → Payments.
- [ ] Confirm the linked client can access onboarding only through the normal authenticated client membership boundary.

A provider-backed transaction was not run from this environment because production credentials were not supplied into the repository or shell.
