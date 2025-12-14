import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreData() {
    try {
        console.log('🔄 Restoring bakery data...\n');

        // Get the first client
        const client = await prisma.client.findFirst();
        if (!client) {
            console.error('❌ No client found. Please register a user first.');
            process.exit(1);
        }

        console.log(`✅ Using client: ${client.name}`);

        // Create suppliers
        console.log('\n📦 Creating suppliers...');
        const supplier1 = await prisma.supplier.upsert({
            where: { id: 'temp-supplier-1' },
            create: {
                id: 'temp-supplier-1',
                name: 'Distribuidora Premium',
                contactInfo: {
                    name: 'Juan Pérez',
                    email: 'juan@premium.com',
                    phone: '+1-555-0101'
                },
                clientId: client.id
            },
            update: {}
        });

        // Create storage locations
        console.log('📍 Creating storage locations...');
        const storage1 = await prisma.storageLocation.upsert({
            where: { id: 'temp-storage-1' },
            create: {
                id: 'temp-storage-1',
                name: 'Almacén Principal',
                description: 'Bodega principal de materias primas',
                clientId: client.id
            },
            update: {}
        });

        // Create categories
        console.log('🏷️  Creating categories...');
        const category1 = await prisma.category.upsert({
            where: { id: 'temp-category-1' },
            create: {
                id: 'temp-category-1',
                name: 'Harinas',
                type: 'RAW_MATERIAL',
                description: 'Harinas y cereales',
                clientId: client.id
            },
            update: {}
        });

        const category2 = await prisma.category.upsert({
            where: { id: 'temp-category-2' },
            create: {
                id: 'temp-category-2',
                name: 'Productos Horneados',
                type: 'FINISHED_PRODUCT',
                description: 'Productos terminados',
                clientId: client.id
            },
            update: {}
        });

        // Create raw materials
        console.log('🥬 Creating raw materials...');

        await prisma.rawMaterial.create({
            data: {
                name: 'Harina de Trigo',
                sku: 'HARINA-001',
                description: 'Harina de trigo todo uso',
                categoryId: category1.id,
                supplierId: supplier1.id,
                batchNumber: 'BATCH-2025-001',
                expirationDate: new Date('2026-12-31'),
                quantity: 50.0,
                unit: 'kg',
                unitPrice: 2.50,
                reorderLevel: 10.0,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        await prisma.rawMaterial.create({
            data: {
                name: 'Azúcar',
                sku: 'AZUCAR-001',
                description: 'Azúcar refinada',
                categoryId: category1.id,
                supplierId: supplier1.id,
                batchNumber: 'BATCH-2025-002',
                expirationDate: new Date('2027-06-30'),
                quantity: 25.0,
                unit: 'kg',
                unitPrice: 1.80,
                reorderLevel: 5.0,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        await prisma.rawMaterial.create({
            data: {
                name: 'Levadura',
                sku: 'LEVADURA-001',
                description: 'Levadura fresca',
                categoryId: category1.id,
                supplierId: supplier1.id,
                batchNumber: 'BATCH-2025-003',
                expirationDate: new Date('2025-12-31'),
                quantity: 5.0,
                unit: 'kg',
                unitPrice: 8.50,
                reorderLevel: 2.0,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        await prisma.rawMaterial.create({
            data: {
                name: 'Mantequilla',
                sku: 'MANTEQUILLA-001',
                description: 'Mantequilla sin sal',
                categoryId: category1.id,
                supplierId: supplier1.id,
                batchNumber: 'BATCH-2025-004',
                expirationDate: new Date('2026-03-31'),
                quantity: 15.0,
                unit: 'kg',
                unitPrice: 5.20,
                reorderLevel: 5.0,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        await prisma.rawMaterial.create({
            data: {
                name: 'Huevos',
                sku: 'HUEVOS-001',
                description: 'Huevos frescos',
                categoryId: category1.id,
                supplierId: supplier1.id,
                batchNumber: 'BATCH-2025-005',
                expirationDate: new Date('2026-01-15'),
                quantity: 200.0,
                unit: 'unidades',
                unitPrice: 0.30,
                reorderLevel: 50.0,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        // Create finished products
        console.log('🍞 Creating finished products...');

        await prisma.finishedProduct.create({
            data: {
                name: 'Pan Integral',
                sku: 'PAN-001',
                description: 'Pan integral de 500g',
                categoryId: category2.id,
                batchNumber: 'PROD-2025-001',
                productionDate: new Date('2025-12-01'),
                expirationDate: new Date('2025-12-15'),
                shelfLife: 14,
                quantity: 30.0,
                unit: 'unidades',
                salePrice: 3.50,
                costToProduce: 1.80,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        await prisma.finishedProduct.create({
            data: {
                name: 'Croissant',
                sku: 'CROISSANT-001',
                description: 'Croissant de mantequilla',
                categoryId: category2.id,
                batchNumber: 'PROD-2025-002',
                productionDate: new Date('2025-12-10'),
                expirationDate: new Date('2025-12-17'),
                shelfLife: 7,
                quantity: 50.0,
                unit: 'unidades',
                salePrice: 2.50,
                costToProduce: 1.20,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        await prisma.finishedProduct.create({
            data: {
                name: 'Galletas de Chocolate',
                sku: 'GALLETAS-001',
                description: 'Galletas con chips de chocolate',
                categoryId: category2.id,
                batchNumber: 'PROD-2025-003',
                productionDate: new Date('2025-12-05'),
                expirationDate: new Date('2026-01-05'),
                shelfLife: 30,
                quantity: 100.0,
                unit: 'unidades',
                salePrice: 1.50,
                costToProduce: 0.75,
                storageLocationId: storage1.id,
                clientId: client.id
            }
        });

        // Check results
        const rmCount = await prisma.rawMaterial.count();
        const fpCount = await prisma.finishedProduct.count();

        console.log('\n✅ Data restored successfully!');
        console.log(`   Raw Materials: ${rmCount}`);
        console.log(`   Finished Products: ${fpCount}`);
        console.log('\n🎉 Your inventory is back!\n');

    } catch (error) {
        console.error('❌ Error restoring data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restoreData();
