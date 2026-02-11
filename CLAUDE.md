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

Single-page app with a pixel-art beach/science theme. The root layout (`src/app/layout.tsx`) renders a full-width beach background image with a navbar overlay, then page content below.

### Styling System

All design tokens are CSS custom properties in `src/app/globals.css`:
- Color variables (e.g. `--blue-4`, `--smoke-7`, `--green-4`) exposed to Tailwind via `@theme inline`
- Typography classes match Figma specs: headings `h1`–`h6` + `.h7`/`.h8`, paragraphs `.paragraph-{l,m,s}`, labels `.label-{s,m}-{regular,bold,semibold}`, mono `.mono-{m,s}`
- Single font: **Kode Mono** (loaded from `/public/fonts/kode_mono/`)

Use existing CSS variables and typography classes rather than raw values. Reference colors as Tailwind utilities (e.g. `text-dark-space`, `bg-smoke-7`). **Never use inline `style` for colors** — use Tailwind utilities like `text-orange-1` (or `text-[var(--orange-1)]`) instead of `style={{ color: "var(--orange-1)" }}`.

### Component Patterns

- Components live in `src/components/` as default exports
- Props types exported alongside components (e.g. `export type FeedCardProps`)
- Pixel-art aesthetic: no border-radius, `imageRendering: "pixelated"`, box-shadow for 3D button effects
- Dynamic styling uses CSS variables via inline `style` props (see `PixelButton.tsx`)
- **Icons must be SVG files in `public/icons/`** — never inline SVGs in JSX. Reference them via `<Image src="/icons/name.svg" />` or `<img>`

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).
