# User/Customer Table Separation & Admin Management

**Date:** 2026-02-02
**Status:** Approved for Implementation
**Estimated Effort:** 8-12 hours

## Overview

Refactor authentication architecture to separate admin users (User table) from customers (Customer table), eliminating the dual-purpose User table. Add admin user management UI and CLI tools.

## Current Architecture Problems

- **User table serves two purposes:** Both admins (role=ADMIN) and customers (role=CUSTOMER)
- **Customer table depends on User:** Has userId foreign key
- **Confusing data model:** Customers exist in two tables (User + Customer)
- **No admin management tools:** Can't easily create/delete admin users

## Target Architecture

- **User table:** Admins only (no role field needed)
- **Customer table:** Independent, has email field for authentication
- **Separate magic links:** AdminMagicLink (User) and CustomerMagicLink (Customer)
- **Typed sessions:** Session stores type ('admin' | 'customer')
- **Admin management:** Web UI at `/admin/users` + CLI scripts

---

## 1. Database Schema Changes

### Modified Models

```prisma
// User - Admins ONLY
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  magicLinks     MagicLink[]
  timelineEvents TimelineEvent[]

  @@index([email])
}

// Customer - INDEPENDENT (no userId)
model Customer {
  id          String   @id @default(cuid())
  email       String   @unique  // NEW
  firstName   String
  lastName    String
  phone       String?
  companyName String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  magicLinks  CustomerMagicLink[]  // NEW
  addresses   Address[]
  kits        Kit[]
  payments    Payment[]

  @@index([email])
}

// NEW: CustomerMagicLink for customer authentication
model CustomerMagicLink {
  id         String   @id @default(cuid())
  customerId String
  token      String   @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([customerId])
}

// MagicLink - For admin authentication (unchanged structure)
model MagicLink {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}
```

### Removed

- `UserRole` enum (no longer needed)
- `userId` field from Customer model
- `user` relation from Customer model

---

## 2. Authentication System Changes

### Magic Link Creation

**File:** `src/lib/auth/magic-link.ts`

```typescript
export async function createMagicLink(email: string): Promise<{
  token: string;
  type: 'admin' | 'customer';
}> {
  // Check if admin exists
  const admin = await prisma.user.findUnique({ where: { email } });

  if (admin) {
    const token = generateToken();
    await prisma.magicLink.create({
      data: { userId: admin.id, token, expiresAt: calculateExpiration() }
    });
    return { token, type: 'admin' };
  }

  // Check/create customer
  let customer = await prisma.customer.findUnique({ where: { email } });

  if (!customer) {
    customer = await prisma.customer.create({
      data: { email, firstName: '', lastName: '' }
    });
  }

  const token = generateToken();
  await prisma.customerMagicLink.create({
    data: { customerId: customer.id, token, expiresAt: calculateExpiration() }
  });

  return { token, type: 'customer' };
}

export async function verifyMagicLink(token: string): Promise<{
  id: string;
  type: 'admin' | 'customer';
} | null> {
  // Check admin magic link
  const adminLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true }
  });

  if (adminLink && !adminLink.usedAt && new Date() < adminLink.expiresAt) {
    await prisma.magicLink.update({
      where: { id: adminLink.id },
      data: { usedAt: new Date() }
    });
    return { id: adminLink.userId, type: 'admin' };
  }

  // Check customer magic link
  const customerLink = await prisma.customerMagicLink.findUnique({
    where: { token },
    include: { customer: true }
  });

  if (customerLink && !customerLink.usedAt && new Date() < customerLink.expiresAt) {
    await prisma.customerMagicLink.update({
      where: { id: customerLink.id },
      data: { usedAt: new Date() }
    });
    return { id: customerLink.customerId, type: 'customer' };
  }

  return null;
}
```

### Session Management

**File:** `src/lib/auth/session.ts`

```typescript
export interface Session {
  id: string;
  email: string;
  type: 'admin' | 'customer';
}

export async function createSession(id: string, type: 'admin' | 'customer'): Promise<void> {
  const sessionData = JSON.stringify({ id, type });
  const cookieStore = await cookies();
  cookieStore.set('gg-session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('gg-session');

  if (!sessionCookie?.value) return null;

  const { id, type } = JSON.parse(sessionCookie.value);

  if (type === 'admin') {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true }
    });
    return user ? { id: user.id, email: user.email, type: 'admin' } : null;
  } else {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, email: true }
    });
    return customer ? { id: customer.id, email: customer.email, type: 'customer' } : null;
  }
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.type !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
}
```

### Auth API Routes

