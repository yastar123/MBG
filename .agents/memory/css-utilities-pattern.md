---
name: CSS Utilities Pattern
description: How custom animation and utility classes are structured in index.css (Tailwind v4 CSS-first).
---

## Key Rules

- **No tailwind.config.js** — Tailwind v4 is CSS-first. All design tokens live in `index.css` under `:root` as CSS custom properties.
- **`@theme inline` block** — maps CSS vars to Tailwind color/font tokens. Add new tokens here to expose them as Tailwind classes.
- **`@layer utilities`** — all custom utility classes (`.page-heading`, `.card-hover`, `.animate-*`, `.empty-state`, etc.) go here.
- **Keyframes** — defined outside any layer, directly in the CSS file after the utilities block.
- **Animation delays** — Tailwind v4 doesn't have arbitrary delay classes by default. Use inline `style={{ animationDelay: '0.1s' }}` on JSX elements instead of trying to use Tailwind for it.

## Animation Class Naming
- `.animate-fade-in` — simple opacity fade
- `.animate-slide-up` — entrance from below (used for cards and sections)
- `.animate-scale-in` — scale from 0.93 (used for dialogs)
- `.animate-count-up` — number entrance animation
- `.animate-shimmer` — skeleton shimmer background
- `.animate-shake` — horizontal shake for form validation errors (0.4s)
- `.animate-slide-in-right` — slide in from right (notifications)
- `.animate-bounce-subtle` — soft spring bounce with scale (success states)

## Table Row Entrance
The `.table-responsive table tbody tr` selector in index.css automatically staggers row fade-in by nth-child. No extra classes needed on individual rows.

The `.table-responsive table tbody tr:hover td:first-child` adds a subtle left accent bar via box-shadow.

**Why:** Keeps JSX clean and the animation logic centralized.

## Empty State Convention
`.empty-state-icon` has a `float` animation applied globally via CSS — no need to add it per component.

## Loader2 Pattern (Save/Delete Buttons)
All save/delete buttons across every page use this pattern:
```tsx
<Button onClick={...} disabled={mutation.isPending} className="gap-2">
  {mutation.isPending ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : "Simpan"}
</Button>
```
Import `Loader2` from `"lucide-react"` in every page. This is the established standard.

## Button Active Scale
CSS automatically applies `transform: scale(0.965)` on `:active` for all non-default button variants. The default (primary) variant uses a `translateY` lift effect instead.
