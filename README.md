# Gold Geek

Precious metals and jewelry buying platform built with Next.js. Customers request appraisal kits, send in their items, receive offers, and get paid — all managed through admin and customer portals.

## Products

| Product | Route | Description |
|---------|-------|-------------|
| Public Website | `/` | Marketing pages (how it works, what we buy/pay, FAQ) |
| Customer Dashboard | `/account` | Kit tracking, offer review, payment preferences |
| Admin Dashboard | `/admin` | Kit evaluation, offer generation, payments, returns |

## Tech Stack

- **Next.js 16.1** with App Router
- **React 19** with TypeScript
- **Tailwind CSS v4** (dashboards)
- **Prisma ORM 7.x** with PostgreSQL
- **Resend** for transactional emails
- **Zod 4.x** for validation
- **Swiper** for carousels

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd goldgeek
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables — copy `.env.example` or create `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/goldgeek"
   SESSION_SECRET="your-session-secret"
   MAGIC_LINK_SECRET="your-magic-link-secret"
   RESEND_API_KEY="re_xxxxx"              # Optional in dev
   EMAIL_FROM="noreply@goldgeek.com"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. Set up the database:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed        # Optional: seed test data
   ```

5. Create an admin user:
   ```bash
   npm run admin:create
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create and apply migrations |
| `npm run prisma:seed` | Seed test data |
| `npm run prisma:studio` | Database GUI |
| `npm run admin:create` | Create admin user |
| `npm run admin:list` | List admin users |
| `npm run admin:delete` | Delete admin user |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/             # Public marketing pages
│   ├── (account)/account/  # Customer dashboard
│   ├── (admin)/admin/      # Admin dashboard
│   └── api/                # Auth API routes
├── components/
│   ├── shared/             # Shared dashboard components (Tailwind)
│   ├── account/            # Customer dashboard components
│   ├── admin/              # Admin dashboard components
│   └── layout/             # Public site (Header, Footer, MobileMenu)
├── lib/
│   ├── auth/               # Session & magic link auth
│   ├── db/                 # Prisma client & utilities
│   ├── services/           # Business logic (8 services)
│   ├── actions/            # Server Actions
│   ├── validators/         # Zod schemas
│   └── email/              # Email templates
└── styles/
    ├── globals.css         # Elementor imports (public site)
    ├── dashboard.css       # Tailwind import (dashboards)
    ├── account/            # Customer dashboard CSS
    └── admin/              # Admin dashboard CSS
```

## Styling

- **Public site:** Elementor CSS (legacy from WordPress conversion)
- **Dashboards:** Tailwind CSS v4 + custom CSS (`account.css`, `admin.css`)

## Authentication

Uses passwordless magic link authentication with separate flows for:

- **Admins** (`/admin/login`) — managed via CLI (`npm run admin:create`)
- **Customers** (`/account/login`) — self-register via email

In development, magic link URLs are logged to the console.

## Kit Workflow

```
PENDING -> KIT_SENT -> IN_TRANSIT -> RECEIVED -> EVALUATING -> OFFER_SENT
                                                                   |
                                                       ACCEPTED -> PAID
                                                       DECLINED -> RETURNED
```

## Deployment

Deployed on Vercel. The build command runs `prisma generate` automatically before `next build`.

## License

Private.
