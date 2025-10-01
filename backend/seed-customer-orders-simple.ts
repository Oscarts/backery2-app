import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to safely get product cost
const getCost = (product: any): number => {
  return product.costToProduce || product.salePrice || 10;
};

// Helper to generate order number
const genOrderNum = (num: number): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `ORD-${year}${month}-${String(num).padStart(4, '0')}`;
};

async function main() {
  console.log('🌱 Seeding customer orders...\n');

  // Get some finished products
  const products = await prisma.finishedProduct.findMany({
    take: 5,
    where: {
      isContaminated: false,
      status: 'COMPLETED',
    },
  });

  if (products.length === 0) {
    console.log('❌ No finished products found. Run production seed first.');
    return;
  }

  console.log(`✅ Found ${products.length} products\n`);

  // Create 5 customers
  console.log('Creating customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'La Petite Boulangerie',
        email: 'orders@petiteboulangerie.com',
        phone: '+1 (555) 123-4567',
        address: '123 Rue de la Paix, Paris, France',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sweet Treats Café',
        email: 'manager@sweettreatscafe.com',
        phone: '+1 (555) 234-5678',
        address: '456 Main Street, New York, NY 10001',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Downtown Coffee House',
        email: 'orders@downtowncoffee.com',
        phone: '+1 (555) 345-6789',
        address: '789 5th Avenue, San Francisco, CA 94102',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'The Corner Bakery',
        email: 'sales@cornerbakery.com',
        phone: '+1 (555) 456-7890',
        address: '321 Oak Street, Chicago, IL 60601',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Gourmet Market & Deli',
        email: 'purchasing@gourmetmarket.com',
        phone: '+1 (555) 567-8901',
        address: '654 Elm Street, Boston, MA 02108',
        isActive: false,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers\n`);

  // Date helpers
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  // Order 1: FULFILLED (past delivery)
  console.log('Creating Order 1 (FULFILLED)...');
  const cost0 = getCost(products[0]);
  const cost1 = getCost(products[1]);

  await prisma.customerOrder.create({
    data: {
      orderNumber: genOrderNum(1),
      customerId: customers[0].id,
      expectedDeliveryDate: yesterday,
      status: OrderStatus.FULFILLED,
      totalProductionCost: cost0 * 50 + cost1 * 30,
      totalPrice: cost0 * 1.5 * 50 + cost1 * 1.5 * 30,
      priceMarkupPercentage: 50,
      notes: 'Completed delivery for weekend event',
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            productSku: products[0].sku,
            quantity: 50,
            unitProductionCost: cost0,
            unitPrice: cost0 * 1.5,
            lineProductionCost: cost0 * 50,
            linePrice: cost0 * 1.5 * 50,
          },
          {
            productId: products[1].id,
            productName: products[1].name,
            productSku: products[1].sku,
            quantity: 30,
            unitProductionCost: cost1,
            unitPrice: cost1 * 1.5,
            lineProductionCost: cost1 * 30,
            linePrice: cost1 * 1.5 * 30,
          },
        ],
      },
    },
  });

  // Order 2: CONFIRMED (delivery tomorrow)
  console.log('Creating Order 2 (CONFIRMED)...');
  const cost2 = getCost(products[2] || products[0]);

  await prisma.customerOrder.create({
    data: {
      orderNumber: genOrderNum(2),
      customerId: customers[1].id,
      expectedDeliveryDate: tomorrow,
      status: OrderStatus.CONFIRMED,
      totalProductionCost: cost2 * 20,
      totalPrice: cost2 * 1.4 * 20,
      priceMarkupPercentage: 40,
      notes: 'Special event order - please prioritize',
      items: {
        create: [
          {
            productId: (products[2] || products[0]).id,
            productName: (products[2] || products[0]).name,
            productSku: (products[2] || products[0]).sku,
            quantity: 20,
            unitProductionCost: cost2,
            unitPrice: cost2 * 1.4,
            lineProductionCost: cost2 * 20,
            linePrice: cost2 * 1.4 * 20,
          },
        ],
      },
    },
  });

  // Order 3: DRAFT (future delivery)
  console.log('Creating Order 3 (DRAFT)...');
  const cost3 = getCost(products[3] || products[0]);

  await prisma.customerOrder.create({
    data: {
      orderNumber: genOrderNum(3),
      customerId: customers[2].id,
      expectedDeliveryDate: twoWeeks,
      status: OrderStatus.DRAFT,
      totalProductionCost: cost0 * 100 + cost3 * 75,
      totalPrice: cost0 * 1.6 * 100 + cost3 * 1.6 * 75,
      priceMarkupPercentage: 60,
      notes: 'Large catering order - awaiting final confirmation',
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            productSku: products[0].sku,
            quantity: 100,
            unitProductionCost: cost0,
            unitPrice: cost0 * 1.6,
            lineProductionCost: cost0 * 100,
            linePrice: cost0 * 1.6 * 100,
          },
          {
            productId: (products[3] || products[0]).id,
            productName: (products[3] || products[0]).name,
            productSku: (products[3] || products[0]).sku,
            quantity: 75,
            unitProductionCost: cost3,
            unitPrice: cost3 * 1.6,
            lineProductionCost: cost3 * 75,
            linePrice: cost3 * 1.6 * 75,
          },
        ],
      },
    },
  });

  // Order 4: DRAFT (bulk order, may have insufficient inventory)
  console.log('Creating Order 4 (DRAFT - Large)...');
  await prisma.customerOrder.create({
    data: {
      orderNumber: genOrderNum(4),
      customerId: customers[3].id,
      expectedDeliveryDate: twoWeeks,
      status: OrderStatus.DRAFT,
      totalProductionCost: cost1 * 200,
      totalPrice: cost1 * 1.45 * 200,
      priceMarkupPercentage: 45,
      notes: 'Bulk order for chain of stores',
      items: {
        create: [
          {
            productId: products[1].id,
            productName: products[1].name,
            productSku: products[1].sku,
            quantity: 200,
            unitProductionCost: cost1,
            unitPrice: cost1 * 1.45,
            lineProductionCost: cost1 * 200,
            linePrice: cost1 * 1.45 * 200,
          },
        ],
      },
    },
  });

  // Order 5: DRAFT (multi-product)
  console.log('Creating Order 5 (DRAFT - Multi-product)...');
  const totalCost5 = products.slice(0, 4).reduce((sum, p, i) => {
    const c = getCost(p);
    return sum + (c * (i + 1) * 10);
  }, 0);

  const totalPrice5 = products.slice(0, 4).reduce((sum, p, i) => {
    const c = getCost(p);
    return sum + (c * 1.55 * (i + 1) * 10);
  }, 0);

  await prisma.customerOrder.create({
    data: {
      orderNumber: genOrderNum(5),
      customerId: customers[0].id,
      expectedDeliveryDate: twoWeeks,
      status: OrderStatus.DRAFT,
      totalProductionCost: totalCost5,
      totalPrice: totalPrice5,
      priceMarkupPercentage: 55,
      notes: 'Variety sampler order',
      items: {
        create: products.slice(0, 4).map((p, i) => {
          const c = getCost(p);
          const qty = (i + 1) * 10;
          return {
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: qty,
            unitProductionCost: c,
            unitPrice: c * 1.55,
            lineProductionCost: c * qty,
            linePrice: c * 1.55 * qty,
          };
        }),
      },
    },
  });

  console.log('\n✅ Successfully seeded customer orders!');
  console.log('📊 Summary:');
  console.log(`   - 5 Customers created`);
  console.log(`   - 5 Orders created:`);
  console.log(`     • 1 FULFILLED`);
  console.log(`     • 1 CONFIRMED`);
  console.log(`     • 3 DRAFT\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
