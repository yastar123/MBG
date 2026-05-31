---
name: useGetMe Call
description: Call useGetMe() with no arguments — passing query options causes TS2741 queryKey error in TQ v5
---

The Orval-generated `useGetMe` hook in TanStack Query v5 requires a `queryKey` field if you pass the `query` option object. Omitting `queryKey` causes TS2741.

**Fix:** Call with no arguments:

```ts
// Bad — TS2741: Property 'queryKey' is missing
const { data: user } = useGetMe({ query: { retry: false } });

// Good
const { data: user } = useGetMe();
```

**Why:** TQ v5 `UseQueryOptions` made `queryKey` required. The generated hook already sets a sensible default queryKey, so callers don't need to override it.

**How to apply:** All generated hooks from Orval should be called without a `query` option unless a full `UseQueryOptions` (including `queryKey`) is explicitly needed.
