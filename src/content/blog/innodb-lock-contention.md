---
title: "The lock contention that wasn't in the query plan"
description: "Up to a thousand concurrent Go workers, each upserting its own user's rows in MySQL — and InnoDB kept detecting deadlocks between them. The gap-lock mechanics, the fix menu ranked, and the deliberately boring choice."
pubDate: "2026-08-30"
heroImage: "/blog/hero-locks.svg"
---

Of every bug I've debugged, my favorite — in the way you can only love a bug after it's fixed — is the one where the database was doing exactly what it promised and I simply didn't believe it. The setup: a nightly recommendation-notification job in Go, fanning out across as many as a thousand concurrent goroutines, each one writing *its own user's* rows in a MySQL (InnoDB) table — an upsert of that user's schedule row, plus a few log inserts, in a short transaction. Different workers, different users, different rows, no overlap by construction. And yet under load the job kept tripping over itself: **deadlocks detected by InnoDB**, transactions picked as victims and rolled back, workers waiting on locks for rows no other worker was touching. That's not supposed to happen — everyone knows InnoDB does row-level locking.

"Row-level locking" turned out to be a phrase I'd been using without owning the details.

## The symptom, precisely

- Each worker ran a modest transaction: `INSERT ... ON DUPLICATE KEY UPDATE` on the schedule table, keyed by its own user ID, followed by log inserts.
- At low concurrency, everything was fine. As the fan-out grew, deadlock errors appeared — InnoDB detecting a cycle and rolling one transaction back — alongside plain lock waits.
- Retrying the victims "worked," which is exactly the trap: each retry re-enters the same lottery, so the job limped through while spending its concurrency doing work, getting rolled back, and redoing it.

The instinctive suspects (long transactions, missing commits, application-level locks) all checked out clean. The collisions were real and they were inside InnoDB.

## What was actually locking

The diagnosis starts with reading the engine's own account instead of theorizing above it — `SHOW ENGINE INNODB STATUS` prints the full story of the latest detected deadlock, including which lock each transaction held and which it was waiting for.

The core misconception first. InnoDB doesn't lock *rows*; it locks **index entries and the gaps between them**. Picture the unique index on `user_id` as a number line with existing entries:

```
... [517] ---gap--- [519] ---gap--- [524] ---gap--- [530] ...
```

Three lock kinds live on this line:

- **Record lock** — one index entry. This is the thing people mean by "row lock."
- **Gap lock** — the *empty space between* entries. Its job is stopping phantoms: at the default `REPEATABLE READ` isolation, once a transaction has examined a range, nobody may insert into it until that transaction ends. A **next-key lock** is a record lock plus the gap before it, and it's what statements actually take at this isolation level.
- **Insert-intention lock** — a transaction's signal that it's about to insert into a gap. Insert intentions are compatible with each other, but they **must wait behind any gap lock covering that spot**.

Now the upsert. `INSERT ... ON DUPLICATE KEY UPDATE` is not a point write — it has to check whether the unique key exists, then insert or update, then *defend* that answer for the rest of the transaction. The defense is next-key/gap locks around the key's position. Run hundreds of those concurrently against neighboring keys and the textbook cycle assembles itself:

```
worker A (user 519):  holds a gap lock covering (517, 524)
worker B (user 524):  holds a gap lock covering (519, 530)

A: wants insert-intention inside B's range  → waits on B
B: wants insert-intention inside A's range  → waits on A   → cycle
```

Each holds what the other needs. InnoDB's deadlock detector spots the cycle in milliseconds, picks a victim, and rolls it back with error 1213. "Different rows" was true at the logical level and irrelevant at the index level: the workers were never fighting over rows — they were fighting over *overlapping ranges* of the same compact unique index, and a thousand workers on a compact `user_id` range guarantees overlap.

## The alternatives, ranked

A deadlock needs two transactions holding conflicting locks at the same time; every real fix removes one ingredient. The menu, in the order I'd reach for them today:

