# Lendora

Lendora is a multi-vendor rent and return ecommerce platform with seller verification, escrow-style deposit handling, QR handover tracking, return workflows, disputes, refunds, dashboards, and a bKash-ready payment structure.

## Stack

- Frontend: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn-style components, Framer Motion, React Hook Form, Zod
- Backend: Node.js, Express.js, JWT authentication
- Database: MySQL for XAMPP
- Storage: local upload structure with Cloudinary-ready service boundaries
- Payment: bKash tokenized payment structure, deposits, refunds

## Quick Start

1. Create a MySQL database named `lendora` in XAMPP.
2. Import `database/schema.sql`, then `database/seed.sql`.
3. Copy `.env.example` to `.env` and fill in secrets.
4. Install dependencies from this folder with `npm install`.
5. Run the API with `npm run dev:api`.
6. Run the web app with `npm run dev:web`.

## Run Commands

Use these commands from the repository root (`lendora`):

- Install all workspace dependencies:

```
npm install
```

- Start both apps in development (runs Next.js and the API watcher):

```
npm run dev
```

- Start only the API dev server:

```
npm run dev:api
```

- Start only the web dev server:

```
npm run dev:web
```

- Build both apps for production:

```
npm run build
```

For production you can run each package directly from its workspace: `npm --workspace @lendora/api start` and `npm --workspace @lendora/web start`.

## Demo Accounts

- Admin: `admin@lendora.test` / `Password123!`
- Seller: `seller@lendora.test` / `Password123!`
- Customer: `customer@lendora.test` / `Password123!`

## Included

- Complete SQL table design for the requested entities
- API routes, controllers, middleware, services, and schedulers
- Responsive public pages and role dashboards
- Product cards, search filters, timelines, skeletons, dark mode, empty states
- Logo assets: full logo, icon logo, favicon
- Deployment guide and environment variable reference
