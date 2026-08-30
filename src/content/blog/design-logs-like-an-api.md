---
title: "Design your logs like an API"
description: "Business questions answered from CloudWatch Logs Insights: log-line contracts, why enriching an existing line beats adding a new one, JSON-escaping gotchas, and the retention trap."
pubDate: "Aug 26 2026"
heroImage: "/blog/hero-logs.svg"
---

The question that changed how I write log lines was not technical. It was a stakeholder asking, "how many uploads failed yesterday — and how many of those were the customers' own mistakes?" No dashboard had it. No table kept it — by design, processed records were purged on a schedule. The only artifact that reliably remembered was the logs, and whether logs can answer a business question depends entirely on decisions someone made months earlier, casually, while typing a log statement.

That's the thesis: **a log line consumed by queries is an API.** It has consumers, a schema, and compatibility obligations — it just isn't treated like one until the first hard question arrives.

## What made the questions answerable

The platform was a serverless batch pipeline (Lambda, SQS stages) whose steps logged structured JSON with stable message codes. The lines that ended up mattering had three properties worth copying:

1. **A stable, greppable code per event type** — `filter message like /MSG_RESULT_SUMMARY/` survives wording changes; `filter message like /finished processing/` dies the first time someone "improves" the sentence.
2. **The payload that matters, inline.** The summary line for each processed batch carried the per-record outcomes — `[{"id":519,"status":"REGISTER_ERROR"}, …]` — so a count is a query, not a join across systems.
3. **Logged at a boundary, before anything else can fail.** The summary was emitted at message-receipt, before validation could reject anything. Log lines that fire inside conditional branches inherit every bug of those branches.

With that, Logs Insights answered daily error/success totals in one query. Then the follow-up question — *which* failures belonged to which audience — exposed the limits.

## Enrich the line you have, don't add a new one

The outcome payload didn't distinguish audiences (in our case: whether a failure notification went to an end customer or to an internal operator). The dispatch code knew; the logs didn't record it. First attempt: emit a *new* log line at the decision point. It worked, and it was still the wrong call — review pushed back, and the pushback was right:

- A new line means every existing query, and every future consumer, must now correlate two lines per record.
- The new line can fire at a different rate than the old one (retries, partial failures), so counts drift subtly apart.
- The old line remains incomplete forever.

The better fix was one field: stamp `"type":"user"` or `"type":"admin"` onto each entry in the payload the summary line *already* logged. Every existing query kept working; the new question became a filter. **Widening an existing contract beats adding a parallel one** — the same rule as API design, for the same reasons.

Backward compatibility was also the same problem it always is: in-flight messages produced by the old code lacked the field, so validation had to treat it as optional. Schema evolution doesn't stop being schema evolution just because the transport is a log stream.

## The gotchas that cost real hours

- **Serializer escaping breaks naive matching.** Our logger emitted JSON; the payload was an array *embedded in* the message string, so its quotes arrived backslash-escaped in the raw line. The obvious query — `filter message like /"status":"REGISTER_ERROR"/` — matched nothing. Counting bare tokens (and substring-length arithmetic for per-line counts) worked; assuming your log line looks like what you typed did not. Test queries against real stored lines, never against what the code appears to print.
- **Log timestamps live in UTC; your stakeholders don't.** Every "daily" count needs the timezone offset applied deliberately, once, in the query — not rediscovered per incident.
- **Retention is a one-way door.** The database was no fallback: operational tables were hard-deleted on a short schedule, and log retention had its own window. Whatever isn't in the line when it's written is unrecoverable for the entire pre-fix period. We could derive one audience cleanly for history (its address pattern was distinctive) but not the other — a permanent asymmetry caused by a missing field.

## Make it a team asset

The queries themselves became a maintained, bilingual manual kept with the project: each recipe with the question it answers, the message code it depends on, and its known limits. Two effects. Tribal knowledge stopped being tribal — the person who wrote the query stopped being a dependency. And the manual functions as a **consumer registry**: before anyone edits a log line, one grep shows which questions break.

The checklist I now apply to any log line that might ever be counted: stable code, self-contained payload, emitted at a boundary, evolved by widening, verified against stored reality, documented with its consumers. It's fifteen minutes of care per line — purchased at that price, or later at the price of a question you can no longer answer.
