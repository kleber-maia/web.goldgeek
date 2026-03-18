# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gold Geek is a precious metals and jewelry buying platform, converted from WordPress/Elementor to Next.js. The public site retains Elementor CSS classes; the dashboards use Tailwind CSS.

**Key Documentation:**
- [Kit Lifecycle](docs/kit-lifecycle.md) — Full appraisal kit lifecycle: actors, phases, diagrams, all test scenarios, and known gaps

## Three Products (CRITICAL — Read Before Any Change)

This project contains 3 distinct products sharing one codebase:

| Product | Route | Auth | Styling | Purpose |
|---------|-------|------|---------|---------|
| Public Website | `/` | None | Elementor CSS | Marketing pages |
| Customer Dashboard | `/account/*` | Customer | Tailwind + account.css | Kit tracking, offers |
| Admin Dashboard | `/admin/*` | Admin | Tailwind + admin.css | Operations, evaluations |

**Planning Rule — before implementing ANY feature or fix:**
1. Identify which products are affected
2. Most features affect BOTH `/account` AND `/admin` — plan for both
3. UI changes must be tested at mobile (375px) AND desktop (1024px+)
4. Don't implement in one dashboard and forget the other

**Shared concerns between dashboards:** kits, offers, payments, customer info, timeline events, status badges

## Commands

```bash
# Development
npm run dev                # Development server at http://localhost:3000
npm run build              # Production build (runs prisma generate first)
npm run lint               # ESLint

# Database (Prisma + PostgreSQL)
npm run prisma:generate    # Generate Prisma client after schema changes
npm run prisma:migrate     # Create and apply database migrations
npm run prisma:seed        # Seed database with test data
npm run prisma:studio      # Open Prisma Studio (database GUI)

# Admin user management (uses scripts/manage-admin.ts)
npm run admin:create       # Interactive: create new admin user
npm run admin:list         # List all admin users
npm run admin:delete       # Interactive: delete admin user

# One-time migration (already run in production)
npm run migrate:split      # Migrates User/Customer table separation
```

## Environment Setup

Required environment variables in `.env`:

