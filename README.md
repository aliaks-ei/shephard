# Shephard

Smart expenses wallet built with Vue 3, Quasar, and Supabase.

## Features

- Plans and templates for recurring budgeting periods
- Fast expense registration in two modes: quick-select (from plan items) and custom-entry
- Budget overview by category with remaining budget tracking
- Shared plans/templates with view or edit permissions
- Multi-currency support (`EUR`, `USD`, `GBP`, `JPY`)
- Progressive Web App support (installable, offline-ready, mobile-first)

## Tech Stack

- Vue 3 (`<script setup>`) + TypeScript
- Quasar Framework (PWA mode)
- TanStack Query for server state
- Pinia for client-side state only
- Supabase (Auth + Postgres + RLS)
- Vitest + Vue Test Utils for unit tests

## Prerequisites

- Node.js: `^18 || ^20 || ^22 || ^24 || ^26 || ^28`
- npm `>= 6.13.4` (or Yarn `>= 1.21.1`)
- Supabase project

## Environment

Create `.env` in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Install

```bash
npm install
# or
yarn
```

## Development

```bash
npm run dev          # Quasar PWA dev server
npm run dev:mock     # Dev server with MSW enabled
npm run lint
npm run format
npm run type-check
npm run test:unit    # Watch mode
npm run test:unit:ci # Single run
```

## Build

```bash
npm run build
npm run build:analyze
npm run build:production
npm run preview
```

## License

[MIT](LICENSE)
