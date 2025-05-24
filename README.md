# Shephard

Smart expenses wallet - A modern, responsive web application for managing personal expenses with Supabase integration.

## Features

- **Authentication**
  - Google OAuth integration
  - Email magic links (passwordless auth)
  - Secure authentication flow with Supabase
- **User Profile Management**
  - View and update profile information
  - Profile picture support from OAuth providers
- **Progressive Web App (PWA)**
  - Offline capability
  - Mobile-friendly responsive design
- **Modern Tech Stack**
  - Vue 3 with Composition API
  - TypeScript for type safety
  - Quasar Framework for UI components
  - Pinia for state management

## Prerequisites

- Node.js (v18, v20, v22, v24, v26, or v28)
- npm (>= 6.13.4) or Yarn (>= 1.21.1)
- Supabase account for backend services

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Installation

```bash
# Install dependencies
yarn
# or
npm install
```

## Development

Start the app in development mode (hot-code reloading, error reporting, etc.):

```bash
yarn dev
# or
npm run dev
# or
quasar dev
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

### Run unit tests

```bash
yarn test:unit
# or
npm run test:unit
```

## Build for Production

```bash
yarn build
# or
npm run build
# or
quasar build
```

This will generate the production build in the `dist` directory.

## PWA Configuration

The application is configured as a Progressive Web App. You can customize the PWA settings in:

- `src-pwa/manifest.json` - For app icons, name, and theme colors
- `src-pwa/register-service-worker.js` - For service worker configuration

## Project Structure

```
.
├── public/              # Static assets
├── src/                 # Source files
│   ├── assets/          # Application assets
│   ├── boot/            # Boot files (executed before app startup)
│   ├── components/      # Vue components
│   ├── composables/     # Reusable composition functions
│   ├── css/             # Global CSS
│   ├── i18n/            # Internationalization
│   ├── layouts/         # Application layouts
│   ├── lib/             # Libraries and utilities
│   ├── pages/           # Application pages
│   ├── router/          # Vue Router configuration
│   ├── services/        # Domain-driven service layer for business logic
│   ├── stores/          # Pinia stores
│   └── utils/           # Utility functions
├── src-pwa/             # PWA specific files
│   └── manifest.json    # PWA manifest
├── test/                # Test files
├── .env                 # Environment variables (create this)
├── quasar.config.ts     # Quasar Framework configuration
└── tsconfig.json        # TypeScript configuration
```

## Authentication

Shephard uses Supabase for authentication with two methods:

1. **Google OAuth** - Sign in with Google account
2. **Magic Links** - Passwordless email authentication

## License

[MIT](LICENSE)