```env
DATABASE_URL="postgresql://..."           # PostgreSQL connection string
SESSION_SECRET="..."                      # For session encryption
MAGIC_LINK_SECRET="..."                   # For magic link tokens
RESEND_API_KEY="..."                      # Email service (optional in dev)
EMAIL_FROM="noreply@goldgeek.com"        # Sender email
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Architecture

### Tech Stack
- Next.js 16.1 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4 (dashboards only, via `@tailwindcss/postcss`)
- Prisma ORM 7.x with PostgreSQL (via `@prisma/adapter-pg`)
- Resend for transactional emails
- Zod 4.x for validation
- Swiper for carousels
- bcrypt for password hashing
- nanoid for token generation

### Authentication Architecture

**Critical Distinction:**
- **User** = Admin staff only (managed via `npm run admin:create`)
- **Customer** = Buyers/sellers (self-register via magic link)

These are SEPARATE entities with SEPARATE magic link tables:
- `MagicLink` - for User (admins)
- `CustomerMagicLink` - for Customer (buyers)

**Why it matters:**
- Never join User <-> Customer (they're independent)
- Two separate auth flows: `/admin/login` vs `/account/login`
- Auth checks are server-side in page components (no middleware)

**Auth helper functions** (`src/lib/auth/session.ts`):
- `getSession()` - Returns `{ id, email, type: 'admin' | 'customer' }` or null
- `requireAuth()` - Throws if not authenticated
- `requireAdmin()` - Throws if not admin
- `requireCustomer()` - Throws if not customer
- `getAdminUser()` - Returns full admin user or null
- `getCurrentCustomer()` - Returns customer with addresses or null
- `createSession()` / `destroySession()` - Session lifecycle

### Path Alias
`@/*` maps to `./src/*`

### Directory Structure

```
src/
├── app/                       # Next.js App Router
│   ├── (main)/                # Public pages (home, how-it-works, what-we-buy, etc.)
│   ├── (account)/account/     # Customer portal (auth required)
│   ├── (admin)/admin/         # Admin dashboard (admin role required)
│   └── api/                   # API routes (auth endpoints)
├── components/
│   ├── shared/                # Shared between account and admin dashboards (Tailwind)
│   ├── account/               # Customer dashboard only (layout + UI components)
│   ├── admin/                 # Admin dashboard only (AdminSidebar, AdminHeader, AdminBottomNav)
│   ├── layout/                # Public site layout (Header, Footer, MobileMenu)
│   ├── ui/                    # Motion/animation components (public site)
│   ├── sections/              # Page sections (TestimonialsCarousel)
│   └── widgets/               # External embeds (TradingViewWidget)
├── lib/
│   ├── auth/                  # Session management, magic links
│   ├── db/                    # Prisma client, utilities (generateKitNumber, serializePrismaData, etc.)
│   ├── services/              # Business logic layer (8 services)
│   ├── actions/               # Server Actions for mutations
│   ├── validators/            # Zod schemas
│   └── email/                 # Email templates and sending
├── styles/
│   ├── globals.css            # Global styles + Elementor imports (public site)
│   ├── dashboard.css          # Tailwind CSS import (dashboards only)
│   ├── elementor/             # Exported Elementor theme CSS (38 files, public site only)
│   ├── account/
│   │   └── account.css        # Customer dashboard custom styles
│   └── admin/
│       └── admin.css          # Admin dashboard custom styles
└── (no middleware.ts)         # Auth is handled server-side in page components

prisma/
├── schema.prisma              # Database schema (12 entities)
└── seed.ts                    # Test data seeding

scripts/
├── manage-admin.ts            # Admin user CLI management
└── migrate-user-customer-split.ts  # One-time migration script
```

### Client vs Server Components
Interactive components use `"use client"`:
- All layout components (Header, Footer, MobileMenu)
- All motion/animation components (MotionFxContainer, MotionFxImage, ScrollRotatingImage)
- Swiper carousels and external widget embeds
- Account and admin layout components

Page layouts are server components.

### Motion System

Custom scroll-based animations in `src/components/ui/`:

| Component | Effect | Props |
|-----------|--------|-------|
| MotionFxContainer | Parallax translateY | speed, disableOnMobile |
| MotionFxImage | translateY + rotateZ | parallaxSpeed, rotationSpeed |
| ScrollRotatingImage | Rotation on scroll | speed, direction |

All support `disableOnMobile` (768px breakpoint).

### Styling Architecture

**Public Website** — Elementor CSS (DO NOT CHANGE the approach)
- 38 Elementor CSS files in `src/styles/elementor/`
- Imported via `src/styles/globals.css`
- Uses Elementor classes: `e-con`, `elementor-widget`, `elementor-element-*`
- Pages preserve Elementor structure with `data-elementor-type`, `data-elementor-id`
- DO NOT add Elementor classes to dashboard components

**Customer & Admin Dashboards** — Tailwind CSS + custom CSS
- Tailwind CSS imported via `src/styles/dashboard.css` (shared by both dashboards)
- `src/styles/account/account.css` — account-specific custom styles
- `src/styles/admin/admin.css` — admin-specific custom styles
- New dashboard UI should prefer Tailwind classes over custom CSS
- Shared components in `src/components/shared/` use Tailwind only
- Existing custom CSS classes (`.account-*`, `.admin-*`) still work alongside Tailwind

**Brand Colors (all products):**
- Primary Gold: `#AD7B2A`
- Accent Yellow: `#FBEF9C`
- Dark Brown: `#57370D`
- Text Dark: `#2E1F0C`

**Fonts:** Poppins (primary), Alegreya Sans (secondary)

### Mobile-First Design (All Products)

All 3 products are mobile-first. Base styles target mobile; media queries enhance for larger screens.

**Breakpoints:**
- `480px` — small mobile adjustments
- `768px` — primary breakpoint (tablet, dashboard layout changes)
- `1024px` — desktop (admin sidebar appears, table views replace cards)

**Navigation patterns:**
- Mobile: bottom navigation bar (fixed, 88px height padding)
- Desktop: sidebar (admin at 1024px+) or header links (public site)

**Rules:**
- Every UI change MUST work at 375px AND 1024px+
- Never fix one viewport and break the other
- Test mobile first, then verify desktop
- Use `min-width` media queries (mobile-first), not `max-width`

**Print context (Digital Kit):**
- Forces 7.5in width for letter-size printing
- Has separate `@media print` rules in `account.css`
- Print changes are high-risk for mobile display — test both

## Data Layer Architecture

### Database Schema (Prisma)

The platform uses 12 core entities:

- **User** - Admin authentication (email, passwordHash, role)
- **Customer** - Customer profile (name, email, phone, paymentPreferences)
- **Address** - Shipping/billing addresses (linked to Customer)
- **Kit** - Appraisal requests with status workflow
- **Item** - Evaluated items (metal type, weight, purity, value)
- **Offer** - Generated offers with calculated totals and item snapshots
- **Payment** - Payment tracking (method, status, amounts)
- **Return** - Return shipments for declined offers
- **TimelineEvent** - Activity log per kit
- **ShippingLabel** - FedEx/USPS labels with tracking
- **MagicLink** - Passwordless auth tokens for admins
- **CustomerMagicLink** - Passwordless auth tokens for customers

Key enums: `KitStatus`, `ItemType`, `MetalType`, `OfferStatus`, `PaymentMethod`, `PaymentStatus`, `ReturnStatus`, `ShippingCarrier`, `EventType`

### Service Layer Pattern

Business logic is centralized in `src/lib/services/`:

- **CustomerService** - Profile and address CRUD
- **KitService** - Kit creation, status updates, timeline
- **ItemService** - Add/update/delete items, value calculations
- **OfferService** - Generate offers from kit items
- **PaymentService** - Create and update payments
- **ReturnService** - Track return shipments
- **ShippingService** - Generate shipping labels
- **ActivityService** - Log timeline events

Services handle database operations and return type-safe results. Always use services instead of direct Prisma calls in application code.

### Server Actions

All mutations use Server Actions in `src/lib/actions/`:

**Customer actions:** (`src/lib/actions/`)
- `customer.actions.ts` - Profile updates, address management
- `kit.actions.ts` - Kit creation, offer responses (accept/decline)

**Admin actions:** (`src/lib/actions/admin/`)
- `customer.actions.ts` - Search and manage customers
- `item.actions.ts` - Item evaluation and pricing
- `kit.actions.ts` - Kit status updates, notes
- `offer.actions.ts` - Offer generation and sending
- `payment.actions.ts` - Payment processing
- `shipping.actions.ts` - Shipping label generation
- `user.actions.ts` - Admin user management

Server Actions validate input with Zod, call services, and return `ActionResult<T>`:

```typescript
type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

### API Routes

```
/api/auth/magic-link  POST  - Request magic link (email login)
/api/auth/verify      GET   - Verify token and create session
/api/auth/logout      POST  - Destroy session
```

### Authentication Flow

Magic link (passwordless) authentication:

1. User enters email -> `POST /api/auth/magic-link`
2. System creates token and sends email (in dev: logs URL to console)
3. User clicks link -> `GET /api/auth/verify?token=...`
4. System creates session cookie (`gg-session`) -> redirect to account/admin
5. Page components check auth via `requireAdmin()` / `requireCustomer()`

### Shared Components

Components used by both dashboards go in `src/components/shared/` (Tailwind only).
Account-only components: `src/components/account/`
Admin-only components: `src/components/admin/`

When building UI that both dashboards need (status badges, timeline, kit info cards), create a shared component first. Don't duplicate between account and admin.

### Page Component Pattern

Both dashboards follow a server/client split:

**Server Component** (`page.tsx`):
- Checks authentication via `requireAdmin()` or `requireCustomer()`
- Fetches data using services
- Passes data to client component

**Client Component** (`*Client.tsx`):
- Handles interactivity (forms, search, filters)
- Calls Server Actions for mutations
- Manages local UI state

Examples: `/admin/customers/page.tsx` -> `CustomersClient.tsx`, `/account/kits/page.tsx` -> client component

### Kit Status Workflow

```
PENDING -> KIT_SENT -> IN_TRANSIT -> RECEIVED -> EVALUATING -> OFFER_SENT
                                                                   |
                                                       ACCEPTED -> PAID
                                                       DECLINED -> RETURNED
                                                       (CANCELLED from any state)
```

Each status change is logged to `TimelineEvent` via `ActivityService`.

### Database Utilities (`src/lib/db/utils.ts`)

- `generateKitNumber()` - Format: GG-YYYY-XXXXXX
- `generateOfferNumber()` - Format: OFF-YYYY-XXXXXX
- `generatePaymentNumber()` - Format: PAY-YYYY-XXXXXX
- `generateReturnNumber()` - Format: RET-YYYY-XXXXXX
- `generateToken()` - nanoid-based tokens for magic links
- `serializePrismaData()` - Converts Decimal/Date objects for client components
- `formatCurrency()` / `formatWeight()` - Display formatting

### Working with Prisma Decimal

Prisma's `Decimal` type must be converted for display:

```typescript
// Always convert Decimal to number for display
const amount = parseFloat(payment.amount.toString());

// Or use serializePrismaData() to convert entire objects
import { serializePrismaData } from '@/lib/db/utils';
const serialized = serializePrismaData(prismaResult);
```

### Status Display Formatting

Convert database enums to readable format:

```typescript
status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
// "OFFER_SENT" -> "Offer Sent"
```

### Email Templates (`src/lib/email/`)

Available email functions:
- `sendMagicLinkEmail()` - Login magic link
- `sendOfferReadyEmail()` - Offer notification
- `sendPaymentSentEmail()` - Payment confirmation
- `sendKitReceivedEmail()` - Kit received notification
