# ELION

AI Operations & Automation for growing businesses.

**Find the leaks in your business. Then automate them.**

ELION audits a business's public web presence, verifies where customer
opportunities are being lost, and builds the automation systems that capture,
follow up, track, and recover them: lead response, follow-up, booking,
reactivation, and custom operational systems.

## Key surfaces

- `/` marketing home
- `/audit` free public business audit (multi-stage pipeline, evidence-backed)
- `/methodology` how the audit works and how findings are classified
- `/pricing` commercial tiers
- `/demo`, `/about`, `/support`, `/book` canonical public pages
- `/login` client + admin access
- `/docs` product documentation

## Development

```bash
npm install
npm run dev
```

Environment: copy `.env.example` to `.env.local` and fill in Supabase,
OpenRouter, and Resend credentials.

## Testing

```bash
node tests/audit/run-fixtures.mjs        # audit detection fixtures
node tests/audit/run-integration.mjs     # SSRF/budget/integration
node tests/commercial/run-applicability.cjs  # opportunity engine + margins
node tests/commercial/run-nba.cjs        # next-best-action + consent
```

## Documentation

- `docs/elion/MASTER-PLAN.md` - current strategy truth
- `docs/elion/COMMERCIAL-MODEL.md` - pricing, competitors, unit economics
- `docs/elion/DECISION-LOG.md` - why decisions were made
- `docs/elion/IMPLEMENTATION-LOG.md` - what actually changed
