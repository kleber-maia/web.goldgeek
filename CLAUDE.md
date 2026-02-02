# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gold Geek is a precious metals and jewelry buying platform, converted from WordPress/Elementor to Next.js. The site retains Elementor CSS classes and data attributes for styling compatibility.

## Commands

```bash
# Development
npm run dev                # Development server at http://localhost:3000
npm run build              # Production build
npm run lint               # ESLint

# Database (Prisma + PostgreSQL)
npm run prisma:generate    # Generate Prisma client after schema changes
npm run prisma:migrate     # Create and apply database migrations
npm run prisma:seed        # Seed database with test data
npm run prisma:studio      # Open Prisma Studio (database GUI)
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
- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Prisma ORM with PostgreSQL
- Resend for transactional emails
- Zod for validation
- Swiper for carousels

### Path Alias
`@/*` maps to `./src/*`

### Directory Structure

```
src/
├── app/                       # Next.js App Router
│   ├── (main)/                # Public pages
│   ├── (account)/account/     # Customer portal (auth required)
│   ├── (admin)/admin/         # Admin dashboard (admin role required)
│   └── api/                   # API routes (auth, webhooks)
├── components/
│   ├── layout/                # Header, Footer, MobileMenu
│   ├── admin/                 # Admin UI components (Sidebar, Header, BottomNav)
│   ├── ui/                    # Motion/animation components
│   ├── sections/              # Page sections (TestimonialsCarousel)
│   └── widgets/               # External embeds (TradingViewWidget)
├── lib/
│   ├── auth/                  # Session management, magic links
│   ├── db/                    # Prisma client, utilities
│   ├── services/              # Business logic layer (8 services)
│   ├── actions/               # Server Actions for mutations
│   ├── validators/            # Zod schemas
│   └── email/                 # Email templates and sending
├── styles/
│   └── elementor/             # Exported Elementor theme CSS
└── middleware.ts              # Route protection

prisma/
├── schema.prisma              # Database schema (11 entities)
└── seed.ts                    # Test data seeding
```

### Client vs Server Components
Interactive components use `"use client"`:
- All layout components (Header, Footer, MobileMenu)
- All motion/animation components (MotionFxContainer, MotionFxImage, ScrollRotatingImage)
- Swiper carousels and external widget embeds

Page layouts are server components.

### Motion System
Custom scroll-based animations in `src/components/ui/`:
- **MotionFxContainer**: Parallax translateY on scroll
- **MotionFxImage**: Combined translateY + rotateZ animations
- **ScrollRotatingImage**: Rotation tied to scroll position

All motion components support `disableOnMobile` (768px breakpoint).

### Styling
- Elementor CSS framework imported globally
- Inline styles for dynamic values
- Mobile breakpoint: 768px
- Color palette: gold accents (#AD7B2A, #FBEF9C), dark brown backgrounds (#57370D)
- Fonts: Poppins (primary), Alegreya Sans (secondary)

### Elementor Markup
Pages preserve Elementor structure with `data-elementor-type`, `data-elementor-id`, and container classes (`e-con`, `e-con-inner`). This is intentional for CSS compatibility.

## Data Layer Architecture

### Database Schema (Prisma)

The platform uses 11 core entities:

- **User** - Authentication (email, role)
- **Customer** - Customer profile linked to User
- **Address** - Shipping/billing addresses
- **Kit** - Appraisal requests with status workflow
- **Item** - Evaluated items (metal type, weight, purity, value)
- **Offer** - Generated offers with calculated totals
- **Payment** - Payment tracking
- **Return** - Return shipments for declined offers
- **TimelineEvent** - Activity log per kit
- **ShippingLabel** - FedEx/USPS labels
- **MagicLink** - Passwordless authentication tokens

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

- **Customer actions** - Appraisal requests, offer acceptance/decline
- **Admin actions** - Item management, offer generation, payment processing, shipping

Server Actions validate input with Zod, call services, and return `ActionResult<T>`:

```typescript
type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

### Authentication Flow

Magic link (passwordless) authentication:

1. User enters email → `POST /api/auth/magic-link`
2. System creates token and sends email (in dev: logs URL to console)
3. User clicks link → `GET /api/auth/verify?token=...`
4. System creates session cookie (`gg-session`) → redirect to account
5. Middleware protects `/account/*` and `/admin/*` routes

Admin role verification happens server-side in page components using `getSession()`.

### Page Component Pattern

Admin pages follow a server/client split:

**Server Component** (`page.tsx`):
- Checks authentication and role
- Fetches data using services
- Passes data to client component

**Client Component** (`*Client.tsx`):
- Handles interactivity (forms, search, filters)
- Calls Server Actions for mutations
- Manages local UI state

Example: `/admin/customers/page.tsx` → `CustomersClient.tsx`

### Kit Status Workflow

```
PENDING → KIT_SENT → IN_TRANSIT → RECEIVED → EVALUATING → OFFER_SENT
                                                               ↓
                                                   ACCEPTED → PAID
                                                   DECLINED → RETURNED
```

Each status change is logged to `TimelineEvent` via `ActivityService`.

### Working with Prisma Decimal

Prisma's `Decimal` type must be converted for display:

```typescript
// Always convert Decimal to number for display
const amount = parseFloat(payment.amount.toString());
```

### Status Display Formatting

Convert database enums to readable format:

```typescript
status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
// "OFFER_SENT" → "Offer Sent"
```
