---
title: "Two outboxes, one pattern"
description: "Cloud Tasks for commands, Pub/Sub for events — same transactional outbox, same relay shape, same HTTP delivery. The only real fork is the middle layer, and who owns the routing."
pubDate: "2026-09-01"
heroImage: "/blog/hero-two-outboxes.svg"
---

I've come to judge async architectures by one question: **when a new service needs to react to something, whose Terraform changes?** On the platform where I learned to ask it — a dozen Go microservices on Cloud Run with Cloud Spanner underneath — the answer split the whole messaging design cleanly in two, and the split taught me more about commands versus events than any book had.

Every async hop in that system is the same move: write the message into Spanner *inside the business transaction*, let a relay push it onto a managed GCP service, receive it back as an authenticated HTTP POST. The [transactional outbox](/blog/transactional-outbox-event-driven-microservices/) covers why the first step matters. This post is about the fork in the middle: **Cloud Tasks for point-to-point commands, Pub/Sub for fan-out events** — and why the interesting difference isn't throughput or semantics, but ownership.

## The shared pattern

A service never publishes directly. It inserts a row into one of two outbox tables — `tasksMessages` or `pubsubMessages` — in the same Spanner transaction as its business data, so a message can never exist without its data or vice versa. A dedicated single-instance Cloud Run relay per table polls for unpublished rows and hands them to the managed service. And on the receiving end, consumers never run queue-client code: delivery is always an OIDC-signed HTTP POST to a normal route behind the load balancer.

That last property is worth pausing on. Because both paths deliver as plain HTTP, a message handler is just an endpoint — same middleware, same auth context propagation, same logging, same local testing story as any synchronous route. The messaging infrastructure is invisible at the point where business logic lives.

## The fork: who owns the routing

In Spanner the two message rows look almost identical. The tell is one field, and where the Terraform lives:

| | Cloud Tasks — command | Pub/Sub — event |
|---|---|---|
| Routing field | `queueId` → one pre-bound endpoint | `topicId` → broadcast channel |
| Destination lives in | the **producer's** Terraform — queue and target path defined together | each **consumer's** Terraform — its own subscription, its own path |
| Producer knows receivers? | Yes — it even builds the HTTP headers | No — zero knowledge of subscribers |
| Copies delivered | exactly one handler | one per subscription |
| Flow control | per-queue dispatch rate + concurrency caps | none per consumer — push scales up |
| Dedup | task ID = message ID; duplicate enqueue returns `AlreadyExists` | none — consumers must be idempotent |
| Adding a receiver | change the producer's infra | consumer adds a subscription; producer untouched |
| Semantics | "call this endpoint later, with retries" | "this happened; react if you care" |

Read the third row twice — it's the whole distinction. A **command** is the producer's business: it knows exactly who must act, so the destination belongs in the producer's config. An **event** is the consumers' business: the producer names a fact (`user-account-created`) and every interested service attaches itself in its *own* infrastructure. The platform's tech policy made Cloud Tasks the default for all async work, reserving Pub/Sub for the handful of genuine domain events where multiple services must react — which kept "should this be an event?" a deliberate design conversation instead of a default.

## Path A in action: a service queuing work for itself

The cleanest command example has the producer and consumer as the *same service*. When an external partner posts an order-completion notification, the commerce service inserts the business rows and a task row in one transaction and returns 200 immediately. The relay picks up the row, buffers a task, and Cloud Tasks POSTs it back — to a different endpoint *on the same service* — where the heavy work happens: confirmation email through the mail gateway, payment capture through billing.

The partner's request ends at the database commit. Everything expensive rides the task, with retries on non-2xx and per-queue rate limiting — durability for work that had no business running inside someone else's HTTP request.

## Why the dedup rule exists: the relay crash window

Setting the Cloud Tasks task ID to the outbox `messageId` closes a precise gap:

1. Relay reads the row and creates the task in Cloud Tasks.
2. Relay crashes **before** writing `publishedAt` back to Spanner.
3. Next tick, the row still looks unpublished — the relay creates the task again.
4. Cloud Tasks sees the same task ID and rejects with `AlreadyExists`.
5. The relay treats that as success and marks the row published.

Without that one line — the relay explicitly ignoring `AlreadyExists` — every relay crash could double-send order emails or double-capture payments. Pub/Sub has no equivalent mechanism, which is exactly why the policy's other half exists: Pub/Sub consumers must be idempotent themselves.

## Path B in action: signup fan-out

When a user signs up, the identity service inserts the user rows *and* the event row in one transaction, naming only a topic. The relay publishes it, and the push subscriptions deliver a copy each: the points service initializes an account, the notification service creates default settings — and the identity service *itself* subscribes, assigning a referral code in a handler of its own.

That last subscription is my favorite detail in the whole design. The producer subscribing to its own topic proves the decoupling is real: even the producer's *own* follow-up work rides the event rather than the signup transaction. Signup stays a minimal atomic write; everything downstream — including downstream-in-the-same-service — is a reaction. And when a new service later needed to react to signups, the change was one subscription in that service's Terraform. The identity service never knew.

## One transport to rule them out

A closing observation that shaped how the whole system felt to operate: **there is no gRPC anywhere.** Sync APIs, Cloud Tasks dispatch, Pub/Sub push — every service-to-service call is HTTP/JSON with OIDC tokens and an authentication-context header propagated through. gRPC appears only inside the cloud SDKs and local emulators. One transport means one middleware stack, one way to read a trace, one way to `curl` a handler in anger — and it's what makes "consumers are just endpoints" true for the async paths too.

The decision rule I carry forward: **route commands through infrastructure the producer owns; route events through infrastructure the consumers own.** If you can't decide which side of the table a message sits on, you haven't yet decided whether the producer is allowed to know who's listening — and that, not the queue technology, is the actual architectural choice.
