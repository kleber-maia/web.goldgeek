import { PrismaClient, UserRole, KitType, KitStatus, ItemType, MetalType, OfferStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@goldgeek.com',
      role: UserRole.ADMIN,
    },
  });
  console.log('✓ Created admin user:', adminUser.email);

  // Create test customer user
  const customerUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      role: UserRole.CUSTOMER,
      customer: {
        create: {
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
      },
    },
    include: {
      customer: {
        include: {
          addresses: true,
        },
      },
    },
  });
  console.log('✓ Created test customer:', customerUser.email);

  // Create sample kit with items
  if (customerUser.customer) {
    const kit = await prisma.kit.create({
      data: {
        customerId: customerUser.customer.id,
        kitNumber: 'GG-2026-TEST01',
        type: KitType.PHYSICAL,
        status: KitStatus.EVALUATING,
        shippingAddress: customerUser.customer.addresses[0],
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
    console.log('✓ Created sample kit:', kit.kitNumber);

    // Create offer for the kit
    const offer = await prisma.offer.create({
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        sentAt: new Date(),
      },
    });
    console.log('✓ Created sample offer:', offer.offerNumber);
  }

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
