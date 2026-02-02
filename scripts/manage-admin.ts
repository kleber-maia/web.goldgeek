#!/usr/bin/env tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const command = process.argv[2];
const email = process.argv[3];

async function createAdmin(email: string) {
  if (!email || !email.includes("@")) {
    console.log("Please provide a valid email address");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already exists
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    console.log(`Admin user already exists: ${normalizedEmail}`);
    process.exit(1);
  }

  // Check if it's a customer email
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingCustomer) {
    console.log(`This email is registered as a customer. Use a different email.`);
    process.exit(1);
  }

  const user = await prisma.user.create({
    data: { email: normalizedEmail },
  });

  console.log(`Created admin user: ${normalizedEmail}`);
  console.log(`User ID: ${user.id}`);
}

async function listAdmins() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nAdmin Users (${users.length}):\n`);

  if (users.length === 0) {
    console.log("No admin users found.");
    return;
  }

  users.forEach((u) => {
    console.log(`- ${u.email} (created: ${u.createdAt.toLocaleDateString()})`);
  });
}

async function deleteAdmin(email: string) {
  if (!email) {
    console.log("Please provide an email address");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    console.log(`Admin not found: ${normalizedEmail}`);
    process.exit(1);
  }

  // Check if it's the last admin
  const count = await prisma.user.count();
  if (count <= 1) {
    console.log("Cannot delete the last admin user");
    process.exit(1);
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted admin user: ${normalizedEmail}`);
}

function showUsage() {
  console.log(`
Gold Geek Admin Management CLI

Usage:
  npm run admin:create <email>   Create a new admin user
  npm run admin:list             List all admin users
  npm run admin:delete <email>   Delete an admin user

Examples:
  npm run admin:create admin@goldgeek.com
  npm run admin:list
  npm run admin:delete test@example.com
`);
}

async function main() {
  switch (command) {
    case "create":
      await createAdmin(email);
      break;
    case "list":
      await listAdmins();
      break;
    case "delete":
      await deleteAdmin(email);
      break;
    default:
      showUsage();
  }
}

main()
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
