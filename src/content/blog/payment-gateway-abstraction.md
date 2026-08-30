---
title: "One interface, four ways to pay"
description: "Card with 3DS, wallet, convenience store, and direct debit behind a single internal service — how a payment gateway abstraction keeps a provider's quirks out of your order flow."
pubDate: "Jun 28 2026"
heroImage: "/blog/hero-payments.svg"
---

The first payment method is easy to integrate anywhere. It's the third one that teaches you regret. By then the provider's callback vocabulary, retry timing, and error taxonomy have soaked into your order service, and every new method multiplies the mess. On the e-commerce platform I worked on — Go microservices on Cloud Run, orchestrating purchases across several downstream services — we supported four: credit card with 3DS, a wallet, convenience-store payment, and direct debit. What kept that manageable was one decision made early: **no service talks to the payment provider except the payment gateway service.**

## The shape of the boundary

The gateway service owns two translations:

- **Outbound**: internal payment intents (`authorize`, `capture`, `refund`, method-specific parameters) become provider API calls.
- **Inbound**: provider callbacks — success, failure, pending, and every provider-specific in-between — become the same clean internal events every other service already consumes.

Everything upstream of the gateway speaks one language. The order service knows that a payment was authorized; it does not know what a 3DS challenge redirect is, what a convenience-store payment slip number looks like, or that direct debit settles on a different calendar than cards.

```go
// What the rest of the platform sees — one vocabulary, four methods.
type PaymentEvent struct {
    PaymentID string
    OrderID   string
    Method    Method // CARD | WALLET | CVS | DEBIT
    Status    Status // AUTHORIZED | CAPTURED | FAILED | EXPIRED | REFUNDED
    OccurredAt time.Time
}
```

## Why the methods genuinely differ

The abstraction earns its keep because the four methods are not variations on one flow — they are four different state machines:

- **Card + 3DS** is synchronous-ish, with a browser redirect in the middle. The user can abandon the challenge, which is neither success nor failure until a timeout says so.
- **Wallet** hands control to another app and returns via callback. Latency is usually seconds, but the callback can arrive after the user has already navigated away.
- **Convenience store** is the extreme case: the "payment" is a promise. The user gets a slip number and pays at a register — hours or days later, or never. The order flow must park in a pending state with an expiry.
- **Direct debit** settles on bank timelines and can fail *after* everything else has succeeded.

Modeling all of that inside the order service would have meant the order state machine importing four other state machines. Instead, the gateway compresses each into the shared vocabulary: everything is eventually `CAPTURED`, `FAILED`, or `EXPIRED`, and only the gateway knows how long "eventually" is per method.

## Callbacks are the hard part

Provider callbacks arrive with the provider's semantics: sometimes duplicated, occasionally out of order, and always on the provider's schedule. Three rules kept them from causing damage:

1. **Callbacks are treated as untrusted input.** Verified, parsed, and immediately mapped to an internal event — the raw payload stops at the gateway and is stored for audit, not passed along.
2. **Every callback handler is idempotent**, keyed on the provider's transaction ID. Duplicate notifications are a normal Tuesday, not an incident.
3. **Internal events leave through the transactional outbox**, same as every other service on the platform. A callback that updates payment state and the event announcing it commit atomically — the [same pattern that protects order flow](/blog/transactional-outbox-event-driven-microservices/) protects payment flow.

The alternative on rule 3 — publishing directly from the callback handler — is exactly the dual-write bug wearing a payment costume, and payment records are the last place you want silent drift.

## What I'd tell someone building this

- **Put the boundary in from method one**, even when it feels like ceremony. The gateway service was small when it wrapped only cards; it stayed small in concept as three more methods arrived, because each one only touched the gateway.
- **Design the internal vocabulary around your order flow, not the provider's API.** If a provider field doesn't change what your platform does, it doesn't belong in the internal event.
- **Give pending a deadline.** Convenience-store flows taught us that any state a human must act on needs an expiry and a scheduled sweep — "waiting" is a state you manage, not a state you're stuck in.
- **Keep the raw payloads.** When a settlement question arrives weeks later, the stored provider payload answers it; your normalized event was never meant to.

A payment provider integration is a dependency you'll live with for years. The abstraction doesn't make the provider simpler — it makes sure only one service has to know how complicated it is.
