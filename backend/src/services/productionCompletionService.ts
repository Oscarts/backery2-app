// Production Completion Service
// Handles creating finished products when production runs are completed

import { PrismaClient } from '@prisma/client';
import { InventoryAllocationService } from './inventoryAllocationService';

const prisma = new PrismaClient();
const inventoryAllocationService = new InventoryAllocationService();

export class ProductionCompletionService {

    // Complete production run and create finished products
    async completeProductionRun(productionRunId: string, actualQuantity?: number) {
        try {
            console.log(`🏁 Completing production run: ${productionRunId}`);
            
            // Debug logging
            const fs = require('fs');
            fs.appendFileSync('/tmp/production-debug.log', 
                `${new Date().toISOString()} SERVICE: Starting completeProductionRun for ${productionRunId}\n`
            );

            // Get production run details
            const productionRun = await prisma.productionRun.findUnique({
                where: { id: productionRunId },
                include: {
                    recipe: true,
                    steps: true
                }
            });

            if (!productionRun) {
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} SERVICE ERROR: Production run not found\n`
                );
                throw new Error('Production run not found');
            }

            if (productionRun.status === 'COMPLETED') {
                console.log('Production run already completed');
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} SERVICE: Already completed, returning existing run\n`
                );
                return productionRun;
            }

            // Verify all steps are completed
            const pendingSteps = productionRun.steps.filter(step =>
                step.status !== 'COMPLETED' && step.status !== 'SKIPPED'
            );
            
            fs.appendFileSync('/tmp/production-debug.log', 
                `${new Date().toISOString()} SERVICE: Found ${pendingSteps.length} pending steps\n`
            );

            if (pendingSteps.length > 0) {
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} SERVICE ERROR: Cannot complete - pending steps\n`
                );
                throw new Error(`Cannot complete production: ${pendingSteps.length} steps still pending`);
            }

            // Use actual quantity if provided, otherwise use target quantity
            const finalQuantity = actualQuantity || productionRun.targetQuantity;
            
            fs.appendFileSync('/tmp/production-debug.log', 
                `${new Date().toISOString()} SERVICE: Creating finished product with quantity ${finalQuantity}\n`
            );

            // Create finished product in inventory
            const finishedProduct = await this.createFinishedProduct(productionRun, finalQuantity);
            
            fs.appendFileSync('/tmp/production-debug.log', 
                `${new Date().toISOString()} SERVICE: Finished product created: ${finishedProduct?.id}\n`
            );

            // Update production run status
            const completedRun = await prisma.productionRun.update({
                where: { id: productionRunId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    finalQuantity
                },
                include: {
                    recipe: true,
                    steps: true
                }
            });

            console.log(`✅ Production completed: ${finishedProduct.quantity} ${finishedProduct.unit} of ${finishedProduct.name}`);
            
            const result = {
                productionRun: completedRun,
                finishedProduct
            };
            
            fs.appendFileSync('/tmp/production-debug.log', 
                `${new Date().toISOString()} SERVICE: Returning result with finishedProduct: ${!!result.finishedProduct}\n`
            );

            return result;

        } catch (error) {
            console.error('❌ Error completing production run:', error);
            throw error;
        }
    }

    // Create finished product from production run
    private async createFinishedProduct(productionRun: any, quantity: number, expirationDate?: Date) {
        try {
            // Generate batch number
            const batchNumber = `BATCH-${Date.now()}`;
            const productionDate = new Date();

            // Calculate expiration date (use provided date or default 7 days for bakery products)
            const finalExpirationDate = expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Get default storage location
            const defaultLocation = await this.getOrCreateDefaultStorageLocation();

            // Create SKU based on recipe name and batch
            const sku = `${productionRun.recipe.name.replace(/\s+/g, '-').toUpperCase()}-${batchNumber}`;

            // Create finished product
            const finishedProduct = await prisma.finishedProduct.create({
                data: {
                    name: productionRun.recipe.name,
                    description: `Produced from recipe: ${productionRun.recipe.name}`,
                    sku,
                    batchNumber,
                    productionDate,
                    expirationDate: finalExpirationDate,
                    shelfLife: 7, // days
                    quantity,
                    unit: productionRun.targetUnit,
                    salePrice: 10.0, // Default price - should be calculated based on recipe cost
                    costToProduce: await this.calculateProductionCost(productionRun),
                    storageLocationId: defaultLocation.id,
                    productionRunId: productionRun.id, // Link to production run
                    status: 'COMPLETED',
                    packagingInfo: `Produced via ${productionRun.name}`,
                    isContaminated: false,
                    reservedQuantity: 0
                }
            });

            console.log(`📦 Created finished product: ${finishedProduct.name}`);
            return finishedProduct;

        } catch (error) {
            console.error('❌ Error creating finished product:', error);
            throw error;
        }
    }

    // Calculate production cost based on ingredients
    private async calculateProductionCost(productionRun: any): Promise<number> {
        try {
            console.log(`💰 Calculating actual production cost for run: ${productionRun.id}`);

            // First, try to get actual material costs from allocations
            const costBreakdown = await inventoryAllocationService.calculateProductionCost(productionRun.id);
            
            if (costBreakdown.materials.length > 0) {
                console.log(`✅ Using actual material costs: $${costBreakdown.totalCost.toFixed(2)}`);
                return costBreakdown.totalCost;
            }

            // Fallback to estimated costs from recipe if no allocations exist
            console.log('⚠️ No material allocations found, using estimated costs from recipe');
            const recipe = await prisma.recipe.findUnique({
                where: { id: productionRun.recipeId },
                include: {
                    ingredients: {
                        include: {
                            rawMaterial: true,
                            intermediateProduct: true
                        }
                    }
                }
            });

            if (!recipe) {
                return 5.0; // Default cost
            }

            let totalCost = 0;

            for (const ingredient of recipe.ingredients) {
                const requiredQuantity = ingredient.quantity * productionRun.targetQuantity;

                if (ingredient.rawMaterial) {
                    totalCost += requiredQuantity * (ingredient.rawMaterial.unitPrice || 0);
                } else if (ingredient.intermediateProduct) {
                    // For intermediate products, use their cost per unit or default
                    totalCost += requiredQuantity * (ingredient.intermediateProduct.costPerUnit || 2.0);
                }
            }

            // Add 20% overhead for labor and utilities
            const finalCost = totalCost * 1.2;
            console.log(`📊 Estimated cost: $${finalCost.toFixed(2)} (materials: $${totalCost.toFixed(2)} + 20% overhead)`);
            
            return finalCost;

        } catch (error) {
            console.error('Error calculating production cost:', error);
            return 5.0; // Default fallback cost
        }
    }

    // Get default storage location or create one
    private async getOrCreateDefaultStorageLocation() {
        let location = await prisma.storageLocation.findFirst({
            where: {
                OR: [
                    { name: { contains: 'warehouse' } },
                    { name: { contains: 'storage' } },
                    { type: 'WAREHOUSE' }
                ]
            }
        });

        if (!location) {
            location = await prisma.storageLocation.create({
                data: {
                    name: 'Default Warehouse',
                    type: 'WAREHOUSE',
                    description: 'Default storage location for finished products',
                    capacity: '1000 units'
                }
            });
        }

        return location;
    }
}

export default ProductionCompletionService;