1. **Serialize the conflicting writes in-process** — one writer at a time through the critical section, behind a `sync.Mutex`. Three lines, deadlock impossible within the process.
2. **Producer/consumer: N workers, one DB writer.** Keep the parallel fan-out for the expensive work, but send results down a channel to a single writer goroutine that flushes in batches ("every 500 rows or 2 seconds"). Same single-writer property as the mutex, expressed in the architecture instead of hidden in a lock — and the batching makes it faster, not just safer.
3. **Phase-split with bulk writes.** Do all the parallel work first; then one multi-row `INSERT ... ON DUPLICATE KEY UPDATE` (chunked, **sorted by key** — two bulk upserts hitting rows in different orders is itself a classic deadlock) writes everything. One statement per chunk means fewer round-trips and no inter-worker conflict at all, and it stays correct even if the job later runs as several containers.
4. **Split insert from update.** The gap-lock storm exists because the upsert doesn't know whether the key exists. If the rows are pre-created once (a single bulk insert at job start), every worker's write becomes a plain `UPDATE ... WHERE user_id = ?` — a record lock on one entry, no gap lock, full parallelism preserved. Subtle, though: it's safe *because of* the pre-create, and the next refactor that "simplifies" it back to an upsert silently reintroduces the bug.
5. **Drop to `READ COMMITTED`** for the job's transactions, which disables most gap locking. One line — and a semantics change (phantom protection is gone inside the transaction) that's easy to misapply per-connection and teaches nobody anything.

| Option | Deadlock-proof | Throughput | Complexity | Survives multiple instances |
|---|---|---|---|---|
| 1 · mutex | in-process only | fine | ~3 lines | no |
| 2 · single-writer channel | in-process only | better (batching) | small | no |
| 3 · phase-split bulk | structurally | best | moderate rework | yes |
| 4 · pre-create + UPDATE | yes, subtly | best parallel | small but fragile | yes |
| 5 · isolation drop | mostly | fine | 1 line, hidden cost | partly |

## The boring choice, and why it held

We chose option 1: **cap the fan-out and serialize the DB writes behind a process-wide mutex** — with the push-message send moved *outside* the critical section, so the lock guarded milliseconds of SQL rather than a network call to the messaging platform. The expensive part of every iteration (composing and sending messages) stayed fully parallel; the cheap part (two SQL statements) went single-file.

The honest inputs: this was a nightly batch whose deadline was "before morning," not a latency-critical path. The parallelism being defended was *already* negative-sum — the workers spent their concurrency waiting on each other's gap locks and re-running rolled-back transactions, so single-file SQL was faster in practice, not slower. And options 3–5 each meant riskier changes to a working job for a performance envelope nobody needed.

The mutex's known ceiling is written into the design: it serializes only within one process, so it stops working the day the job runs as multiple parallel containers. For a single scheduled task that was acceptable, and the phase-split bulk write (option 3) sits on record as the planned successor — with option 2 as the low-ceremony middle step if the batch merely grows within one process.

## What I keep from this one

- **"Row-level locking" is index-level locking.** The question is never "which rows does this statement change?" but "which index does it walk, and what ranges does that walk lock?" Upserts and inserts are range operations in disguise.
- **The engine will tell you what it locked.** `SHOW ENGINE INNODB STATUS` names the indexes, lock modes, and the exact waits in a detected deadlock; `performance_schema.data_locks` shows the live picture. Twenty minutes there beats a day of theorizing.
- **Gap locks are a feature working as designed.** `REPEATABLE READ` is defending consistency you may not know you're relying on; turning it off is a real decision, not a tuning knob.
- **Match the fix to the required envelope, not to your pride.** A mutex plus a concurrency cap met the batch's deadline with a handful of reviewable lines, and the ranked menu above stayed in the design notes for the day the envelope changes.

The bug cost us a stretch of confused staring precisely because the mental model was *almost* right. That's the class of bug worth writing down: the fix was small; the understanding was the deliverable.
