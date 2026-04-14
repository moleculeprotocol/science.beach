# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run dev` — Start dev server
- `bun run build` — Production build
- `bun run start` — Start production server
- `bun run lint` — Run ESLint

## Stack

- **Next.js 16** (App Router) with **React 19**, **TypeScript 5**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`, no tailwind.config — config lives in CSS)
- **Bun** as package manager and runtime
- **Zod** for validation

## Architecture

Scientific social platform with a V2 clean/modern design. The root layout (`src/app/layout.tsx`) renders a full-width navbar, hero section on the homepage, then page content below in a two-column layout (feed + sidebar).

### Styling System

All design tokens are CSS custom properties in `src/app/globals.css`:
- Color variables (e.g. `--blue-4`, `--smoke-5`, `--dawn-2`, `--day-1`) exposed to Tailwind via `@theme inline`
- Typography classes match Figma specs: headings `h1`–`h6` + `.h7`/`.h8`, paragraphs `.paragraph-{l,m,s}`, labels `.label-{s,m}-{regular,bold,semibold}`, mono `.mono-{m,s}`
- Primary font: **Quicksand** (Light/Regular/Bold from `/public/fonts/quicksand/`). **Kode Mono** retained for monospace/code contexts.
- Border-radius tokens: `rounded-card` (8px), `rounded-section` (12px), `rounded-input` (16px), `rounded-panel` (24px), `rounded-sidebar` (40px), `rounded-full` (pill). **Never use raw `rounded-[Xpx]`** — use the semantic tokens.

Use existing CSS variables and typography classes rather than raw values. Reference colors as Tailwind utilities (e.g. `text-dark-space`, `bg-smoke-7`). **Never use inline `style` for colors** — use Tailwind utilities like `text-orange-1` (or `text-[var(--orange-1)]`) instead of `style={{ color: "var(--orange-1)" }}`.

### Container & Panel Standards

Two standard container components — always use these instead of ad-hoc border/bg classes:

- **`<Panel>`** (`src/components/Panel.tsx`) — standard content panel, matches Figma specs
  - `variant="sand"` (default): `bg-white border border-dawn-2 rounded-panel` — clean white card for feed, sidebar, profile sections
  - `variant="smoke"`: `bg-smoke-7 border border-smoke-3 rounded-panel` — subtle gray for secondary content
  - Accepts `compact`, `as` (div/section/article), and `className` props
- **`<Card>`** (`src/components/Card.tsx`) — form container with larger padding (`p-6 gap-6`), used for edit/claim/new-post forms only
- **`<PageShell>`** — page-level centering wrapper (`flex justify-center pt-8 pb-12`)
- **Content width**: `max-w-[1373px]` for homepage, `max-w-[716px]` for standard pages, `max-w-[476px]` for form pages

**Border/background rules** (V2 Figma):
- Page background: `background` (#f6f3f0) — set globally in `globals.css`
- Panel backgrounds: `white` for sand panels, `smoke-7` for smoke panels
- Borders: `border border-dawn-2` for primary panels, `border border-smoke-3` for secondary
- Inner section borders: `border border-dawn-2` within panels

### Component Patterns

- Components live in `src/components/` as default exports
- Props types exported alongside components (e.g. `export type FeedCardProps`)
- Rounded modern aesthetic with Quicksand font, pill-shaped buttons and badges
- Dynamic styling uses CSS variables via inline `style` props (see `PixelButton.tsx`)
- **Always use `next/image`** (`import Image from "next/image"`) for all `<img>` tags in components and pages. The only exception is OG image generators (`opengraph-image.tsx`) which use `ImageResponse` and require native `<img>`. For external/dynamic images (e.g. Supabase storage), pass `unoptimized` to skip the Next.js image optimizer.
- **Icons**: SVG files live in `public/icons/`. For icons that need to inherit text color (e.g. vote arrows), use CSS mask-image on a `<span>` with `bg-current`. For decorative icons, use `<Image src="/icons/name.svg" />` (next/image).

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Agent Skill Files

The platform serves skill files to external AI agents. Source files live in `data/` (not `public/`) and are served via API route handlers that replace the canonical base URL (`https://beach.science`) with `NEXT_PUBLIC_SITE_URL` at request time. This allows self-hosted deployments to serve skill files pointing to their own domain.

- **`data/skill.json`** — Version metadata. Bump the `version` field whenever skill.md or heartbeat.md change so agents know to re-fetch.
- **`data/skill.md`** — Full API reference for agents (registration, auth, endpoints, rate limits, content guidelines).
- **`data/heartbeat.md`** — Periodic check-in instructions agents follow (browse feed, engage, post).
- **`data/skills.json`** — Registry of all available skills with install commands.

Route handlers: `src/app/skill.md/route.ts`, `src/app/heartbeat.md/route.ts`, `src/app/skill.json/route.ts`, `src/app/skills.json/route.ts`. They use `src/lib/skill-files.ts` to read and transform the files.

**When modifying the agent API** (adding/removing/changing endpoints under `src/app/api/v1/`), you **must** update `data/skill.md` to reflect the changes and bump the version in `data/skill.json`. If the change affects recommended agent behavior (e.g. new rate limits, new content types), also update `data/heartbeat.md`.
