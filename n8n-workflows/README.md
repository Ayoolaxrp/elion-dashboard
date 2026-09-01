# ELION n8n Workflows

These are the automation workflows that ELION deploys for each client.
Import them into your n8n instance after self-hosting.

## Workflows

### 1. Lead Response (`01-lead-response.json`)
- **Trigger:** Webhook POST from ELION when a new lead is submitted
- **Action:** Fetches client config from Supabase, formats personalized message, sends via WhatsApp or Email
- **Webhook URL:** `https://your-n8n.com/webhook/elion/lead-response`

### 2. Follow-Up Sequence (`02-follow-up.json`)
- **Trigger:** Webhook POST from ELION when a lead needs follow-up
- **Action:** Sends timed follow-up messages (Day 1, Day 3, Day 7)
- **Webhook URL:** `https://your-n8n.com/webhook/elion/follow-up`

### 3. Booking Automation (`03-booking.json`)
- **Trigger:** Webhook POST from ELION when a lead requests a booking
- **Action:** Checks availability, sends booking confirmation, sets reminders
- **Webhook URL:** `https://your-n8n.com/webhook/elion/booking`

## Setup

1. Import each JSON file into n8n via Settings → Import
2. Configure credentials: Supabase, WhatsApp API, SMTP
3. Activate each workflow
4. Update ELION env vars with your n8n webhook URLs

## Credentials Needed

| Credential | Where to get |
|---|---|
| Supabase | Service Role Key from Supabase Dashboard |
| WhatsApp API | Meta Business Suite |
| SMTP | Your email provider (or Resend) |

## Testing

After import, test with:
```bash
curl -X POST https://your-n8n.com/webhook/elion/lead-response \
  -H "Content-Type: application/json" \
  -d '{"client_id":"test","lead_email":"test@example.com","lead_phone":"+2348012345678","lead_name":"Test Lead"}'
```
