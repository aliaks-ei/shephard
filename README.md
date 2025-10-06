# Shephard

Smart expenses wallet - A modern, responsive web application for managing personal expenses with Supabase integration.

## Features

### Budget Management

- **Plans** - Create budget plans with date ranges and track spending vs budget
- **Templates** - Design reusable budget templates for recurring periods (weekly/monthly)
- **Categories** - Organize expenses using predefined categories (Food, Transport, etc.)
- **Expense Tracking** - Quick expense registration with date, amount, and category
- **Budget Analytics** - View spending summaries by category, track remaining budget, and identify overspending

### Collaboration

- **Sharing** - Share plans and templates with other users
- **Permission Levels** - Control access with view-only or edit permissions

### Personalization

- **Multi-currency Support** - Choose between EUR, USD, or GBP
- **Theme Customization** - Light, dark, or system-based theme
- **Dashboard** - Quick access to active plans and recent templates

### Authentication & Security

- Google OAuth integration
- Email magic links (passwordless auth)
- Secure data isolation with Supabase Row Level Security (RLS)

### Progressive Web App (PWA)

- Offline capability
- Mobile-friendly responsive design
- Installable on mobile devices

### Modern Tech Stack

- Vue 3 with Composition API
- TypeScript for type safety
- Quasar Framework for UI components
- Pinia for state management
- Supabase for backend services
- Vite for fast development builds

### Architecture

- **API Layer** - Abstracted data operations in `src/api/`
- **State Management** - Pinia stores with the setup-style pattern
- **Component Library** - Quasar Framework for consistent UI
- **Type Safety** - Full TypeScript coverage with Supabase-generated types

## Key Concepts

- **Template** - A reusable budget blueprint with categories and amounts
- **Plan** - An active budget instance created from a template for a specific date range
- **Expense** - A recorded transaction linked to a plan and category
- **Category** - Predefined expense types (e.g., Groceries, Transport, Utilities)
- **Sharing** - Collaborative feature allowing multiple users to view or edit templates/plans

## Prerequisites

- Node.js (v18, v20, v22, v24, v26, or v28)
- npm (>= 6.13.4) or Yarn (>= 1.21.1)
- Supabase account for backend services

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url          # Supabase project API URL
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key        # Supabase anonymous/public key
VITE_GOOGLE_CLIENT_ID=your_google_client_id          # Google OAuth client ID
```

## Installation

```bash
# Install dependencies
yarn
# or
npm install
```

## Quick Start Guide

After setting up the development environment:

1. **Sign In** - Use Google OAuth or email magic link
2. **Create a Template** - Design your budget categories and amounts
3. **Create a Plan** - Generate a budget plan from your template
4. **Track Expenses** - Register expenses and watch your budget in real-time
5. **Share** - Collaborate with others by sharing plans or templates

## Development

Start the app in development mode (hot-code reloading, error reporting, etc.):

```bash
yarn dev
# or
npm run dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Type check

```bash
yarn type-check
# or
npm run type-check
```

### Run unit tests

```bash
# Run tests in watch mode
yarn test:unit
# or
npm run test:unit

# Run tests once (CI mode)
yarn test:unit:ci
# or
npm run test:unit:ci
```

## Build for Production

```bash
yarn build
# or
npm run build
```

This will generate the production build in the `dist` directory.

## PWA Configuration

The application is configured as a Progressive Web App. You can customize the PWA settings in:

- `src-pwa/manifest.json` - For app icons, name, and theme colors
- `src-pwa/register-service-worker.ts` - For service worker configuration

## Authentication

Shephard uses Supabase for authentication with two methods:

1. **Google OAuth** - One-click sign in with Google account
2. **Magic Links** - Passwordless authentication via email

All user data is protected with Supabase Row Level Security (RLS) policies, ensuring complete data isolation between users.

## License

[MIT](LICENSE)
