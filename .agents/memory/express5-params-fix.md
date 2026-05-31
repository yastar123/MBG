---
name: Express 5 Params Fix
description: req.params properties are typed as string | string[] in Express 5, breaking parseInt() calls
---

In Express 5, `req.params` is typed as `Record<string, string | string[]>` — so `req.params.id` is `string | string[]`, not `string`. This breaks any `parseInt(req.params.id)` call.

**Fix:** Use `req.params["id"] as string` to cast it explicitly.

```ts
// Before (TS error in Express 5)
const id = parseInt(req.params.id);

// After
const id = parseInt(req.params["id"] as string);
```

**Why:** Express 5 changed the type signature of `ParamsDictionary`. All route param accesses in api-server/src/routes/*.ts were fixed with a sed replacement.

**How to apply:** Any new route handler using `req.params.xxx` must cast the value as string before passing to parseInt or other string functions.
