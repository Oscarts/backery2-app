/**
 * Utility to seed default data for newly created clients
 * This includes categories, suppliers, storage locations, and quality statuses
 */

import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedDefaultDataResult {
    categories: number;
    suppliers: number;
    storageLocations: number;
    qualityStatuses: number;
}

/**
 * Seeds default data for a new client
 * @param clientId - The ID of the newly created client
 * @returns Object with counts of created entities
 */
export async function seedDefaultClientData(clientId: string): Promise<SeedDefaultDataResult> {
    console.log(`\n🌱 Seeding default data for client ${clientId}...`);

    const result: SeedDefaultDataResult = {
        categories: 0,
        suppliers: 0,
        storageLocations: 0,
        qualityStatuses: 0,
    };

    try {
        // Check if data already exists to prevent duplicates
        const existingCategories = await prisma.category.count({ where: { clientId } });
        if (existingCategories > 0) {
            console.log(`   ⚠️  Client ${clientId} already has ${existingCategories} categories, skipping default data seeding`);
            return {
                categories: 0,
                suppliers: 0,
                storageLocations: 0,
                qualityStatuses: 0,
            };
        }

        // Create default categories - simplified
        const defaultCategories: Array<{ name: string; type: CategoryType; description: string }> = [
            { name: 'Ingredient', type: CategoryType.RAW_MATERIAL, description: 'Raw materials and ingredients' },
            { name: 'Final Product', type: CategoryType.FINISHED_PRODUCT, description: 'Finished products ready for sale' },
            { name: 'Intermediate Product', type: CategoryType.FINISHED_PRODUCT, description: 'Semi-finished products used in other recipes' },
            { name: 'Recipe', type: CategoryType.RECIPE, description: 'Production recipes' },
        ];

        for (const category of defaultCategories) {
            await prisma.category.create({
                data: {
                    ...category,
                    clientId,
                },
            });
            result.categories++;
        }
        console.log(`   ✅ Created ${result.categories} default categories`);

        // Create default supplier - just one
        const defaultSupplier = {
            name: 'General Supplier',
            contactInfo: { email: '', phone: '' },
            address: '',
            isActive: true,
        };

        await prisma.supplier.create({
            data: {
                ...defaultSupplier,
                clientId,
            },
        });
        result.suppliers++;
        console.log(`   ✅ Created ${result.suppliers} default supplier`);

        // Create default storage locations
        const defaultStorageLocations = [
            {
                name: 'Main Storage',
                type: 'Warehouse',
                description: 'Primary storage area for ingredients and materials',
                capacity: 'To be determined',
            },
            {
                name: 'Cold Storage',
                type: 'Refrigerator',
                description: 'Refrigerated storage for perishable items',
                capacity: 'To be determined',
            },
            {
                name: 'Freezer',
                type: 'Freezer',
                description: 'Frozen storage for long-term preservation',
                capacity: 'To be determined',
            },
            {
                name: 'Dry Storage',
                type: 'Pantry',
                description: 'Dry goods storage area',
                capacity: 'To be determined',
            },
            {
                name: 'Production Area',
                type: 'Workshop',
                description: 'Active production and work area',
                capacity: 'To be determined',
            },
        ];

        for (const location of defaultStorageLocations) {
            await prisma.storageLocation.create({
                data: {
                    ...location,
                    clientId,
                },
            });
            result.storageLocations++;
        }
        console.log(`   ✅ Created ${result.storageLocations} default storage locations`);

        // Create default quality statuses
        const defaultQualityStatuses = [
            {
                name: 'Excellent',
                description: 'Perfect condition, highest quality',
                color: '#4CAF50', // Green
                sortOrder: 1,
                isActive: true,
            },
            {
                name: 'Good',
                description: 'Good condition, suitable for use',
                color: '#8BC34A', // Light Green
                sortOrder: 2,
                isActive: true,
            },
            {
                name: 'Fair',
                description: 'Acceptable condition, use soon',
                color: '#FFEB3B', // Yellow
                sortOrder: 3,
                isActive: true,
            },
            {
                name: 'Poor',
                description: 'Below standard, check before use',
                color: '#FF9800', // Orange
                sortOrder: 4,
                isActive: true,
            },
            {
                name: 'Damaged',
                description: 'Damaged or compromised quality',
                color: '#F44336', // Red
                sortOrder: 5,
                isActive: true,
            },
            {
                name: 'Expired',
                description: 'Past expiration date, do not use',
                color: '#9E9E9E', // Grey
                sortOrder: 6,
                isActive: true,
            },
        ];

        for (const status of defaultQualityStatuses) {
            await prisma.qualityStatus.create({
                data: {
                    ...status,
                    clientId,
                },
            });
            result.qualityStatuses++;
        }
        console.log(`   ✅ Created ${result.qualityStatuses} default quality statuses`);

        console.log(`\n✅ Default data seeding completed for client ${clientId}`);
        console.log(`   📊 Summary: ${result.categories} categories, ${result.suppliers} suppliers, ${result.storageLocations} storage locations, ${result.qualityStatuses} quality statuses\n`);

        return result;
    } catch (error) {
        console.error('❌ Error seeding default data:', error);
        throw error;
    }
}

