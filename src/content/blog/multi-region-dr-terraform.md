---
title: "Multi-region DR you actually rehearse"
description: "Tokyo primary, Osaka standby, one Terraform module set: what to replicate, what to rehearse, and why an untested failover plan is a diagram, not a capability."
pubDate: "2026-08-12"
heroImage: "/blog/hero-dr.svg"
---

Disaster recovery is the part of the architecture I most hope is wasted work — and the part I least trust to hope. On an enterprise serverless platform I led — AWS Lambda and SQS pipelines over Aurora PostgreSQL, with strict recovery objectives in the contract — we ran Tokyo as primary and Osaka as standby. What follows is what actually made that real: not the diagram, but the decisions about replication, code, and rehearsal.

## One module set, two regions

The foundational choice: **Osaka is not a second project. It's a second variables file.**

All infrastructure lived in Terraform modules (about two dozen of them, spanning roughly ten environments), and both regions applied the same modules with different inputs. That sounds like standard practice — it is — but the discipline it enforces is the actual DR feature:

- **No drift by construction.** The standby can't quietly diverge from primary, because there is no standby-specific code to diverge in. A security group change lands in the module and both regions get it on the next apply.
- **The DR region is always buildable.** The scariest DR posture is a standby assembled by hand two years ago. Ours could be torn down and re-applied, which meant we *knew* the recipe was complete — nothing lived only in someone's console history.
- **Cost control stays honest.** Region-level inputs let the standby run lean (smaller instances, fewer replicas) while remaining structurally identical. The trade-off is explicit in a variables file instead of implicit in forgotten sizing decisions.

## What replicates, and how fast

Not everything deserves the same recovery treatment. We sorted state into three tiers:

| Tier | What | Mechanism | Loss tolerance |
|---|---|---|---|
| 1 | Relational data (orders of record) | Aurora cross-region replication | Seconds of lag |
| 2 | Objects (uploaded files, generated artifacts) | S3 cross-region replication | Minutes, asynchronous |
| 3 | Derivable state (caches, queue backlogs) | Not replicated — rebuilt | Rebuild time |

Tier 3 is the one people argue about. Replicating queue contents across regions is complex and rarely worth it: an SQS backlog is in-flight work, and our pipeline stages were already idempotent (they had to be — [at-least-once delivery demands it](/blog/production-serverless-aws-architecture/)). On failover, upstream systems re-deliver or operators re-trigger, and idempotency absorbs the duplicates. We wrote that down as policy so nobody would burn a quarter building queue replication we didn't need.

Compute, meanwhile, is the serverless dividend: Lambda functions and API definitions are just code and configuration, present in both regions by virtue of the shared modules. There is no warm fleet to keep patched.

## The runbook is the product

The failover runbook was a numbered document, and its order was load-bearing:

1. **Declare** — a named role decides failover has begun; ambiguity here costs more than any technical step.
2. **Freeze intake** — stop accepting new work in the primary path so state stops moving.
3. **Promote** — Aurora standby becomes writable in Osaka.
4. **Repoint** — DNS/routing shifts traffic to the Osaka stack.
5. **Drain and reconcile** — re-trigger interrupted pipeline work; idempotency handles the overlap.
6. **Verify** — a scripted smoke sequence, not a vibe check.

Two lessons from rehearsing it:

- **Rehearsal converts documentation into capability.** The first walkthrough found steps that assumed access nobody had in an emergency and a promotion step whose duration surprised everyone. None of that appears on a diagram; all of it appears on a stopwatch.
- **Measure the rehearsal against the objectives.** RTO and RPO were contractual numbers. The rehearsal either fits inside them or the architecture goes back for revision — that feedback loop is the entire point of having numbers.

## The unglamorous perimeter

DR reviews obsess over databases and skip the boring dependencies that make a region actually usable: the four-tier VPC layout, network firewall rules, IAM, KMS keys, monitoring, and alarms all had to exist in Osaka *before* the bad day — several of those are region-scoped in ways that surprise people, and every one of them was in the modules for exactly that reason. The audit stack too: if the primary region is down, the evidence trail (CloudTrail, VPC Flow Logs, the Athena tables over them) must not be.

The takeaway I'd hand to a team starting this: treat DR as a product feature with an owner, a budget, and a test cadence. The technology — Aurora replication, S3 CRR, Terraform symmetry — is well-trodden. What separates a capability from a diagram is that someone rehearsed it, timed it, and fixed what the stopwatch found.
