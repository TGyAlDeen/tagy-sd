---
title: "Service-to-service auth without a service mesh"
description: "A sidecar proxy pattern on Cloud Run: ingress authentication, egress through a central internal API hub, and an internal load balancer doing the routing — mesh benefits without mesh weight."
pubDate: "Jul 12 2026"
heroImage: "/blog/hero-sidecar.svg"
---

Every time I've sized up a service mesh for a platform of about a dozen services, the math has come out the same: the problems were real, the mesh was more machine than the problems deserved. What we actually needed on this platform — Go microservices on Cloud Run behind an internal load balancer — was three things: services shouldn't accept traffic from just anyone, outbound calls should go through one controlled path, and none of that logic should live in application code. We got all three from a **sidecar proxy pattern** and one deliberately boring routing layer.

## The pieces

- **An internal load balancer with path-based routing** as the front door for service-to-service calls. One stable internal hostname; `/orders/*` routes to the order service, `/payments/*` to the payment gateway, and so on. Cloud Armor sits in front of anything external-facing.
- **A sidecar container in each Cloud Run service** handling both directions of trust:
  - **Ingress**: authenticate the caller before the request reaches the application container — verify the identity token, check the caller is on this service's allowlist, reject everything else.
  - **Egress**: outbound calls leave through the sidecar toward a **central internal API hub**, which is the one place that knows how to reach every internal service (and the handful of external APIs we depended on).
- **Terraform for all of it** — LB, routes, Cloud Armor policies, service configs — because a routing layer you can't diff is a routing layer you can't trust.

The application containers, meanwhile, speak plain HTTP to `localhost`. A service's business code contains no token minting, no peer verification, no retry-on-auth-failure — it makes a request to its sidecar and the platform does the rest.

## Why a hub instead of direct calls

Letting every service dial every other service directly is the default, and it works right up until you need to answer "what calls what?" during an incident. Routing egress through a central hub bought us:

- **One inventory of dependencies.** The hub's config *is* the service-dependency graph — reviewable in a pull request, greppable at 2 a.m.
- **One choke point for cross-cutting policy.** Timeouts, retry budgets, and outbound allowlists live in one place instead of twelve `http.Client` configurations that drift apart.
- **One place external APIs are reached from.** Third-party endpoints, credentials, and their rate limits are the hub's problem; services ask for a capability, not a URL.

The cost is honesty about what the hub is: a single point of routing (scaled and replicated, but conceptually singular) and one extra hop of latency. For interactive traffic measured in milliseconds of business logic, the hop was noise. For the failure modes that actually paged us, the hub was where the evidence lived.

## What the mesh would have added — and didn't

A mesh earns its complexity when you need mTLS everywhere, traffic splitting, cross-cluster policy, or you're operating hundreds of services owned by many teams. We had a dozen services, one team's worth of ownership, and a managed platform that already handled TLS termination and identity tokens. The sidecar pattern gave us the parts of the mesh value proposition we would actually use — authenticated ingress, controlled egress, uniform policy — using primitives the platform already had.

The decision rule I took away: **count the mesh features you'd enable in the first six months.** If the list is "auth between services and knowing what talks to what," you can build that with sidecars and a load balancer you already understand — and debug it with `curl`.

## Lessons from running it

- **Put the allowlist check in the sidecar, not the app.** The one time authorization logic leaks into application code, it starts drifting per-service, and you're back to auditing twelve implementations.
- **Path-based routing ages well.** Adding a service was a Terraform route and an allowlist entry — no DNS ceremonies, no client redeployments.
- **The sidecar is a deploy-time contract.** Version it and roll it out like a library upgrade: deliberately, service by service, with the old version still accepted during the transition.
- **Write down the trust model.** Ours fit on half a page: *external traffic terminates at the edge; internal callers are authenticated by identity token at ingress; egress goes through the hub.* That half page did more for onboarding than any diagram.

None of this is novel — it's the mesh idea at one-tenth scale. The skill isn't in choosing the famous tool; it's in noticing when the famous tool solves problems you don't have, and building the three features you do need with parts you can hold in your head.
