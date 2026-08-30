---
title: "Serving ML recommendations inside a LINE mini-app"
description: "The architecture behind a property-search platform delivered entirely through LINE — Go backend, LIFF mini-apps, an XGBoost inference service, and the batch pipelines that keep recommendations fresh."
pubDate: "Aug 22 2026"
heroImage: "/blog/hero-reco.svg"
---

Ask me what powers a recommendation system, and the honest answer is: mostly not the model. The part of this one I'm proudest of isn't the scoring — it's that a number computed by a Python process at 3 a.m. reliably became a card someone tapped in a chat thread at lunch. That path — score to message, cheap, dependable, inside a chat platform's constraints — is where most of the engineering lives.

I built and ran the backend of a real-estate discovery platform delivered entirely through **LINE** — no native app, no standalone website for end users. Search, favorites, tour booking, and personalized property recommendations all lived inside chat and LIFF mini-apps. Here's how the recommendation path actually worked, end to end.

## The overall architecture

Four services, each with one job:

| Component | Stack | Role |
|---|---|---|
| Main backend | Go / Echo | 60+ REST endpoints for the LIFF apps; owns users, listings, reservations |
| Inference service | Python / FastAPI / XGBoost | Scores (user, property) pairs |
| Admin panel | PHP / Laravel | Internal ops: listings, reservations, staff |
| Batch jobs | Go on ECS (scheduled tasks) | Recommendation precompute, notification campaigns, master-data import |

Data lived in Aurora MySQL with ElastiCache Redis in front; infrastructure was ECS Fargate behind an ALB with WAF and CloudFront, all managed with Terraform, with an external property-management system integrated over authenticated REST for listing data and reservation sync.

The Go/Python split was deliberate. The data-science side needed the Python ecosystem — the model was XGBoost, trained on user demographics, geography, and interaction history. The product side needed Go's concurrency and deployment simplicity for the API tier. Drawing the boundary at *"the inference service scores; the backend decides"* kept both teams fast.

## Why gradient boosting, not embeddings

The catalog was new-build properties: a few thousand active listings, each rich in structured attributes (location, price band, layout, developer, completion date). Users arrived with structured attributes of their own — family composition, workplace area, budget signals. This is tabular-matching territory, and **gradient-boosted trees on engineered features beat fancier approaches** on data like this while staying explainable and cheap to retrain.

The feature vector for a (user, property) pair combined:

- **User attributes** — demographics, declared preferences, home-area geography
- **Property attributes** — price, size, station distance, completion timing
- **Interaction features** — the crosses that carry most of the signal: budget fit, commute-geography match, layout vs. household size
- **Behavioral signals** — favorites, viewed listings, tour history

Cold start — most users, since people don't shop for homes weekly — degraded gracefully to attribute matching alone, which is exactly the regime where a tree model is comfortable.

## Precompute, don't score at request time

The single most important architectural decision: **recommendations were computed by scheduled batch, not at request time.**

A nightly ECS task walked active users, assembled candidate sets (geography and budget filters cut a few thousand listings to a few hundred per user), called the inference API in batches, and wrote ranked results to MySQL with Redis caching the hot path. The API tier then served recommendations as a simple indexed read — the same latency profile as any other endpoint.

![Animated diagram: two decoupled lanes — a slow 3 a.m. batch lane scoring candidates and writing ranked results to cache, and a fast lunchtime request lane reading the cache and rendering a card carousel](/blog/inline-precompute.svg)

Real-time scoring was the more sophisticated-sounding option. Precompute won on every axis that mattered here:

- **Freshness didn't require it.** Property inventory changes daily, not per-second. A nightly cycle plus event-triggered refreshes on catalog changes was genuinely fresh enough.
- **Failure isolation.** If the inference service fell over at 3 a.m., the batch retried; users never saw an error. In a request-path design, an ML outage becomes a product outage.
- **Push notifications need batch anyway.** The campaign pipeline — "new properties match your profile" — walks users, checks scores, and sends messages. That *is* a batch job; making the serving path share its output meant one recommendation source of truth instead of two drifting ones.

## The LINE delivery layer

The chat platform is not a browser, and treating it like one produces clumsy products. The pieces that mattered:

- **LIFF mini-apps** for anything form-like or list-like — search, filters, favorites, booking. From the backend's perspective they're just web clients hitting REST endpoints with a platform ID token; verify the token, map the platform user to your user, proceed as normal.
- **Flex Message carousels** for recommendation delivery in chat. A recommendation push isn't a link — it's a swipeable card carousel rendered natively in the conversation, each card deep-linking into the LIFF detail view. Click-through lives or dies on this rendering.
- **Rich menu + chatbot flows** as navigation, so users could reach every feature without ever typing.
- **Rate-limited push campaigns.** Messaging APIs meter you, and users churn hard on notification spam. Campaign batches were throttled, deduplicated against recent sends, and capped per user per period. On a chat platform, over-messaging is the fastest way to lose the channel entirely — the user blocks you and every future recommendation with you.

One operational lesson from the API tier: with Go's concurrency it's tempting to fan out — score check here, favorite lookup there. Most of our production issues in that layer were nil-safety and lock-contention bugs from unnecessary parallelism. Boring sequential handlers with Redis in front turned out faster *and* more debuggable than clever ones.

## What made it work

Looking back, the system's quality came from three boundaries, not from the model:

1. **Inference is a service with an API contract** — the model can be retrained, swapped, or A/B'd without the product tier knowing.
2. **Serving is decoupled from scoring** — batch precompute means user-facing latency and ML availability are independent problems.
3. **The channel is a first-class constraint** — recommendations were designed for how people actually receive them (a card carousel in a chat thread), not as an afterthought bolted onto a generic API.

The model was maybe 20% of the work. The other 80% was making sure a score computed at 3 a.m. became a card a user tapped at lunch — and that nothing between those two moments could take the product down.
