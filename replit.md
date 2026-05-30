# MBG Dapur

Sistem Manajemen Operasional Dapur untuk program Makan Bergizi Gratis (MBG).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mbg-dapur run dev` — run the frontend (port 25852, external 3000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS v4 (CSS-first via `@theme` in index.css), Radix UI / shadcn
- Routing: wouter, State: TanStack Query v5
- API: Express 5
- DB: PostgreSQL 16 + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Charts: Recharts

## Where things live

- `artifacts/mbg-dapur/src/pages/` — all page components (one file per page)
- `artifacts/mbg-dapur/src/components/layout.tsx` — main app shell with sidebar + header
- `artifacts/mbg-dapur/src/index.css` — Tailwind v4 theme + custom utilities + Google Fonts
- `artifacts/mbg-dapur/src/lib/auth.ts` — token storage + window.fetch interceptor
- `artifacts/api-server/src/` — Express routes and DB queries
- `packages/db/src/schema.ts` — Drizzle schema (source of truth)
- `packages/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)

## Architecture decisions

- Auth via patched `window.fetch`: `setupAuth()` (called at App.tsx module level) wraps `window.fetch` to inject `Authorization: Bearer` header from localStorage. No extra per-fetch boilerplate needed.
- Tailwind CSS v4 with `@theme inline` in CSS — no `tailwind.config.js`. All design tokens are CSS custom properties under `:root`.
- Custom `.page-heading`, `.table-responsive`, `.card-hover`, `.stat-card-icon` utility classes defined in `index.css` for consistency across pages.
- Notification preferences stored in `localStorage` (key: `mbg_notif_prefs`) without a backend endpoint — sufficient for per-device UX.
- Demo credentials (`admin@test.com` / `admin123`) shown on login as a clickable card that auto-fills the form.

## Product

- **Dashboard**: Live summary of daily production, active kitchens, deliveries, stock alerts, and 7-day production trend chart.
- **Dapur**: CRUD for kitchen units with capacity, location, and kepala dapur assignment.
- **Menu**: Plan daily menus by meal type (makan pagi / siang / snack) with calorie and portion targets.
- **Produksi**: Schedule and update daily production sessions per kitchen; track target vs realisasi with QC status.
- **Absensi**: Daily attendance tracking for kitchen staff.
- **Gudang**: Manage raw ingredients (bahan baku), view current stock levels, and browse delivery receipts. Low-stock alerts shown prominently.
- **Distribusi**: Track food deliveries to schools with driver assignment and real-time status updates.
- **Supplier**: Manage supplier contacts, categories, and ratings.
- **Penerima Manfaat**: Manage student beneficiary data with regional distribution chart.
- **Keuangan**: Budget (anggaran) and spending (realisasi) per kitchen, with category breakdown bar chart.
- **Pengguna**: User management with role-based access control (10 roles).
- **Pengaturan**: System info, per-device notification preferences (persisted to localStorage), role access matrix.

## User preferences

_None recorded yet._

## Gotchas

- Screenshot tool always tries port 5000 — use Vite HMR logs to confirm changes compiled.
- `pnpm --filter @workspace/db run push` is dev-only; never run against production DB without migration review.
- Always call `setupAuth()` before any authenticated fetch — it's already called at App.tsx module level, so new pages/components don't need to worry about it.
- Tailwind v4 doesn't use `tailwind.config.js` — add new design tokens to the `@theme inline` block in `index.css`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
