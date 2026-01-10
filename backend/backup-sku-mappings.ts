import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function backupSkuMappings() {
  console.log('📦 Backing up SKU mappings...');
  
  const skuMappings = await prisma.skuMapping.findMany();
  
  const backup = {
    timestamp: new Date().toISOString(),
    count: skuMappings.length,
    data: skuMappings
  };
  
  const filename = `sku-mappings-backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  
  console.log(`✅ Backed up ${skuMappings.length} SKU mappings to ${filename}`);
  console.log('\nSample data:');
  console.log(JSON.stringify(skuMappings.slice(0, 3), null, 2));
  
  await prisma.$disconnect();
}

backupSkuMappings().catch((error) => {
  console.error('Error backing up:', error);
  process.exit(1);
});
