---
title: "The push pipeline that didn't get blocked"
description: "Notification campaigns as scheduled batch jobs: eligibility and dedup pushed into the audience query, a send log that doubles as the resume checkpoint, throttling against platform quotas — and the two gates I'd add today."
pubDate: "2026-08-28"
heroImage: "/blog/hero-push.svg"
---

The scariest failure mode of a notification system isn't an outage. An outage you notice, fix, and apologize for. What kept me careful was the quiet failure: send a little too much, a little too often, and users don't file a complaint — they tap "block," and the entire channel to that person closes permanently. On a chat-platform product where messaging *was* the product surface, the push pipeline was effectively holding the company's only key to every customer relationship. We built it like that key could not be re-cut — and, as you'll see at the end, left two locks unbuilt that I'd add today.

## The architecture: campaigns are scheduled batch jobs

All outbound campaigns ran as **scheduled batch jobs on ECS**, each on its own cadence: tour reminders every half hour, a satisfaction-survey push daily in the evening, new-listing recommendation pushes weekly, a second recommendation flavor twice a week, with a nightly master-data-and-scoring pass feeding them. Ad-hoc sends from application code weren't a thing — product code raised state; the jobs decided who hears about it.

Two pieces were structural rather than per-campaign:

- **One send gateway.** Every push, from every job, went through the same send function — which also carried an environment-level allowlist gate, so non-production environments physically couldn't message real users. Safety rules you route around aren't rules; the single door made them structural.
- **The database as both audience and ledger.** Each campaign's targets came from a SQL query, and each send was recorded in a notification/status table. That one design choice quietly powers most of what follows.

## The gates that did the work

1. **Eligibility, evaluated at send time.** The audience query ran when the job ran — opt-outs, completed reservations, stale profiles all fell out naturally. Criteria evaluated at enqueue time go stale; evaluating at the gate means never messaging someone about a thing that's no longer true.
2. **Dedup, pushed into the audience query.** "Already sent" wasn't an application-level check — it was a `NOT EXISTS` clause against the prior-sends table, so a user who'd already received this campaign never entered the batch at all. Cheapest possible rejection: the duplicate is filtered before a single row of work is done.
3. **The send log as resume checkpoint.** Jobs recorded per-notification status and only ever selected not-yet-done rows. A campaign that died mid-run could be re-run without re-sending to the first half of the audience — restart-safety as a property of the query, not a recovery procedure. Batch jobs fail; pipelines that assume otherwise page you at the worst hour.
4. **Throttle against the platform's quota, with headroom.** The heavy campaign ran on a bounded worker pool and deliberately paused after every thousand pushes, staying well inside the messaging platform's documented rate limit instead of slamming it and eating errors mid-batch.

Templates got the same discipline as everywhere else on this platform: composed server-side, versioned like code — a campaign message with a broken deep link cannot be patched, only regretted.

## The two gates I'd add today

Honesty section. Two protections this pipeline *didn't* have, and the design lesson in each:

- **A per-user frequency cap across all campaigns.** Each job had its own sensible windows and exclusions, but nothing represented the user's *total* inbox: four individually-reasonable campaigns can still sum to an unreasonable week. The cap belongs above every campaign, in the shared gateway, precisely because no single campaign owner is positioned to enforce it.
- **A per-campaign kill switch.** The environment allowlist could stop *everything*, but there was no brake for *one* misbehaving campaign while transactional messages kept flowing. Granular brakes get used; global brakes get debated while the damage continues. It's a small feature with an outsized incident-response payoff, and the shared send gateway is exactly where it slots in.

Neither gap ever burned us — cadences were conservative and audiences well-cut — but both are the kind of control you want *before* the incident that proves you needed it.

## The mental model

The durable lesson: **treat the messaging channel as a budget denominated in user patience, spent through platform quotas.** Quotas are the platform telling you the hard ceiling; the block button is users telling you the real one, and it's lower. Every gate above — and both missing ones — exists to keep spending under the second ceiling, not the first.

If you're building one of these: centralize sending so rules are structural, make the send log the backbone (dedup, resume, and accounting want to be the same table), evaluate eligibility late, push exclusions into the audience query — and build the cross-campaign cap and the kill switch on day one, while they're cheap. The pipeline's job isn't to deliver as many messages as possible — it's to still be welcome next month.