**File:** `src/app/api/auth/magic-link/route.ts`
- Update to handle new return type from `createMagicLink`

**File:** `src/app/api/auth/verify/route.ts`
```typescript
const result = await verifyMagicLink(token);
if (!result) return redirect('/login?error=invalid_token');

await createSession(result.id, result.type);

if (result.type === 'admin') {
  return redirect('/admin');
} else {
  return redirect('/account');
}
```

---

## 3. Migration Strategy

### Migration Script

**File:** `scripts/migrate-user-customer-split.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting User/Customer split migration...');

  const customerUsers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: { customer: true }
  });

  console.log(`Found ${customerUsers.length} customer users to migrate`);

  for (const user of customerUsers) {
    if (!user.customer) {
      console.log(`Skipping user ${user.email} - no customer profile`);
      continue;
    }

    // Update Customer with email
    await prisma.customer.update({
      where: { id: user.customer.id },
      data: { email: user.email }
    });

    // Migrate magic links
    const magicLinks = await prisma.magicLink.findMany({
      where: { userId: user.id }
    });

    for (const link of magicLinks) {
      await prisma.customerMagicLink.create({
        data: {
          customerId: user.customer.id,
          token: link.token,
          expiresAt: link.expiresAt,
          usedAt: link.usedAt,
          createdAt: link.createdAt
        }
      });
    }

    // Delete old magic links and user
    await prisma.magicLink.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log(`Migrated customer: ${user.email}`);
  }

  const remainingUsers = await prisma.user.count();
  const allCustomers = await prisma.customer.count();

  console.log(`\nMigration complete!`);
  console.log(`- Admins (User table): ${remainingUsers}`);
  console.log(`- Customers (Customer table): ${allCustomers}`);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Safe Migration Process

1. **Backup database** (Supabase snapshot)
2. **Create new schema** (`prisma migrate dev`)
3. **Run migration script** (`tsx scripts/migrate-user-customer-split.ts`)
4. **Verify data integrity**
5. **Test authentication flows**
6. **Deploy changes**

### Rollback Plan

- Restore from Supabase snapshot if needed
- Keep migration script reversible
- Document rollback procedure

---

## 4. Code Updates Required

### Services Layer (`src/lib/services/`)

**CustomerService:**
- Remove `user` includes from queries
- Use `email` field directly from Customer
- Update return types

**ActivityService:**
- Handle both admin User and Customer contexts
- Update timeline event creation

### Server Actions (`src/lib/actions/`)

**admin/customer.actions.ts:**
```typescript
// BEFORE
const customer = await prisma.customer.findUnique({
  where: { id: customerId },
  include: { user: true, addresses: true, kits: true }
});

// AFTER
const customer = await prisma.customer.findUnique({
  where: { id: customerId },
  select: {
    id: true,
    email: true,  // Now on Customer directly
    firstName: true,
    lastName: true,
    addresses: true,
    kits: true
  }
});
```

### Admin Pages (`src/app/(admin)/admin/`)

- Update all customer queries to remove `user` relation
- Display `customer.email` instead of `customer.user.email`

### Customer Pages (`src/app/(account)/account/`)

- Use `session.id` as `customerId` directly
- Remove user relation lookups

---

## 5. Admin User Management Features

### A. Web UI - `/admin/users`

**Page:** `src/app/(admin)/admin/users/page.tsx` (Server Component)
```typescript
export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.type !== 'admin') {
    redirect('/admin/login');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <UsersClient users={users} />;
}
```

**Client:** `src/app/(admin)/admin/users/UsersClient.tsx`

Features:
- Table with columns: Email, Created, Actions
- "Create Admin" button → modal with email input
- Delete button (with confirmation dialog)
- Search/filter by email

**Actions:** `src/lib/actions/admin/user.actions.ts`
```typescript
export async function createAdminUser(email: string): Promise<ActionResult>
export async function deleteAdminUser(userId: string): Promise<ActionResult>
export async function getAllAdminUsers(): Promise<ActionResult>
```

**Sidebar Navigation:**
Add to `src/components/admin/AdminSidebar.tsx`:
```typescript
{
  href: "/admin/users",
  label: "Admin Users",
  icon: <ShieldCheckIcon />
}
```

### B. CLI Script

**File:** `scripts/manage-admin.ts`

```typescript
#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const command = process.argv[2];
const email = process.argv[3];

async function createAdmin(email: string) {
  const user = await prisma.user.create({
    data: { email }
  });
  console.log(`✓ Created admin user: ${email}`);
  console.log(`User ID: ${user.id}`);
}

