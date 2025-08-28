import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQualityStatuses() {
  console.log('🌱 Seeding quality statuses...');

  // Create default quality statuses
  const qualityStatuses = [
    {
      name: 'Good',
      description: 'Product meets all quality standards',
      color: '#4caf50', // Green
      sortOrder: 1,
    },
    {
      name: 'Damaged',
      description: 'Product has minor damage but may still be usable',
      color: '#ff9800', // Orange
      sortOrder: 2,
    },
    {
      name: 'Defective',
      description: 'Product has defects that affect quality',
      color: '#f44336', // Red
      sortOrder: 3,
    },
    {
      name: 'Rejected',
      description: 'Product rejected and should not be used',
      color: '#9c27b0', // Purple
      sortOrder: 4,
    },
    {
      name: 'Pending Review',
      description: 'Product pending quality inspection',
      color: '#2196f3', // Blue
      sortOrder: 0,
    },
  ];

  for (const status of qualityStatuses) {
    await prisma.qualityStatus.upsert({
      where: { name: status.name },
      update: status,
      create: status,
    });
    console.log(`✅ Created/updated quality status: ${status.name}`);
  }

  console.log('🎉 Quality statuses seeded successfully!');
}

seedQualityStatuses()
  .catch((e) => {
    console.error('❌ Error seeding quality statuses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
