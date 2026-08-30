---
title: "When a goroutine is the wrong tool"
description: "A production postmortem on Go context cancellation: an outbound API call wrapped in a goroutine kept running after the request died — the diagnosis, the fix, and the rules that came out of it."
pubDate: "Jul 19 2026"
heroImage: "/blog/hero-context.svg"
---

I like deleting clever code more than I like writing it, and this bug is why. In a gateway service that fronted outbound API calls with a caching layer — Go on Cloud Run, part of a larger microservices platform — someone (the honest version: someone reviewing with my approval) had wrapped an outbound HTTP call in a goroutine. The intent was reasonable-sounding: don't let a slow upstream block the handler's other work. The result was a service that kept doing things for callers who had already given up.

## The symptom

Intermittent, low-grade weirdness — the worst kind:

- Upstream API usage higher than request volume justified.
- Occasional state written for requests the client had cancelled or timed out.
- Logs showing work completing *after* the request that asked for it had already returned an error.

Nothing crashed. Latency looked fine. It surfaced as a slow accumulation of "how did this happen?" artifacts.

## The mechanism

The shape of the bug, reduced:

```go
func (g *Gateway) Fetch(ctx context.Context, key string) (*Result, error) {
    ch := make(chan *Result, 1)
    go func() {
        // BUG: this call outlives ctx — nothing ties it to the request
        res, err := g.upstream.Get(context.Background(), key)
        if err == nil {
            g.cache.Set(key, res) // side effect from a dead request
            ch <- res
        }
    }()
    select {
    case res := <-ch:
        return res, nil
    case <-ctx.Done():
        return nil, ctx.Err() // handler returns — the goroutine does not
    }
}
```

The handler respects cancellation; the goroutine doesn't. When `ctx` is cancelled, `Fetch` returns promptly and *looks* correct — but the upstream call it spawned keeps running with `context.Background()`, and when it finishes, it writes to the cache on behalf of a request that no longer exists. Under retry pressure this compounds: the client times out, retries, and now two goroutines are racing to complete the same abandoned work.

Two details made it sneaky. First, the `select` gives the function correct *return* behavior, so tests that only check return values pass. Second, `context.Background()` inside goroutines is idiomatic in some codebases for "fire-and-forget" work — the pattern looked familiar enough to survive review.

## The fix

Delete the cleverness. The call sits on the request path; it should live and die with the request:

```go
func (g *Gateway) Fetch(ctx context.Context, key string) (*Result, error) {
    res, err := g.upstream.Get(ctx, key) // cancellation propagates naturally
    if err != nil {
        return nil, err
    }
    g.cache.Set(key, res)
    return res, nil
}
```

If the upstream is slow, that's what the context's deadline is for — the caller's timeout now actually cancels the upstream call (Go's HTTP transport aborts the request when its context is done), instead of merely abandoning it. The "don't block the handler" concern the goroutine was meant to solve turned out not to exist: the handler had nothing else to do but wait for this result.

## The rules that came out of it

We turned the postmortem into review checklist lines rather than a lecture:

1. **A goroutine needs a stated owner and a stated end.** If you can't say what stops it and who waits for it, it's a leak with extra steps.
2. **`context.Background()` in request-path code is a red flag**, not a default. Detaching work from the request is a real decision — make it visible, name it (a queue, a worker, a scheduled job), and give the detached work its own timeout.
3. **Concurrency must earn its place.** The question in review is not "is this concurrency correct?" but "what does this concurrency buy?" Here the answer was nothing — the sequential version was faster to reason about and identical in latency.
4. **Test cancellation, not just results.** A test that cancels the context mid-call and then asserts *no side effects happened afterward* would have caught this. Return-value tests never will.

The broader lesson has followed me to every Go codebase since: most production concurrency bugs I've met weren't subtle races deep in clever machinery — they were ordinary code, made concurrent without a reason, doing exactly what it was told longer than anyone wanted. The context package already encodes the discipline; the work is refusing to opt out of it casually.
