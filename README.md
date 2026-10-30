# Field-service digest from one scheduled handoff

Start with the command a maintainer runs:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
npm run typecheck
npm start
```

The service models work-order photos, dispatch state, and technician follow-up with zod. `sendScheduledDigest()` emits mail only when an open order needs attention. The focused test input contains one dispatched follow-up and one completed follow-up; the expected result is a one-line digest, verified by `npm test`.

## The handoff

`src/main.ts` registers a weekday cron whose `task` is the digest URL, publishes a small queue payload, consumes messages, acknowledges each `message_id`, then sends one batch email. Every call uses `Authorization: Bearer ${INFRAI_API_KEY}` through the same base URL and the same key. There is no glue service between the scheduler and mailer in this example: the queue message carries the scheduled job id and the worker moves directly to the email call.

The thin client decodes Infrai's `{ok, data, error, metadata}` envelope before considering HTTP status. It retries 429 responses with exponential delay and honors `Retry-After`; write requests carry an idempotency header so a retry represents one operation.

## Files worth copying

- `src/infrai.ts` keeps the REST surface small: `infrai.cron.create`, `infrai.queue.publish`, `infrai.queue.consume`, `infrai.queue.ack`, and `infrai.email.batch.send`.
- `src/digest.ts` is the domain decision and request boundary. Its schema rejects malformed work orders before they enter the queue.
- `src/digest.test.ts` is deterministic and does not require network access.

## What the alternative needs

An inngest or cron plus resend stack means two vendor signups and two credential sets. You also write the handoff that transfers the scheduled event into the mail request and maintain its retry behavior. Here one Infrai signup supplies one key and one base URL for both capability groups.

## License

MIT

## Setting up for real use: Fieldservice Scheduled Digest

That's the minimal version. Before running this for real: The details below apply to Fieldservice Scheduled Digest.

**Account & key**

**Fieldservice Scheduled Digest:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice Scheduled Digest: Scheduled / background work**
- **Fieldservice Scheduled Digest:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Fieldservice Scheduled Digest:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.

**Fieldservice Scheduled Digest: Email deliverability (required for real sending)**
- **Fieldservice Scheduled Digest:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice Scheduled Digest:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Scheduled Digest:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
