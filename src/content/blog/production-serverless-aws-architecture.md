---
title: "Serverless in production: lessons from an enterprise AWS platform"
description: "Fifty-plus Lambda functions, hexagonal architecture, SQS-driven batch pipelines, and multi-region DR on AWS — the structure, queue design, and operational decisions behind an enterprise serverless platform."
pubDate: "Jul 26 2026"
heroImage: "/blog/hero-serverless.svg"
---

I've learned to respect requirements that sound boring. "Corporate customers upload CSV files" reads like a weekend project — right up until those files must be validated against master data, registered into external backend systems over SFTP, and reported back in real time, on a platform that has to survive a regional outage with an RTO measured in hours and satisfy an auditor reading your VPC Flow Logs.

I led the technical delivery of a B2B data-intake platform with exactly those requirements, built entirely serverless on AWS. This post walks through the architecture decisions that made it work — and the ones whose value only showed up later.

## The shape of the system

- **~50 Lambda functions** (TypeScript, Node.js 22) split between a synchronous API tier and asynchronous batch processing, built and deployed with AWS SAM
- **Aurora PostgreSQL** through **Prisma**, fronted by **RDS Proxy**
- **SQS queues** driving the multi-stage validation and registration pipeline
- **SFTP integration** with external legacy systems for final registration
- **WebSocket API** pushing processing status to the browser in real time
- **React 19 SPA** in a 10-package monorepo (Vite, TanStack Router/Query), authenticated via **Cognito** with OAuth2 and SAML federation
- **Terraform** across ~24 modules and 10 environments, deployed to **two regions (Tokyo and Osaka)** for disaster recovery

## Hexagonal architecture inside Lambdas

Fifty functions sharing one codebase will rot fast without structure. Every function followed the same hexagonal layout:

```
src/
  domains/        # entities, value objects, domain errors
  usecases/       # application logic, one class per operation
  interfaces/
    handlers/     # Lambda entrypoints — parse, call usecase, format
    repositories/ # Prisma implementations of domain ports
  infrastructure/ # SQS/S3/SFTP clients, config
```

The rule that made it stick: **handlers are ten lines**. Parse the event, invoke the use case, map the result. All business logic lives in use cases that take ports (interfaces), which means unit tests run against in-memory fakes with no AWS emulation. Local test suites stayed in the hundreds-of-milliseconds range, and the same use case could be fronted by an API Gateway handler today and an SQS handler tomorrow.

This paid for itself most visibly in the batch pipeline, where the same validation use case ran in three contexts: synchronous single-record checks from the API, asynchronous bulk validation from SQS, and a re-validation pass during registration.

## The async pipeline: SQS as the backbone

File processing ran as a chain of stages, each a queue plus a consumer Lambda:

```
upload → parse/normalize → validate (master-data checks) → register (SFTP) → notify
```

Design choices that mattered:

- **One queue per stage, not one big queue.** Each stage scales, throttles, and fails independently. Registration is gated by an external system's business hours; validation isn't. Separate queues let registration back up overnight without blocking validation.
- **DLQs everywhere, with redrive as a runbook step.** Every consumer has a dead-letter queue and an alarm on DLQ depth. Poison messages stop the record, not the pipeline.

![Animated diagram: records flow through parse, validate, and register stages; a poison message drops from the validate stage into a DLQ, an alarm fires, and healthy records keep flowing](/blog/inline-dlq.svg)
- **Validation against cached master data.** Existence checks (branch codes, address masters) hammered the same lookups, so we layered caching in front of Postgres — including **negative-result caching**, because in a validation workload, "this code does not exist" is queried just as often as "it does" and is just as cacheable. That one change removed a whole class of database load spikes during bulk uploads.
- **WebSocket progress events.** Long-running batch work with a silent UI generates support tickets. Each stage publishes progress, a small Lambda broadcasts over the WebSocket API, and the SPA renders live status. Cheap to build, disproportionate UX payoff.

## Aurora + Lambda: the connection problem

Lambda's scaling model and Postgres's connection model are natural enemies — a burst of concurrent executions can exhaust connections instantly. **RDS Proxy** sits between them and pools connections across invocations. With Prisma, the practical rules were: keep the client instantiated outside the handler, keep pool size per instance minimal, and let the proxy do the multiplexing. Under bulk-upload bursts the proxy flattened connection spikes that would otherwise have taken the database down.

## Multi-region DR that you actually test

The platform deployed to Tokyo as primary and Osaka as standby: Terraform applied both regions from the same modules, Aurora replicated cross-region, and S3 buckets replicated asynchronously. Two lessons:

1. **DR is a product feature, not an infra afterthought.** The failover runbook — DNS, database promotion, queue drain order — was written and rehearsed, because untested DR is a diagram, not a capability.
2. **Terraform modules earn their keep at region two.** Standing up Osaka was a variables file, not a project. If we had hand-built Tokyo, the DR region would have drifted from day one.

The network layout was similarly unglamorous but load-bearing: a four-tier VPC (public / application / data / management subnets), Network Firewall for egress control, and the full audit stack — CloudTrail, GuardDuty, Security Hub, Config — with **Athena queries over VPC Flow Logs** as the answer to "prove what talked to what."

## Observability

X-Ray traced requests across API Gateway → Lambda → SQS → Lambda → Aurora, which turned "the upload is slow" from an archaeology project into a flame graph. CloudWatch alarms watched the boring things that actually predict incidents: DLQ depth, queue age, Lambda error rates and throttles, RDS Proxy connection saturation. A bilingual log-query manual documented the team's Logs Insights recipes, because tribal knowledge about how to count yesterday's failures is not a monitoring strategy.

## Honest trade-offs

Serverless was the right call here — spiky batch workloads, enterprise security requirements, small team — but it wasn't free:

- **Cold starts** were manageable for batch, noticeable on the API tier; provisioned concurrency on the handful of latency-sensitive functions was the pragmatic fix.
- **Local development** needs investment. Hexagonal architecture rescued unit testing, but end-to-end flows still required a deployed environment; ten Terraform-managed environments existed precisely so every engineer and stage had one.
- **Fifty small functions** are operationally heavier than five services. The compensation is that each function has one job, one queue, one alarm — when something breaks, the blast radius names itself.

None of this is exotic. At the center there is still a Lambda behind an API Gateway — production is everything wrapped around it: structure inside the functions, queues between them, a proxy in front of the database, a second region, and the discipline to test the parts you hope never run.
