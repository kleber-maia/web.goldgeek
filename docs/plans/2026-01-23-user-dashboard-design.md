# User Dashboard Design

## Overview

Convert the user dashboard prototype from `#prototype-html-static/user/` into a Next.js sub-site with complete style isolation from the main Gold Geek website.

## Pages

| Route | Description |
|-------|-------------|
| `/account/login` | Magic link email entry |
| `/account/check-email` | Confirmation after login submit |
| `/account/auth-callback` | Handles magic link redirect |
| `/account` | Dashboard home with kit list |
| `/account/kit/[id]` | Kit detail with timeline and status |
| `/account/kit/[id]/shipping-label` | Printable shipping label |
| `/account/kit/[id]/accept` | Accept offer with payment selection |
| `/account/kit/[id]/decline` | Decline offer confirmation |
| `/account/settings` | Profile and payment preferences |

## Architecture

### Route Structure

```
src/app/
├── (main)/              # Main website (existing)
│   ├── layout.tsx       # Header + Footer
│   └── ...
└── (account)/           # User dashboard (isolated)
    ├── layout.tsx       # Dashboard layout (no Header/Footer)
    └── account/
        ├── page.tsx
        ├── login/page.tsx
        ├── check-email/page.tsx
        ├── auth-callback/page.tsx
        ├── settings/page.tsx
        └── kit/[id]/
            ├── page.tsx
            ├── shipping-label/page.tsx
            ├── accept/page.tsx
            └── decline/page.tsx
```

### Style Isolation

- Dashboard styles: `src/styles/account/account.css`
- Imports only Poppins font, not Elementor CSS
- Main site layout unchanged, wraps existing pages
- Dashboard layout provides its own components

### Components

```
src/components/account/
├── layout/
│   ├── AccountHeader.tsx
│   ├── BottomNav.tsx
│   └── AccountContainer.tsx
├── ui/
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── FormInput.tsx
│   ├── KitCard.tsx
│   ├── OfferBanner.tsx
│   ├── PaymentOption.tsx
│   ├── Section.tsx
│   └── Timeline.tsx
└── icons/
    └── (heroicons or custom SVGs)
```

### Data Layer

```
src/lib/account/
├── types.ts       # TypeScript interfaces
├── mock-data.ts   # Sample data (replace with API later)
├── auth.ts        # Session management
└── utils.ts       # Formatters and helpers
```

## Key Types

```typescript
interface Kit {
  id: string;
  customerId: string;
  kitType: 'physical' | 'digital';
  status: KitStatus;
  createdAt: string;
  trackingNumber?: string;
}

interface Offer {
  id: string;
  kitId: string;
  totalValue: number;
  expiresAt?: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address?: Address;
}

type KitStatus =
  | 'pending'
  | 'kit_sent'
  | 'in_transit'
  | 'received'
  | 'evaluating'
  | 'offer_sent'
  | 'accepted'
  | 'declined'
  | 'paid'
  | 'returned';
```

## Implementation Order

1. Foundation - Route groups, layout, styles
2. Auth flow - Login, check-email, auth-callback
3. Dashboard - Home page with kit cards
4. Kit detail - Detail page with timeline
5. Actions - Accept/decline, shipping label
6. Settings - Profile and payment preferences

## Notes

- Mock auth uses localStorage (swap for real auth later)
- Mobile-first responsive design
- Bottom navigation on mobile, header on desktop
- Print styles for shipping label page
