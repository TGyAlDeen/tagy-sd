---
title: "The lock contention that wasn't in the query plan"
description: "Up to a thousand concurrent Go workers, each upserting its own user's rows in MySQL — and InnoDB kept detecting deadlocks between them. What was actually locked, and the deliberately boring fix."
pubDate: "Aug 30 2026"
heroImage: "/blog/hero-locks.svg"
---

Of every bug I've debugged, my favorite — in the way you can only love a bug after it's fixed — is the one where the database was doing exactly what it promised and I simply didn't believe it. The setup: a nightly recommendation-notification job in Go, fanning out across as many as a thousand concurrent goroutines, each one writing *its own user's* rows in a MySQL (InnoDB) table — an upsert of that user's schedule row, plus a few log inserts, in a short transaction. Different workers, different users, different rows, no overlap by construction. And yet under load the job kept tripping over itself: **deadlocks detected by InnoDB**, transactions picked as victims and rolled back, workers waiting on locks for rows no other worker was touching. That's not supposed to happen — everyone knows InnoDB does row-level locking.

"Row-level locking" turned out to be a phrase I'd been using without owning the details.

## The symptom, precisely

- Each worker ran a modest transaction: `INSERT ... ON DUPLICATE KEY UPDATE` on the schedule table, keyed by its own user ID, followed by log inserts.
- At low concurrency, everything was fine. As the fan-out grew, deadlock errors appeared — InnoDB detecting a cycle and rolling one transaction back — alongside plain lock waits.
- Retrying the victims "worked," which is exactly the trap: the job limped through while spending its time re-running rolled-back work.

The instinctive suspects (long transactions, missing commits, application-level locks) all checked out clean. The collisions were real and they were inside InnoDB.

## What was actually locking

The diagnosis starts with reading the engine's own account instead of theorizing above it — `SHOW ENGINE INNODB STATUS` prints the full story of the latest detected deadlock, including which lock each transaction held and which it was waiting for. The mechanism, once you read it plainly:

- InnoDB locks **index entries and the gaps between them**, not abstract rows. What gets locked depends on the index the statement traverses.
- An upsert is not a point write. `INSERT ... ON DUPLICATE KEY UPDATE` has to check the unique key and defend the result, and at the default `REPEATABLE READ` isolation that involves **next-key and gap locks** on the index range around the key — plus an **insert-intention lock** when inserting into a gap.
- Run hundreds of those concurrently against neighboring keys and you get the textbook cycle: worker A holds a gap lock covering the range worker B wants to insert into, B holds one covering A's, and each is now waiting for the other's insert-intention to clear. Deadlock — detected, one victim rolled back.

"Different rows" was true at the logical level and irrelevant at the index level: the workers weren't fighting over rows at all, but over *overlapping ranges* of the same unique index.

## The fix menu, and the boring choice

Options, roughly in ascending order of cleverness:

1. **Serialize the conflicting writes** — one writer at a time through the critical section, behind an application-level mutex.
2. **Batch the writes into one statement** — a single multi-row upsert instead of hundreds of concurrent single-row ones.
3. **Restructure the claim pattern** — separate insert and update paths, or claim by exact primary key before writing.
4. **Drop to `READ COMMITTED`** for the transaction, which disables most gap locking — with its own semantics to re-review.

We chose option 1, plus one honest admission: **cap the fan-out**. The final shape was a bounded worker pool with a process-wide `sync.Mutex` held around the transaction's DB writes — and, just as importantly, the push-message send moved *outside* the critical section, so the lock guarded milliseconds of SQL rather than a network call to the messaging platform.

It reads like an anti-climax, and that's why I'm writing it up. The honest inputs: this was a nightly batch whose deadline was "before morning," not a latency-critical path; the parallelism being defended was *already* negative-sum — the workers spent their concurrency waiting on each other's gap locks and re-running rolled-back transactions; and options 2–4 each meant riskier changes to a working job for a performance envelope nobody needed. Concurrency for the expensive part (composing and sending messages) stayed; concurrency for the cheap part (two SQL statements) was decorative, and removing it was the fix.

## What I keep from this one

- **"Row-level locking" is index-level locking.** The question is never "which rows does this statement change?" but "which index does it walk, and what ranges does that walk lock?" Upserts and inserts are range operations in disguise.
- **The engine will tell you what it locked.** `SHOW ENGINE INNODB STATUS` names the indexes, lock modes, and the exact waits in a detected deadlock; `performance_schema.data_locks` shows the live picture. Twenty minutes there beats a day of theorizing.
- **Gap locks are a feature working as designed.** `REPEATABLE READ` is defending consistency you may not know you're relying on; turning it off is a real decision, not a tuning knob.
- **Match the fix to the required envelope, not to your pride.** A mutex plus a concurrency cap met the batch's deadline with a handful of reviewable lines. The elegant redesign (option 2) stayed on record as the planned successor if volume ever outgrew the single-writer envelope — it hasn't needed to happen.

The bug cost us a stretch of confused staring precisely because the mental model was *almost* right. That's the class of bug worth writing down: the fix was small; the understanding was the deliverable.
