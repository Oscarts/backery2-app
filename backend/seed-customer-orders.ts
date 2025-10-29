import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCustomerOrders() {
  console.log('🌱 Seeding customer orders data...');

  // Helper function to get product cost (use costToProduce or fallback to salePrice)
  const getProductCost = (product: any): number => {
    return product.costToProduce || product.salePrice || 10;
  };

  try {
    // Get some existing finished products for order items
    const finishedProducts = await prisma.finishedProduct.findMany({
      take: 5,
      where: {
        isContaminated: false,
        status: 'COMPLETED',
      },
    });

    if (finishedProducts.length === 0) {
      console.log('⚠️  No finished products found. Please seed finished products first.');
      return;
    }

    // Create customers
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
          address: '789 Broadway, Los Angeles, CA 90001',
          isActive: true,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'The Morning Glory Bakery',
          email: 'contact@morningglory.com',
          phone: '+1 (555) 456-7890',
          address: '321 Oak Avenue, Chicago, IL 60601',
          isActive: true,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'Artisan Bread Co.',
          email: 'wholesale@artisanbread.com',
          phone: '+1 (555) 567-8901',
          address: '654 Pine Street, Seattle, WA 98101',
          isActive: false, // Inactive customer
        },
      }),
    ]);

    console.log(`✅ Created ${customers.length} customers`);

    // Helper function to generate order number
    const generateOrderNumber = (index: number) => {
      const date = new Date();
      const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      return `ORD-${yearMonth}-${String(index).padStart(4, '0')}`;
    };

    // Helper to calculate dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    // Create Order 1: FULFILLED order (past delivery)
    const cost0 = getProductCost(finishedProducts[0]);
    const cost1 = getProductCost(finishedProducts[1]);
    
    const order1Items = [
      {
        productId: finishedProducts[0].id,
        productName: finishedProducts[0].name,
        productSku: finishedProducts[0].sku,
        quantity: 50,
        unitProductionCost: cost0,
        unitPrice: cost0 * 1.5,
        lineProductionCost: cost0 * 50,
        linePrice: cost0 * 1.5 * 50,
      },
      {
        productId: finishedProducts[1].id,
        productName: finishedProducts[1].name,
        productSku: finishedProducts[1].sku,
        quantity: 30,
        unitProductionCost: cost1,
        unitPrice: cost1 * 1.5,
        lineProductionCost: cost1 * 30,
        linePrice: cost1 * 1.5 * 30,
      },
    ];

    const order1TotalCost = order1Items.reduce((sum, item) => sum + item.lineProductionCost, 0);
    const order1TotalPrice = order1Items.reduce((sum, item) => sum + item.linePrice, 0);

    await prisma.customerOrder.create({
      data: {
        orderNumber: generateOrderNumber(1),
        customerId: customers[0].id,
        expectedDeliveryDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        status: OrderStatus.FULFILLED,
        totalProductionCost: order1TotalCost,
        totalPrice: order1TotalPrice,
        priceMarkupPercentage: 50,
        notes: 'Regular weekly order - delivered on time',
        items: {
          create: order1Items,
        },
      },
    });

    // Create Order 2: CONFIRMED order (delivery tomorrow)
    const order2Items = [
      {
        productId: finishedProducts[2].id,
        productName: finishedProducts[2].name,
        productSku: finishedProducts[2].sku,
        quantity: 20,
        unitProductionCost: finishedProducts[2].costToProduce,
        unitPrice: finishedProducts[2].costToProduce * 1.4,
        lineProductionCost: finishedProducts[2].costToProduce * 20,
        linePrice: finishedProducts[2].costToProduce * 1.4 * 20,
      },
    ];

    const order2TotalCost = order2Items.reduce((sum, item) => sum + item.lineProductionCost, 0);
    const order2TotalPrice = order2Items.reduce((sum, item) => sum + item.linePrice, 0);

    await prisma.customerOrder.create({
      data: {
        orderNumber: generateOrderNumber(2),
        customerId: customers[1].id,
        expectedDeliveryDate: tomorrow,
        status: OrderStatus.CONFIRMED,
        totalProductionCost: order2TotalCost,
        totalPrice: order2TotalPrice,
        priceMarkupPercentage: 40,
        notes: 'Special event order - please prioritize',
        items: {
          create: order2Items,
        },
      },
    });

    // Create Order 3: DRAFT order
    const order3Items = [
      {
        productId: finishedProducts[0].id,
        productName: finishedProducts[0].name,
        productSku: finishedProducts[0].sku,
        quantity: 100,
        unitProductionCost: finishedProducts[0].costToProduce,
        unitPrice: finishedProducts[0].costToProduce * 1.6,
        lineProductionCost: finishedProducts[0].costToProduce * 100,
        linePrice: finishedProducts[0].costToProduce * 1.6 * 100,
      },
      {
        productId: finishedProducts[3].id,
        productName: finishedProducts[3].name,
        productSku: finishedProducts[3].sku,
        quantity: 75,
        unitProductionCost: finishedProducts[3].costToProduce,
        unitPrice: finishedProducts[3].costToProduce * 1.6,
        lineProductionCost: finishedProducts[3].costToProduce * 75,
        linePrice: finishedProducts[3].costToProduce * 1.6 * 75,
      },
    ];

    const order3TotalCost = order3Items.reduce((sum, item) => sum + item.lineProductionCost, 0);
    const order3TotalPrice = order3Items.reduce((sum, item) => sum + item.linePrice, 0);

    await prisma.customerOrder.create({
      data: {
        orderNumber: generateOrderNumber(3),
        customerId: customers[2].id,
        expectedDeliveryDate: nextWeek,
        status: OrderStatus.DRAFT,
        totalProductionCost: order3TotalCost,
        totalPrice: order3TotalPrice,
        priceMarkupPercentage: 60,
        notes: 'Large order - confirm quantities before finalizing',
        items: {
          create: order3Items,
        },
      },
    });

    // Create Order 4: CONFIRMED order with high quantity (tests inventory limits)
    const order4Items = [
      {
        productId: finishedProducts[1].id,
        productName: finishedProducts[1].name,
        productSku: finishedProducts[1].sku,
        quantity: 200, // High quantity to test inventory
        unitProductionCost: finishedProducts[1].costToProduce,
        unitPrice: finishedProducts[1].costToProduce * 1.45,
        lineProductionCost: finishedProducts[1].costToProduce * 200,
        linePrice: finishedProducts[1].costToProduce * 1.45 * 200,
      },
    ];

    const order4TotalCost = order4Items.reduce((sum, item) => sum + item.lineProductionCost, 0);
    const order4TotalPrice = order4Items.reduce((sum, item) => sum + item.linePrice, 0);

    await prisma.customerOrder.create({
      data: {
        orderNumber: generateOrderNumber(4),
        customerId: customers[3].id,
        expectedDeliveryDate: twoWeeks,
        status: OrderStatus.CONFIRMED,
        totalProductionCost: order4TotalCost,
        totalPrice: order4TotalPrice,
        priceMarkupPercentage: 45,
        notes: 'Bulk order for grand opening event',
        items: {
          create: order4Items,
        },
      },
    });

    // Create Order 5: DRAFT with multiple items
    const order5Items = finishedProducts.slice(0, 4).map((product, index) => ({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: (index + 1) * 10,
      unitProductionCost: product.costToProduce,
      unitPrice: product.costToProduce * 1.55,
      lineProductionCost: product.costToProduce * (index + 1) * 10,
      linePrice: product.costToProduce * 1.55 * (index + 1) * 10,
    }));

    const order5TotalCost = order5Items.reduce((sum, item) => sum + item.lineProductionCost, 0);
    const order5TotalPrice = order5Items.reduce((sum, item) => sum + item.linePrice, 0);

    await prisma.customerOrder.create({
      data: {
        orderNumber: generateOrderNumber(5),
        customerId: customers[0].id,
        expectedDeliveryDate: twoWeeks,
        status: OrderStatus.DRAFT,
        totalProductionCost: order5TotalCost,
        totalPrice: order5TotalPrice,
        priceMarkupPercentage: 55,
        notes: 'Monthly variety order - pending final approval',
        items: {
          create: order5Items,
        },
      },
    });

    console.log('✅ Created 5 customer orders with various statuses');
    console.log('   - 1 FULFILLED order');
    console.log('   - 2 CONFIRMED orders');
    console.log('   - 2 DRAFT orders');

    // Display summary
    const orderStats = await prisma.customerOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    console.log('\n📊 Order Statistics:');
    orderStats.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat._count} orders`);
    });

    const totalRevenue = await prisma.customerOrder.aggregate({
      where: { status: OrderStatus.FULFILLED },
      _sum: { totalPrice: true },
    });

    console.log(`\n💰 Total fulfilled orders revenue: $${totalRevenue._sum.totalPrice?.toFixed(2) || '0.00'}`);

    console.log('\n✨ Customer orders seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding customer orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedCustomerOrders()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedCustomerOrders };
