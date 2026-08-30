---
title: "Hexagonal architecture inside Lambda, with code"
description: "How fifty TypeScript Lambda functions stayed testable and consistent: ten-line handlers, ports and adapters, and one use case serving API, queue, and batch entrypoints."
pubDate: "Aug 5 2026"
heroImage: "/blog/hero-hexagonal.svg"
---

The moment I knew the structure had paid for itself was unglamorous: a validation rule changed, one use case got edited, and three different execution paths — the synchronous API check, the bulk SQS pass, and the pre-registration re-validation — all picked it up with no further work. On a platform of roughly fifty TypeScript Lambda functions, that's the whole game: the code that changes must live in exactly one place, and the fifty entrypoints must be too thin to hide anything.

This is the layout that got us there, with the real shape of the code.

## The layout

Every function in the codebase follows the same directories:

```
src/
  domains/        # entities, value objects, domain errors
  usecases/       # application logic — one class per operation
  interfaces/
    handlers/     # Lambda entrypoints: parse, call, format
    repositories/ # Prisma implementations of domain ports
  infrastructure/ # SQS/S3/SFTP clients, config
```

The load-bearing rule is about the handlers: **a handler is ten lines.** Parse the event, invoke the use case, map the result to the transport. If a handler grows an `if`, business logic is leaking into the transport layer.

```ts
// interfaces/handlers/validate-record.ts
export const handler = async (event: APIGatewayProxyEvent) => {
  const input = parseValidateRequest(event);        // throws typed 400s
  const result = await validateRecordUseCase.run(input);
  return toApiResponse(result);                     // status + body mapping
};
```

## Ports make the use case portable

The use case knows nothing about Lambda, Prisma, or SQS. It depends on **ports** — interfaces the domain defines:

```ts
// usecases/validate-record.ts
export class ValidateRecordUseCase {
  constructor(
    private readonly masters: MasterDataPort,   // existence checks
    private readonly records: RecordRepository, // persistence
  ) {}

  async run(input: ValidateInput): Promise<ValidationResult> {
    const branch = await this.masters.findBranch(input.branchCode);
    if (!branch) return ValidationResult.reject("UNKNOWN_BRANCH");
    // ... the actual rules, in one place
  }
}
```

Adapters implement the ports: a Prisma-backed repository in production, an in-memory fake in tests. The payoff shows up in two places:

**Tests run in milliseconds.** Unit tests exercise use cases against fakes — no Lambda emulator, no Docker database, no AWS in the loop. The suite stayed in the hundreds-of-milliseconds range even as the platform grew, which is the difference between tests people run before every commit and tests people run before every release.

**Entrypoints multiply for free.** The same `ValidateRecordUseCase` is fronted by an API Gateway handler (single record, synchronous), an SQS handler (bulk, asynchronous), and the registration step (re-validation before final submission). Three transports, one implementation of the rules — which is why the rule change at the top of this post cost one edit.

## What consistency across fifty functions buys

A structure like this is a small tax on function one and a compounding dividend by function fifty:

- **Navigation is uniform.** Any engineer can open any function and know where the logic is, where the I/O is, and what to mock. On a codebase touched by rotating team members, that mattered more than any individual design choice.
- **Review gets sharper.** "Why is there a Prisma import in a handler?" is a one-line review comment that catches a whole category of erosion.
- **The domain stays honest.** Because use cases can't reach for the framework, temptations like "just read this one thing from the raw event" have nowhere to go.

## Honest costs and edges

- **Boilerplate is real.** Every operation carries a handler, a use case, ports, and adapters. For a two-line lookup, the ceremony feels silly — we paid it anyway, because the mixed-style alternative ("simple ones are exempt") is how a convention dies.
- **Cold starts care about imports, not layers.** The layering itself cost nothing at runtime, but adapters that eagerly constructed heavy clients did. Instantiate clients once, outside the handler, and keep import graphs lean.
- **Local end-to-end still needs a real environment.** Hexagonal structure rescued unit testing; it does not simulate IAM, SQS redrive, or API Gateway quirks. We kept ten Terraform-managed environments precisely so integration testing had somewhere real to happen.

If you're starting a serverless codebase that you expect to grow past a dozen functions, decide the internal structure *before* function five — and make the handler-is-ten-lines rule non-negotiable. Everything else in this post is derivable from that one constraint.
