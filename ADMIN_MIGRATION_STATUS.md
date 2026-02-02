# Admin Pages Migration Status

## ✅ Completed (2/9)

### 1. Admin Dashboard (`/admin/page.tsx`) ✅
**Changes:**
- Converted to server component
- Fetches real stats from database
- Shows actual recent activity from timeline events
- Calculates monthly revenue from completed payments

### 2. Requests List (`/admin/requests/page.tsx`) ✅
**Changes:**
- Server component wrapper + client component for interactivity
- Uses `getAllKits()` action
- Real-time search and filtering
- Displays actual kit data

---

## 🚧 Remaining Pages (7/9)

### Pattern for All Remaining Pages:

**Server Component** (page.tsx):
```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSomeData } from "@/lib/actions/admin/...";
import PageClient from "./PageClient";

export default async function Page() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/account/login");
  }

  const result = await getSomeData();
  return <PageClient data={result.data || []} />;
}
```

**Client Component** (PageClient.tsx):
- Keep all existing UI logic
- Replace mock data with props
- Keep filters, search, modals, etc.

---

## Remaining Pages Details

### 3. Request Detail (`/admin/requests/[id]/page.tsx`)

**Current:** Uses mock `getKitById()`
**Action to use:** `getKitDetails(id)` from `@/lib/actions/admin/kit.actions`

**Data includes:**
- Kit with all relations (customer, items, offers, timeline)
- Timeline events
- Items list
- Current offer (if any)

**Features to migrate:**
- View kit details
- Add/edit/delete items
- Generate and send offer
- Update kit status

---

### 4. Offers List (`/admin/offers/page.tsx`)

**Current:** Uses mock offers array
**Action to use:** `getAllOffers()` from `@/lib/actions/admin/offer.actions`

**Features:**
- List all offers
- Filter by status (DRAFT, SENT, ACCEPTED, DECLINED, EXPIRED)
- Search by customer or offer number
- View offer details

---

### 5. Offer Detail (`/admin/offers/[id]/page.tsx`)

**Current:** Uses mock `getOfferById()`
**Action to use:** `getOfferDetails(id)` from `@/lib/actions/admin/offer.actions`

**Data includes:**
- Offer with kit and items
- Customer information
- Payment status (if accepted)
- Item breakdown

**Features:**
- View offer details
- Resend offer
- Process payment (if accepted)

---

### 6. Payments (`/admin/payments/page.tsx`)

**Current:** Uses mock payments array
**Action to use:** `getAllPayments()` from `@/lib/actions/admin/payment.actions`

**Features:**
- List all payments
- Filter by status (PENDING, PROCESSING, SENT, COMPLETED, FAILED)
- Filter by payment method
- Update payment status
- Add tracking numbers

---

### 7. Returns (`/admin/returns/page.tsx`)

**Current:** Uses mock returns array
**Action to use:** `getAllReturns()` from `@/lib/actions/admin/shipping.actions`

**Features:**
- List all returns
- Filter by status
- Create return shipping labels
- Update return status
- Track return shipments

---

### 8. Customers List (`/admin/customers/page.tsx`)

**Current:** Uses mock customers array
**Needs:** New action `getAllCustomers()` in `src/lib/actions/admin/customer.actions.ts`

**Create action:**
```typescript
export async function getAllCustomers() {
  const session = await requireAdmin();

  const customers = await prisma.customer.findMany({
    include: {
      user: true,
      addresses: true,
      kits: true,
      payments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { success: true, data: customers };
}
```

**Features:**
- List all customers
- Search by name or email
- View customer statistics (total kits, total value)
- Link to customer detail page

---

### 9. Customer Detail (`/admin/customers/[id]/page.tsx`)

**Current:** Uses mock `getCustomerById()`
**Action to use:** Same `getAllCustomers()` or create `getCustomerById(id)`

**Data includes:**
- Customer profile
- All addresses
- All kits
- All payments
- Activity history

**Features:**
- View complete customer profile
- Edit customer information
- View all customer's kits
- View payment history

---

## Quick Migration Checklist

For each page:

- [ ] Read current page to understand structure
- [ ] Create server component wrapper
- [ ] Move interactive code to client component
- [ ] Import correct admin action
- [ ] Pass data as props to client component
- [ ] Update data references (mock → props)
- [ ] Fix status checks (lowercase → UPPERCASE)
- [ ] Test filtering and search
- [ ] Test navigation and links

---

## Example: Migrating Offers Page

**Before** (`/admin/offers/page.tsx`):
```typescript
"use client";
const offers = mockOffers; // Mock data
```

**After** (`/admin/offers/page.tsx`):
```typescript
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllOffers } from "@/lib/actions/admin/offer.actions";
import OffersClient from "./OffersClient";

export default async function OffersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/account/login");
  }

  const result = await getAllOffers();
  return <OffersClient offers={result.data || []} />;
}
```

**New file** (`/admin/offers/OffersClient.tsx`):
```typescript
"use client";
// Move all existing UI code here
// Replace mockOffers with props.offers
export default function OffersClient({ offers }) {
  // ... existing component code
}
```

---

## Testing After Migration

For each page, test:

1. **Authentication:** Try accessing without admin role
2. **Data Display:** Verify real data shows correctly
3. **Filtering:** Test all filter options
4. **Search:** Test search functionality
5. **Navigation:** Click through to detail pages
6. **Actions:** Test any mutations (create, update, delete)

---

## Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Solution:** Add optional chaining and default values
```typescript
const value = kit?.estimatedValue || 0;
const items = kit?.items || [];
```

### Issue: Status badges not working
**Solution:** Convert status to lowercase for comparison
```typescript
const statusLower = status.toLowerCase();
```

### Issue: Dates not formatting
**Solution:** Ensure dates are converted to Date objects
```typescript
const date = new Date(kit.createdAt);
```

### Issue: Decimal values showing as objects
**Solution:** Convert Prisma Decimal to number
```typescript
const amount = parseFloat(payment.amount.toString());
```

---

## Progress Tracking

- [x] Admin Dashboard
- [x] Requests List
- [ ] Request Detail
- [ ] Offers List
- [ ] Offer Detail
- [ ] Payments
- [ ] Returns
- [ ] Customers List
- [ ] Customer Detail

---

## Next Steps

1. Follow the pattern above for each remaining page
2. Test thoroughly after each migration
3. Update this document as you complete pages
4. Run `npm run build` periodically to catch type errors

The infrastructure is complete - just apply the pattern consistently!
