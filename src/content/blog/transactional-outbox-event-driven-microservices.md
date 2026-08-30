---
title: "Event-driven microservices without losing events: the transactional outbox in practice"
description: "How we kept orders, payments, and downstream services consistent on Cloud Run and Spanner using the transactional outbox pattern and task-queue relay workers — and what we'd do differently."
pubDate: "Jun 14 2026"
heroImage: "/blog/hero-outbox.svg"
---

My least favorite class of production bug doesn't crash anything. A payment gets captured, an order stays frozen, no alarm fires — the system just quietly disagrees with itself. And nearly every time I've chased one, it traced back to two innocent-looking lines of code: commit the row, then publish the event. If the process dies between those two lines, downstream services never hear about the order. Flip the order, and a rollback means they hear about an order that doesn't exist.

On a consumer e-commerce platform I worked on — Go microservices on Cloud Run, Cloud Spanner as the primary database, roughly a dozen services orchestrating multi-step purchase flows against several downstream systems including a payment gateway — the dual write was exactly the failure mode the money path could not afford: a payment captured with no corresponding order transition, or an order stuck waiting for an event that was never published — drift you discover in a reconciliation query, not an alert.

The fix was boring, well-documented, and completely effective: the **transactional outbox**.

## The core idea

Instead of publishing to a message bus as a side effect, you write the event *into the same database transaction* as the state change:

```sql
-- One Spanner read-write transaction
INSERT INTO Orders (OrderId, Status, ...) VALUES (@id, 'CONFIRMED', ...);
INSERT INTO OutboxEvents (EventId, Topic, Payload, CreatedAt, PublishedAt)
VALUES (@eventId, 'order.confirmed', @payload, PENDING_COMMIT_TIMESTAMP(), NULL);
```

Either both rows exist or neither does. The database's atomicity — the one guarantee you already paid for — now covers your messaging too.

A separate **relay worker** then reads unpublished rows and pushes them out. We used Cloud Tasks as the delivery mechanism: the relay enqueues a task per event targeting the consumer's endpoint, marks the row published, and lets the task queue handle retries with exponential backoff.

```go
func (r *Relay) Tick(ctx context.Context) error {
    events, err := r.repo.FetchUnpublished(ctx, batchSize)
    if err != nil {
        return err
    }
    for _, ev := range events {
        if err := r.tasks.Enqueue(ctx, ev); err != nil {
            return err // leave the row; next tick retries
        }
        if err := r.repo.MarkPublished(ctx, ev.ID); err != nil {
            return err // task may fire twice — consumers must dedupe
        }
    }
    return nil
}
```

That comment on the last error path is the whole contract: **the outbox gives you at-least-once delivery, never exactly-once**. If the relay crashes between enqueue and mark-published, the event goes out twice. Chasing exactly-once at the transport layer is a losing game; you push the problem to consumers instead.

## Idempotent consumers are half the pattern

At-least-once delivery only works if redelivery is harmless, and each domain enforced that in its own terms — the relay checks a published flag before enqueuing and swallows the task queue's duplicate error; the payment path dedupes on an idempotency key per request. The shape that generalizes, and the one worth copying, is a dedupe record committed with the state change:

```go
// Inside the consumer's own transaction
applied, err := s.repo.TryRecordEvent(ctx, ev.ID) // INSERT OR IGNORE semantics
if err != nil || !applied {
    return err // duplicate — ack and move on
}
// ... apply the state change in the same transaction
```

The dedup record and the state change commit atomically, which means the consumer has its own miniature outbox-in-reverse. Wherever a consumer held this line, duplicates became a non-event — literally.

![Animated diagram: a task queue redelivers event e-42 to a consumer; the first delivery commits the dedupe row and the state change in one transaction, the redelivery is recognized and ignored](/blog/inline-idempotent.svg)

## Orchestrating multi-step flows

Purchase flows spanned several services: reserve inventory, authorize payment, confirm the order, trigger fulfillment, send notifications. We deliberately did **not** reach for a saga framework. Each step was an event → idempotent handler → next event chain, with the outbox guaranteeing no link ever silently dropped.

Two design rules kept this manageable:

1. **Events carry facts, not commands.** `order.confirmed`, not `send_email_please`. Consumers decide what a fact means for them, which keeps producers ignorant of their audience and lets you add consumers without touching the producer.
2. **Every flow has a single owner service.** One service owns the order state machine and is the only writer of order-lifecycle events. Others react. When something goes wrong at 2 a.m., there is exactly one place to look for "what state is this order actually in."

For the payment gateway specifically, we isolated all card, wallet, and convenience-store payment methods behind a dedicated gateway-abstraction service. External payment providers have their own retry semantics, callbacks, and failure vocabulary; letting that leak into the order service would have coupled our core state machine to a third party's quirks. The gateway service translated provider callbacks into the same clean internal events everything else consumed.

## Operational notes

A few things that mattered more in production than in the design doc:

- **Outbox table growth.** Published rows were deleted by a scheduled job after a retention window. Spanner handles large tables fine, but an unbounded outbox slows the relay's `FetchUnpublished` scan. Index on `(PublishedAt, CreatedAt)` and keep the working set small.
- **Ordering.** Task queues don't guarantee order. Where sequence mattered (state machine transitions), consumers validated the transition rather than trusting arrival order — an out-of-order `order.shipped` before `order.confirmed` gets parked and retried, not applied.
- **Observability.** The relay exports `oldest_unpublished_age` as a metric. That single gauge catches almost every failure mode: relay stuck, task queue backed up, consumer erroring. Alert on age, not on queue depth.
- **Context cancellation.** One subtle production bug: an outbound HTTP call wrapped in a goroutine kept running after the request context was cancelled, producing half-applied side effects. The fix was to stop being clever — propagate the caller's context and let cancellation actually cancel.

## What I'd do differently

If I were starting again, I'd generate the outbox plumbing. We hand-wrote the relay and repository code per service early on, and the drift between implementations caused most of the friction. We later consolidated on a shared internal library plus a DAO code generator, and the pattern became nearly free to adopt.

I'd also introduce the pattern *before* the first consistency incident, not after. The outbox costs one extra table and one small worker. The alternative costs you a weekend reconciling order and payment records with a SQL script — and your users' trust in checkout.

Dual writes are a bug you haven't hit yet. Write the event in the transaction.

---

*This post anchors a short series on the same platform: [One interface, four ways to pay](/blog/payment-gateway-abstraction/), [Service-to-service auth without a service mesh](/blog/cloud-run-sidecar-auth/), and [When a goroutine is the wrong tool](/blog/context-cancellation-postmortem/).*
