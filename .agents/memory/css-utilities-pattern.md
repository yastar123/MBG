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

## Table Row Entrance
The `.table-responsive table tbody tr` selector in index.css automatically staggers row fade-in by nth-child. No extra classes needed on individual rows.

**Why:** Keeps JSX clean and the animation logic centralized.
