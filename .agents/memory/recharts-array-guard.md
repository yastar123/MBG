---
name: Recharts Array Guard
description: Must use Array.isArray() before passing data to Recharts — truthy/length check causes runtime crash
---

Recharts internally accesses `displayedData.map(...)` on the `data` prop. If `data` is not a true JS array (e.g. undefined, null, or a non-array with a length property), it crashes with "displayedData.map is not a function".

**Fix:** Always guard with `Array.isArray()` before rendering any Recharts chart:

```tsx
// Bad — can still crash if trends is truthy but not array
{trends && trends.length > 0 ? <AreaChart data={trends} /> : ...}

// Good
{Array.isArray(trends) && trends.length > 0 ? <AreaChart data={trends as object[]} /> : ...}
```

**Why:** TanStack Query's data property can be in an indeterminate state during hydration/refetch transitions. The Recharts AreaChart doesn't guard against non-array data internally.

**How to apply:** Every Recharts chart (AreaChart, BarChart, LineChart, etc.) that receives data from an API query must use `Array.isArray()` before rendering.
