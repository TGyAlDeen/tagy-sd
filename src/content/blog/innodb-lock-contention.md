---
title: "The lock contention that wasn't in the query plan"
description: "Concurrent Go workers updating different rows kept blocking each other in MySQL. A debugging story about InnoDB locking more than the row you asked for — and a deliberately boring fix."
pubDate: "Aug 30 2026"
heroImage: "/blog/hero-locks.svg"
---

Of every bug I've debugged, my favorite — in the way you can only love a bug after it's fixed — is the one where the database was doing exactly what it promised and I simply didn't believe it. The setup: a notification dispatcher in Go, running several concurrent workers, each updating *its own* rows in a MySQL (InnoDB) table. Different workers, different rows, no overlap by construction. And yet: workers stalling on lock waits, dispatch throughput collapsing under load, and the occasional lock-wait timeout in the logs. Updates to distinct rows were blocking one another. That's not supposed to happen — everyone knows InnoDB does row-level locking.

"Row-level locking" turned out to be a phrase I'd been using without owning the details.

## The symptom, precisely

- Each worker ran a modest transaction: `UPDATE ... SET status = ... WHERE <its own criteria>`, touching rows disjoint from every other worker's.
- Under low traffic, everything was fine. As concurrency rose, workers spent more time waiting than working.
- Nothing about it looked like a deadlock; it was serialization — the system quietly degrading to one-worker throughput with extra overhead.

The instinctive suspects (long transactions, missing commits, application-level locks) all checked out clean. The blocking was real and it was inside InnoDB.

## What was actually locking

The diagnosis came from looking at the engine's own account of its locks — `SHOW ENGINE INNODB STATUS` and the lock tables (`performance_schema.data_locks` on modern versions, `information_schema.innodb_locks` back then) during a stall. The locks held were not one record lock per updated row. They were ranges.

The mechanism, once you read it plainly:

- InnoDB locks **index entries, not abstract rows**. What gets locked depends on which index the `UPDATE` traverses.
- If the `WHERE` clause is not served by a selective index, the engine scans — and **every index entry the scan examines gets locked**, not just the entries that match. A poorly-indexed update on a busy table is a rolling lockdown.
- At the default `REPEATABLE READ` isolation, range scans also take **gap / next-key locks** — locks on the *spaces between* index entries, there to keep phantoms out. Two workers whose target rows are distinct can still collide because one worker's next-key range covers the gap the other needs.

Our dispatcher hit the combination: worker criteria that didn't align with a selective index, plus range locking at the default isolation level. "Different rows" was true at the logical level and irrelevant at the index level — the workers were fighting over overlapping index ranges the whole time.

## The fix menu, and the boring choice

Textbook options, roughly in ascending order of cleverness:

1. **Serialize the writers** — one writer at a time behind an application-level mutex.
2. **Index for the access path** so each worker's update touches a narrow, disjoint index range.
3. **Restructure the claim pattern** — e.g., claim rows by primary key first (`SELECT ... FOR UPDATE` on exact keys, or `SKIP LOCKED` where available), then update by key.
4. **Drop to `READ COMMITTED`** for the transaction, which disables most gap locking — with its own semantics to re-review.

We chose option 1: **serialize the writes behind a mutex in the dispatcher.** It reads like an anti-climax, and that's why I'm writing it up. The honest inputs to the decision: write volume was modest (notification state transitions, not a firehose); the contention cost was already worse than single-writer throughput — the "concurrency" being defended was negative-sum; and options 2–4 each meant riskier changes (schema migration on a hot table, rework of claim logic, isolation-level semantics review) for a performance envelope we did not need.

The concurrency had been decorative. Removing it was the fix.

## What I keep from this one

- **"Row-level locking" is index-level locking.** The question is never "which rows does this update?" but "which index does it walk, and what does that walk lock?" `EXPLAIN` your writes, not just your reads.
- **The engine will tell you what it locked** — the lock tables name the index and the lock mode. Twenty minutes there beats a day of theorizing above the database.
- **Gap locks are a feature working as designed.** The default isolation level is defending consistency you may not know you're relying on; turning it off is a real decision, not a tuning knob.
- **Match the fix to the required envelope, not to your pride.** A mutex that meets the throughput target with one line of reviewable code beats an elegant redesign that meets a target nobody set. We wrote the ceiling into a comment — if volume grows past the single-writer envelope, option 3 is the planned successor.

The bug cost us a stretch of confused staring precisely because the mental model was *almost* right. That's the class of bug worth writing down: the fix was one line; the understanding was the deliverable.