async function listAdmins() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\nAdmin Users (${users.length}):\n`);
  users.forEach(u => {
    console.log(`- ${u.email} (created: ${u.createdAt.toLocaleDateString()})`);
  });
}

async function deleteAdmin(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`❌ Admin not found: ${email}`);
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`✓ Deleted admin user: ${email}`);
}

switch (command) {
  case 'create':
    await createAdmin(email);
    break;
  case 'list':
    await listAdmins();
    break;
  case 'delete':
    await deleteAdmin(email);
    break;
  default:
    console.log('Usage:');
    console.log('  npm run admin:create <email>');
    console.log('  npm run admin:list');
    console.log('  npm run admin:delete <email>');
}

await prisma.$disconnect();
```

**package.json scripts:**
```json
{
  "scripts": {
    "admin:create": "tsx scripts/manage-admin.ts create",
    "admin:list": "tsx scripts/manage-admin.ts list",
    "admin:delete": "tsx scripts/manage-admin.ts delete",
    "migrate:split": "tsx scripts/migrate-user-customer-split.ts"
  }
}
```

---

## 6. Testing & Verification

### Database Verification
```bash
npm run prisma:studio
```
Check:
- User table contains only admin emails
- Customer table has email field populated
- CustomerMagicLink table exists
- No orphaned records

### Authentication Testing

**Admin Flow:**
1. Visit `/admin/login`
2. Enter admin email
3. Receive magic link
4. Click link → redirects to `/admin`
5. Verify session type='admin'

**Customer Flow:**
1. Visit `/account/login`
2. Enter customer email
3. Receive magic link
4. Click link → redirects to `/account`
5. Verify session type='customer'

**Edge Cases:**
- Non-existent customer email → auto-creates Customer
- Non-existent admin email → error (admins must be pre-created)
- Expired/used magic link → error message

### Admin Management Testing

**Web UI:**
```bash
# Visit /admin/users
# Create new admin → verify appears in list
# Delete admin → verify removed
# Search functionality works
```

**CLI:**
```bash
npm run admin:create test@admin.com  # Creates admin
npm run admin:list                    # Lists all admins
npm run admin:delete test@admin.com   # Removes admin
```

### Data Integrity

**Customer Features:**
- Create kit request ✓
- View offers ✓
- Accept/decline offers ✓
- View payment history ✓

**Admin Features:**
- View all requests ✓
- Evaluate items ✓
- Generate offers ✓
- Process payments ✓
- Manage customers ✓

---

## Critical Files to Modify

### Schema & Migration
- `prisma/schema.prisma` - Update models
- `scripts/migrate-user-customer-split.ts` - New migration script
- `scripts/manage-admin.ts` - New CLI tool

### Authentication
- `src/lib/auth/magic-link.ts` - Dual-table auth
- `src/lib/auth/session.ts` - Typed sessions
- `src/app/api/auth/magic-link/route.ts` - Handle type
- `src/app/api/auth/verify/route.ts` - Type-based redirect

### Services
- `src/lib/services/customer.service.ts` - Remove user relation
- `src/lib/services/activity.service.ts` - Handle both types

### Actions
- `src/lib/actions/admin/customer.actions.ts` - Update queries
- `src/lib/actions/admin/user.actions.ts` - New file for admin management

### UI
- `src/app/(admin)/admin/users/page.tsx` - New page
- `src/app/(admin)/admin/users/UsersClient.tsx` - New component
- `src/components/admin/AdminSidebar.tsx` - Add nav item
- All admin customer pages - Remove user includes

---

## Implementation Order

1. ✅ **Backup database** (Supabase snapshot)
2. ✅ **Update Prisma schema** (add fields, new models)
3. ✅ **Create migration** (`prisma migrate dev`)
4. ✅ **Run data migration script**
5. ✅ **Update authentication system** (magic-link, session)
6. ✅ **Update auth API routes**
7. ✅ **Update services layer**
8. ✅ **Update server actions**
9. ✅ **Update admin pages**
10. ✅ **Update customer pages**
11. ✅ **Build admin management UI**
12. ✅ **Create CLI scripts**
13. ✅ **Test thoroughly**
14. ✅ **Deploy**

---

## Success Criteria

- ✅ User table contains only admins
- ✅ Customer table is independent with email field
- ✅ Authentication works for both admin and customer
- ✅ Sessions correctly identify type
- ✅ All existing features still work
- ✅ Admin management UI functional
- ✅ CLI scripts work correctly
- ✅ No data loss during migration
- ✅ Rollback procedure documented and tested
