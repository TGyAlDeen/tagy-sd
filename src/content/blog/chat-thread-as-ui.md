---
title: "Building a product where the UI is a chat thread"
description: "LIFF token verification, Flex Message carousels, rich menus, and chatbot flows as routing — chat-platform engineering as a backend discipline."
pubDate: "Aug 24 2026"
heroImage: "/blog/hero-chat.svg"
---

The strangest design review I've been part of had no screens in it. The "UI" under discussion was a chat thread: a rich menu, a handful of message templates, and mini-app panels that opened inside the conversation. I built the backend of a property-search product that lived entirely inside **LINE** — users discovered listings, saved favorites, and booked viewing tours without ever installing an app or opening a browser tab in the usual sense. Working on it convinced me that chat-platform engineering is a backend discipline wearing a frontend costume.

## The platform is your front end — on its terms

The product surface decomposed into three primitives, each with backend consequences:

- **The rich menu** — the persistent tap-target grid pinned under the conversation — was the navigation bar. Every entry deep-links into either a chatbot flow or a mini-app view. Navigation design here is configuration, not code, but the backend defines every destination.
- **Chatbot flows** handled quick interactions: structured messages in, template responses out. Think of each flow as a route with a tiny state machine behind it.
- **LIFF mini-apps** (the platform's embedded web views) carried anything form-like — search filters, comparisons, booking calendars. From the backend's perspective these are ordinary web clients: our service exposed 60+ REST endpoints, and the mini-apps consumed them like any SPA would.

The engineering insight is that all three share one backend identity model, which is where the real work starts.

## Identity: verify, don't trust

A mini-app arrives holding a platform-issued ID token. The temptation is to read the user ID out of it and move on. The rules that kept this safe:

1. **Verify the token server-side on every session start** — signature, audience, expiry — against the platform's published keys. The client-side SDK's claims are a convenience, not an authority.
2. **Map the platform identity to your own user record**, created on first contact. Our internal ID, not the platform's, flowed through the rest of the system — which later made it possible to reconcile users across the chatbot, the mini-apps, and an external property-management system without the platform ID leaking into every table.
3. **Webhook events get the same skepticism**: signature verification on every inbound event, idempotent handling keyed on the event ID, because the platform redelivers.

None of this is exotic OAuth — but a chat platform hands you *three* entry surfaces (webhook, mini-app, bot API) and the discipline is making them converge on one identity path instead of three.

## Flex Messages: server-rendered UI, JSON edition

Recommendation and search results went out as **Flex Message carousels** — swipeable card stacks rendered natively in the thread. Building them well felt exactly like server-side rendering:

- **The backend composes the view.** A card is a JSON document (image, title, price band, action buttons) assembled per user. There is no client code to patch later — what you send is what exists, forever, in that thread.
- **Every button is a deep link with intent.** Card taps carried structured postback data or opened a LIFF view at a specific listing, so the backend always knew *which* card in *which* context drove the tap — the analytics story is designed into the message, or it doesn't exist.
- **Templates need versioning discipline.** Old messages don't re-render when your format evolves; a thread is an immutable history of every template version you ever shipped. We kept template composition in one module, treated like a public contract.

The immutability point deserves emphasis: in a web app you fix the UI and everyone gets it. In a chat thread, **you can only fix the future**. Rollouts of message formats got the caution normally reserved for database migrations.

## Where the logic actually lived

The mini-apps stayed thin because the interesting problems — who is this user, what should this card contain, what happens on this tap — were all server-side questions. That inversion is the takeaway. On this platform, the backend team effectively owned the user experience: response latency was perceived as "the app being slow," message composition was the visual design, and a webhook outage was a blank storefront.

If you're evaluating a chat-first product build: budget for the platform's constraints early (template size limits, messaging quotas, webhook delivery semantics), centralize identity verification on day one, and treat every message template as a versioned API response. The absence of a traditional frontend doesn't remove the UI work — it moves it into your service layer, where at least it's testable.
