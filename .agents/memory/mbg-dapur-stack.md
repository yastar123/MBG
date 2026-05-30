---
name: MBG Dapur Stack & Conventions
description: Key technical decisions, ports, auth pattern, design conventions, and gotchas for the MBG Dapur project.
---

## Ports
- API server: 8080 (internal), 8080 (external)
- Frontend (Vite): 25852 (internal), 3000 (external)
- Screenshot tool defaults to port 5000 — will always fail. Use HMR logs to confirm changes compiled.

## Auth
- `setupAuth()` called at module level in App.tsx — patches window.fetch globally to inject `Authorization: Bearer <token>` from localStorage key `mbg_token`.
- `setToken()` / `clearToken()` in `src/lib/auth.ts` — call these on login/logout.
- Test user seeded in DB: `admin@test.com` / `admin123` (role: super_admin, is_active: true).

## Design System
- Tailwind CSS v4, CSS-first config in `artifacts/mbg-dapur/src/index.css` via `@theme inline`.
- Font: Plus Jakarta Sans (via Google Fonts in index.css).
- Color tokens use HSL CSS variables; primary = dark green (141 46% 19%), accent = amber (30 60% 50%).
- Sidebar color is a separate token set (darker green).
- Utility classes: `.page-heading`, `.page-subheading`, `.section-label`, `.stat-card-icon`, `.card-hover`, `.table-responsive`, `.gradient-primary`, `.animate-slide-up`, `.animate-fade-in`, `.animate-scale-in`, `.animate-stagger-1..5`.

## Page Conventions
- Every page: `space-y-8`, `page-heading` h1, `page-subheading` p, `animate-fade-in` on header div.
- Tables: always wrapped in `<div className="table-responsive">`, thead rows use `bg-muted/20`, cells use `py-3 px-4`.
- Empty states: centered flex column, `w-12 h-12 bg-muted rounded-xl` icon container + message + CTA button.
- Cards: `shadow-sm`, `card-hover` for interactive cards, staggered `animate-slide-up` with `animationDelay`.
- Stat cards: use `.stat-card-icon` + colored bg/text, 2xl font-bold value, xs muted-foreground label.

## Notification Persistence
- `pengaturan.tsx` uses `localStorage` key `mbg_notif_prefs` (JSON map of id→boolean). Function `loadNotifs()` reads on mount.

**Why:** localStorage keeps preferences without a backend endpoint.
