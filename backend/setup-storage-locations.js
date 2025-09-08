#!/usr/bin/env node

// Check and create storage locations
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupStorageLocations() {
    try {
        console.log('🏪 Checking storage locations...');

        const locations = await prisma.storageLocation.findMany();
        console.log(`📍 Current storage locations: ${locations.length}`);

        locations.forEach(location => {
            console.log(`  - ${location.name} (${location.type || 'No type'})`);
        });

        if (locations.length === 0) {
            console.log('📦 Creating default storage locations...');

            const warehouse = await prisma.storageLocation.create({
                data: {
                    name: 'Main Warehouse',
                    type: 'WAREHOUSE',
                    description: 'Primary storage for finished products',
                    capacity: '1000 units'
                }
            });

            const fridgeStorage = await prisma.storageLocation.create({
                data: {
                    name: 'Refrigerated Storage',
                    type: 'COLD_STORAGE',
                    description: 'Temperature-controlled storage for perishables',
                    capacity: '500 units'
                }
            });

            console.log(`✅ Created storage locations:`);
            console.log(`  - ${warehouse.name}`);
            console.log(`  - ${fridgeStorage.name}`);
        }

    } catch (error) {
        console.error('❌ Error setting up storage locations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupStorageLocations();
