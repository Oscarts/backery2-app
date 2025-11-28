/**
 * Migration script to add standard units to the database
 * Run this to populate the database with comprehensive WEIGHT, VOLUME, and COUNT units
 * 
 * Usage: npx tsx backend/migrate-standard-units.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const standardUnits = [
    // ========================================
    // WEIGHT UNITS (6)
    // ========================================
    { name: 'Kilogram', symbol: 'kg', category: 'WEIGHT', description: 'Standard metric unit of mass (1000g)', isActive: true },
    { name: 'Gram', symbol: 'g', category: 'WEIGHT', description: 'Metric unit of mass', isActive: true },
    { name: 'Milligram', symbol: 'mg', category: 'WEIGHT', description: 'Very small metric unit of mass', isActive: true },
    { name: 'Pound', symbol: 'lb', category: 'WEIGHT', description: 'Imperial unit of mass (~454g)', isActive: true },
    { name: 'Ounce', symbol: 'oz', category: 'WEIGHT', description: 'Imperial unit of mass (~28g)', isActive: true },
    { name: 'Ton', symbol: 't', category: 'WEIGHT', description: 'Metric ton (1000kg)', isActive: true },

    // ========================================
    // VOLUME UNITS (11)
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

async function migrateStandardUnits() {
    console.log('🔄 Starting Standard Units Migration...\n');

    try {
        // Get current units
        const existingUnits = await prisma.unit.findMany({
            select: { id: true, name: true, symbol: true, category: true }
        });

        console.log(`📊 Current state: ${existingUnits.length} units in database\n`);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const unit of standardUnits) {
            // Check if unit exists by symbol (unique identifier)
            const existing = existingUnits.find(u => u.symbol === unit.symbol);

            if (existing) {
                // Update if category needs to be uppercase
                if (existing.category !== unit.category) {
                    await prisma.unit.update({
                        where: { id: existing.id },
                        data: {
                            category: unit.category,
                            description: unit.description,
                            isActive: unit.isActive
                        }
                    });
                    console.log(`   ✏️  Updated: ${unit.name} (${unit.symbol}) - category: ${existing.category} → ${unit.category}`);
                    updated++;
                } else {
                    console.log(`   ⏭️  Skipped: ${unit.name} (${unit.symbol}) - already exists`);
                    skipped++;
                }
            } else {
                // Create new unit
                await prisma.unit.create({ data: unit });
                console.log(`   ✅ Created: ${unit.name} (${unit.symbol}) - ${unit.category}`);
                created++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📈 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Created:  ${created} new units`);
        console.log(`✏️  Updated:  ${updated} units`);
        console.log(`⏭️  Skipped:  ${skipped} units (already up-to-date)`);
        console.log(`📊 Total:    ${created + updated + skipped} units processed`);
        console.log('='.repeat(60));

        // Display units by category
        const allUnits = await prisma.unit.findMany({
            where: { isActive: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
        });

        const unitsByCategory = allUnits.reduce((acc, unit) => {
            if (!acc[unit.category]) acc[unit.category] = [];
            acc[unit.category].push(unit);
            return acc;
        }, {} as Record<string, typeof allUnits>);

        console.log('\n📋 UNITS BY CATEGORY:\n');
        Object.entries(unitsByCategory).forEach(([category, units]) => {
            console.log(`${category} (${units.length} units):`);
            units.forEach(unit => {
                console.log(`   • ${unit.name} (${unit.symbol}) - ${unit.description}`);
            });
            console.log('');
        });

        console.log('✅ Migration completed successfully!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateStandardUnits()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