/**
 * Get the list of common units (global, not client-specific)
 * These should already exist in the database from the main seed
 */
export async function ensureCommonUnits(): Promise<void> {
    console.log('🔍 Checking for common units...');

    const existingUnits = await prisma.unit.findMany();

    if (existingUnits.length > 0) {
        console.log(`✅ Found ${existingUnits.length} existing units`);
        return;
    }

    console.log('⚠️  No units found, creating standard units...');

    const standardUnits = [
        // ========================================
        // WEIGHT UNITS (10)
        // ========================================
        { name: 'Kilogram', symbol: 'kg', category: 'WEIGHT', description: 'Standard metric unit of mass (1000g)', isActive: true },
        { name: 'Gram', symbol: 'g', category: 'WEIGHT', description: 'Metric unit of mass', isActive: true },
        { name: 'Milligram', symbol: 'mg', category: 'WEIGHT', description: 'Very small metric unit of mass', isActive: true },
        { name: 'Pound', symbol: 'lb', category: 'WEIGHT', description: 'Imperial unit of mass (~454g)', isActive: true },
        { name: 'Ounce', symbol: 'oz', category: 'WEIGHT', description: 'Imperial unit of mass (~28g)', isActive: true },
        { name: 'Ton', symbol: 't', category: 'WEIGHT', description: 'Metric ton (1000kg)', isActive: true },

        // ========================================
        // VOLUME UNITS (13)
        // ========================================
        { name: 'Liter', symbol: 'L', category: 'VOLUME', description: 'Standard metric unit of volume', isActive: true },
        { name: 'Milliliter', symbol: 'mL', category: 'VOLUME', description: 'Metric unit of volume (1/1000 L)', isActive: true },
        { name: 'Cup', symbol: 'cup', category: 'VOLUME', description: 'US customary cooking measurement (~237mL)', isActive: true },
        { name: 'Tablespoon', symbol: 'tbsp', category: 'VOLUME', description: 'Cooking measurement (~15mL)', isActive: true },
        { name: 'Teaspoon', symbol: 'tsp', category: 'VOLUME', description: 'Cooking measurement (~5mL)', isActive: true },
        { name: 'Fluid Ounce', symbol: 'fl oz', category: 'VOLUME', description: 'US customary unit of volume (~30mL)', isActive: true },
        { name: 'Gallon', symbol: 'gal', category: 'VOLUME', description: 'US customary unit of volume (~3.78L)', isActive: true },
        { name: 'Quart', symbol: 'qt', category: 'VOLUME', description: 'US customary unit of volume (~946mL)', isActive: true },
        { name: 'Pint', symbol: 'pt', category: 'VOLUME', description: 'US customary unit of volume (~473mL)', isActive: true },
        { name: 'Cubic Meter', symbol: 'm³', category: 'VOLUME', description: 'Large volume unit (1000L)', isActive: true },
        { name: 'Cubic Centimeter', symbol: 'cm³', category: 'VOLUME', description: 'Small volume unit (1mL)', isActive: true },

        // ========================================
        // COUNT UNITS (6)
        // ========================================
        { name: 'Piece', symbol: 'pc', category: 'COUNT', description: 'Individual items', isActive: true },
        { name: 'Each', symbol: 'ea', category: 'COUNT', description: 'Individual items (alternative)', isActive: true },
        { name: 'Dozen', symbol: 'dz', category: 'COUNT', description: '12 pieces', isActive: true },
        { name: 'Pack', symbol: 'pk', category: 'COUNT', description: 'Package of items', isActive: true },
        { name: 'Box', symbol: 'bx', category: 'COUNT', description: 'Box of items', isActive: true },
        { name: 'Case', symbol: 'cs', category: 'COUNT', description: 'Case of items', isActive: true },
    ];

    console.log(`   Creating ${standardUnits.length} standard units...`);

    for (const unit of standardUnits) {
        await prisma.unit.create({ data: unit });
    }

    console.log(`✅ Created ${standardUnits.length} standard units`);
    console.log(`   - Weight: 6 units`);
    console.log(`   - Volume: 11 units`);
    console.log(`   - Count: 6 units`);
}
