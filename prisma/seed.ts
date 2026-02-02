import 'dotenv/config';
import { PrismaClient, KitType, KitStatus, ItemType, MetalType, OfferStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

async function main() {
  console.log('Seeding database...');

  // Create admin user (User table is for admins only)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@goldgeek.com' },
    update: {},
    create: {
      email: 'admin@goldgeek.com',
    },
  });
  console.log('Admin user:', adminUser.email);

  // Create test customer (Customer table is independent, has email directly)
  let customer = await prisma.customer.findUnique({
    where: { email: 'test@example.com' },
    include: { addresses: true },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-0123',
        addresses: {
          create: [
            {
              type: 'shipping',
              street1: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              country: 'US',
              isDefault: true,
            },
          ],
        },
      },
      include: {
        addresses: true,
      },
    });
    console.log('Created test customer:', customer.email);
  } else {
    console.log('Test customer exists:', customer.email);
  }

  // Check if kit already exists
  let kit = await prisma.kit.findUnique({
    where: { kitNumber: 'GG-2026-TEST01' },
    include: { items: true },
  });

  if (!kit) {
    kit = await prisma.kit.create({
      data: {
        customerId: customer.id,
        kitNumber: 'GG-2026-TEST01',
        type: KitType.PHYSICAL,
        status: KitStatus.EVALUATING,
        shippingAddress: customer.addresses[0] || {
          street1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'US',
        },
        items: {
          create: [
            {
              type: ItemType.JEWELRY,
              description: '14K Gold Ring',
              metalType: MetalType.GOLD,
              weight: '5.2',
              purity: '14K',
              quantity: 1,
              condition: 'Good',
              estimatedValue: '450.00',
              finalValue: '475.00',
            },
            {
              type: ItemType.COINS,
              description: 'American Gold Eagle 1oz',
              metalType: MetalType.GOLD,
              weight: '31.1',
              purity: '999',
              quantity: 1,
              condition: 'Excellent',
              estimatedValue: '2100.00',
              finalValue: '2150.00',
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
    console.log('Created sample kit:', kit.kitNumber);
  } else {
    console.log('Sample kit exists:', kit.kitNumber);
  }

  // Check if offer already exists
  let offer = await prisma.offer.findUnique({
    where: { offerNumber: 'OFF-2026-TEST01' },
  });

  if (!offer) {
    offer = await prisma.offer.create({
      data: {
        kitId: kit.id,
        offerNumber: 'OFF-2026-TEST01',
        status: OfferStatus.SENT,
        totalValue: '2625.00',
        itemBreakdown: kit.items.map((item) => ({
          itemId: item.id,
          description: item.description,
          value: item.finalValue?.toString() || '0',
        })),
        notes: 'Test offer for sample kit',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentAt: new Date(),
      },
    });
    console.log('Created sample offer:', offer.offerNumber);
  } else {
    console.log('Sample offer exists:', offer.offerNumber);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
