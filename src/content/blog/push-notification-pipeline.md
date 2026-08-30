---
title: "The push pipeline that didn't get blocked"
description: "Notification campaigns on scheduled batch jobs: throttling against platform quotas, dedup against recent sends, per-user caps — treating the messaging channel as a reputation you can spend only once."
pubDate: "Aug 28 2026"
heroImage: "/blog/hero-push.svg"
---

The scariest failure mode of a notification system isn't an outage. An outage you notice, fix, and apologize for. What kept me careful was the quiet failure: send a little too much, a little too often, and users don't file a complaint — they tap "block," and the entire channel to that person closes permanently. On a chat-platform product where messaging *was* the product surface, the push pipeline was effectively holding the company's only key to every customer relationship. We built it like that key could not be re-cut.

## The architecture: campaigns are batch jobs

All outbound campaigns — new-listing matches, tour reminders, re-engagement — ran as **scheduled batch jobs on ECS**, not as ad-hoc sends from application code. One pipeline, several campaign types, one enforcement point. The job walked eligible users, assembled personalized payloads (for match campaigns, reading the [precomputed recommendation scores](/blog/recommendation-system-line-miniapp/) — the same batch philosophy applied to delivery), and pushed through the messaging API. Alongside push, the platform ran transactional email; the combined notification service held a **99% delivery rate**, and the practices below are most of why.

The single-enforcement-point decision matters more than it looks. The moment product code can call `push.Send()` directly, every quota, cap, and dedup rule becomes advisory. Routing everything through the pipeline made the safety rules *structural* — there was no second door.

## The four gates

Every candidate message passed four gates, in order, cheapest rejection first:

1. **Eligibility** — is this user still opted in, still active, still matching the campaign's criteria *at send time*? Criteria evaluated at enqueue time go stale; we re-checked at the gate.
2. **Dedup against recent sends** — has this user already received this campaign, or a message about this same listing, within the window? The send log was the source of truth, keyed by `(user, campaign, subject)`. Retries and overlapping campaign definitions both funnel into the same check, so neither can double-send.
3. **Per-user frequency caps** — a hard ceiling on messages per user per period, across *all* campaign types. Individually reasonable campaigns sum to an unreasonable inbox; the cap is what represents the user's total experience, so it outranks every campaign owner's local logic.
4. **Rate throttling** — sends metered against the platform's API quotas with headroom to spare, spreading a large campaign over minutes instead of slamming the limit and eating 429s mid-batch.

The ordering is deliberate: reputation-protecting gates (2, 3) run before the expensive network call, and the throttle shapes only what survived them.

## Operational details that earned their place

- **Idempotent resume.** A campaign job that dies mid-run must be re-runnable without re-sending to the first half of the audience. The send log doubles as the checkpoint: on restart, gate 2 silently skips everyone already delivered. Batch jobs fail; pipelines that assume otherwise page you at the worst hour.
- **Delivery accounting per message.** Each send recorded its outcome — accepted, failed, retried — which is what makes a number like 99% *knowable* rather than vibes. The undeliverable tail (revoked permissions, blocked accounts) fed back into eligibility so we stopped paying quota for dead addresses.
- **Templates composed server-side, versioned like code.** Same rule as everywhere else on this platform: what you send into a chat thread is immutable history. A campaign message with a broken deep link cannot be patched — only regretted.
- **A kill switch per campaign type.** When something looks wrong mid-run — spiking failures, a bad template — operators pause one campaign without freezing transactional messages. Granular brakes get used; global brakes get debated while the damage continues.

## The mental model

The durable lesson: **treat the messaging channel as a budget denominated in user patience, spent through platform quotas.** Quotas are the platform telling you the hard ceiling; the block button is users telling you the real one, and it's lower. Every gate in the pipeline exists to keep spending under the second ceiling, not the first.

If you're building one of these: centralize sending so the rules are structural, make the send log the backbone (dedup, resume, and accounting are all the same table), evaluate eligibility late, and give the per-user cap authority over every campaign. The pipeline's job isn't to deliver as many messages as possible — it's to still be welcome next month.
