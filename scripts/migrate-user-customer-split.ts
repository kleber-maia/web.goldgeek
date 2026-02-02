#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting User/Customer split migration...\n");

  // Get all users with CUSTOMER role (before schema change removes role field)
  // Note: Run this BEFORE the schema migration removes the role field
  const customerUsers = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      role: string;
    }>
  >`
    SELECT u.id, u.email, u.role
    FROM "User" u
    WHERE u.role = 'CUSTOMER'
  `;

  console.log(`Found ${customerUsers.length} customer users to migrate`);

  for (const user of customerUsers) {
    // Find associated customer record
    const customer = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Customer" WHERE "userId" = ${user.id}
    `;

    if (!customer.length) {
      console.log(`Skipping user ${user.email} - no customer profile`);
      continue;
    }

    const customerId = customer[0].id;

    // Update Customer with email (using raw query since field may not exist yet)
    await prisma.$executeRaw`
      UPDATE "Customer"
      SET email = ${user.email}
      WHERE id = ${customerId}
    `;

    // Migrate magic links to CustomerMagicLink
    const magicLinks = await prisma.$queryRaw<
      Array<{
        id: string;
        token: string;
        expiresAt: Date;
        usedAt: Date | null;
        createdAt: Date;
      }>
    >`
      SELECT id, token, "expiresAt", "usedAt", "createdAt"
      FROM "MagicLink"
      WHERE "userId" = ${user.id}
    `;

    for (const link of magicLinks) {
      await prisma.$executeRaw`
        INSERT INTO "CustomerMagicLink" (id, "customerId", token, "expiresAt", "usedAt", "createdAt")
        VALUES (${link.id}, ${customerId}, ${link.token}, ${link.expiresAt}, ${link.usedAt}, ${link.createdAt})
      `;
    }

    // Delete old magic links
    await prisma.$executeRaw`
      DELETE FROM "MagicLink" WHERE "userId" = ${user.id}
    `;

    // Delete user record
    await prisma.$executeRaw`
      DELETE FROM "User" WHERE id = ${user.id}
    `;

    console.log(`Migrated customer: ${user.email}`);
  }

  // Count remaining entities
  const remainingUsers = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT COUNT(*) as count FROM "User"`;
  const allCustomers = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT COUNT(*) as count FROM "Customer"`;

  console.log(`\nMigration complete!`);
  console.log(`- Admins (User table): ${remainingUsers[0].count}`);
  console.log(`- Customers (Customer table): ${allCustomers[0].count}`);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
