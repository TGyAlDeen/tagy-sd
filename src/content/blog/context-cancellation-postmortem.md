---
title: "When a goroutine is the wrong tool"
description: "A production postmortem on Go context cancellation: a fire-and-forget cache write inherited the request's context and died with it — the diagnosis, the reverted first fix, and the boring final one."
pubDate: "Jul 19 2026"
heroImage: "/blog/hero-context.svg"
---

I like deleting clever code more than I like writing it, and this bug is why. In a gateway service that fronted an outbound API with a caching layer — Go on Cloud Run, part of a larger microservices platform — the read path fetched a list from the upstream API and then saved it to the cache. Someone had a reasonable-sounding idea: the caller shouldn't wait on the cache write, so fire it off in a goroutine and return immediately. The result was a cache that never seemed to warm up.

## The symptom

Intermittent, low-grade weirdness — the worst kind:

- Cache hit rates far lower than the traffic pattern justified; entries that "should" have been written simply weren't there on the next request.
- Context-cancellation errors in the logs, stamped *after* their requests had already completed successfully.
- No failures visible to callers. Every response was correct; the system was just quietly doing extra upstream work forever.

## The mechanism

The shape of the bug, reduced:

```go
func (o *Operation) GetListWithCache(ctx context.Context, key string) (*List, error) {
    list, err := o.upstream.GetList(ctx, key)
    if err != nil {
        return nil, err
    }
    go func() {
        // BUG: ctx belongs to the request — it dies when the handler returns
        _ = o.cache.Set(ctx, key, list)
    }()
    return list, nil // handler returns → ctx cancelled → the write above is racing a deadline it usually loses
}
```

In Go's HTTP stack, the request context is cancelled as soon as the handler returns. The goroutine inherited that context, so the moment the response went out — which was the whole point of not waiting — the cache write it was performing got cancelled underneath it. Whether the write survived came down to a race between a network round-trip and the function's return statement. The function's return statement usually won.

What made it sneaky is that the code *looks* context-disciplined — it passes `ctx` along like all the surrounding code does. The convention that's correct on the request path (propagate the caller's context) is exactly wrong for work that's supposed to detach from the request.

## Two wrong ways to detach

This bug has a mirror twin, and it's worth naming both, because the fix for one creates the other:

- **Inherit the request context** (our bug): the detached work dies with the request. Fire-and-forget becomes fire-and-usually-forget-to-finish.
- **Swap in `context.Background()`**: the work now outlives the request — nothing bounds it, nothing owns it, and it happily performs side effects on behalf of callers that have long since timed out, retried, or given up.

Either way, the goroutine's real problem is the same: nobody can say what owns this work and when it ends.

## The fix — after a false start

The first attempt kept the cleverness: wrap the cache write in a managed async-handler group, still fired from the request path. It was reverted almost immediately — same category of bug, more machinery around it.

The final fix, straight from the commit log: the context gets cancelled once the API call is finished, and a goroutine isn't suitable for a case like this. So — no goroutine:

```go
func (o *Operation) GetListWithCache(ctx context.Context, key string) (*List, error) {
    list, err := o.upstream.GetList(ctx, key)
    if err != nil {
        return nil, err
    }
    _ = o.cache.Set(ctx, key, list) // synchronous; a cache-write's worth of latency
    return list, nil
}
```

The latency "saved" by the goroutine was one cache write — milliseconds against an endpoint that had just paid for a full upstream round-trip. The async version saved a rounding error and spent the entire cache in exchange.

## The rules that came out of it

We turned the postmortem into review checklist lines rather than a lecture:

1. **A goroutine needs a stated owner and a stated end.** If you can't say what stops it and who waits for it, it's a leak with extra steps.
2. **Detaching work from a request is a decision about context, made out loud.** Inherit `ctx` and the work dies with the request; use `context.Background()` and it outlives its owner. If neither answer feels right, the work doesn't belong in a goroutine — it belongs on the request path, or in a real queue with its own lifecycle and timeout.
3. **Concurrency must earn its place.** The review question is not "is this concurrency correct?" but "what does this concurrency buy?" Here the honest answer was milliseconds — and the sequential version was correct by construction.
4. **Test cancellation, not just results.** A test that completes a request and then asserts the side effect *actually happened* — or cancels mid-call and asserts it *didn't* — would have caught this. Return-value tests never will.

The broader lesson has followed me to every Go codebase since: most production concurrency bugs I've met weren't subtle races deep in clever machinery — they were ordinary code, made concurrent without a reason, holding a context nobody thought about. The context package already encodes the discipline; the work is refusing to opt out of it casually.
