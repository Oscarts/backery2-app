// Production Completion Service
// Handles creating finished products when production runs are completed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductionCompletionService {

    // Complete a production run and create finished product
    async completeProductionRun(productionRunId: string, finalQuantity?: number, customExpirationDate?: Date): Promise<{ productionRun: any; finishedProduct: any }> {
        try {
            console.log(`🏁 Completing production run: ${productionRunId}`);

            // Get production run with recipe details
            const productionRun = await prisma.productionRun.findUnique({
                where: { id: productionRunId },
                include: {
                    recipe: true,
                    steps: true
                }
            });

            if (!productionRun) {
                throw new Error('Production run not found');
            }

            // Calculate actual quantity
            const quantity = finalQuantity || productionRun.targetQuantity;

            // Update production run status
            const updatedProductionRun = await prisma.productionRun.update({
                where: { id: productionRunId },
                data: {
                    status: 'COMPLETED' as any,
                    completedAt: new Date(),
                    finalQuantity: quantity,
                    actualCost: await this.calculateProductionCost(productionRun)
                }
            });

            // Create finished product
            const finishedProduct = await this.createFinishedProduct(productionRun, quantity, customExpirationDate);

            console.log(`✅ Production run completed successfully`);

            return {
                productionRun: updatedProductionRun,
                finishedProduct
            };

        } catch (error) {
            console.error('❌ Error completing production run:', error);
            throw error;
        }
    }

    // Create finished product from production run
    private async createFinishedProduct(productionRun: any, quantity: number, customExpirationDate?: Date) {
        try {
            // Generate batch number
            const batchNumber = `BATCH-${Date.now()}`;
            const productionDate = new Date();

            // Calculate expiration date (default 7 days for bakery products)
            const defaultExpirationDate = new Date();
            defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 7);
            const expirationDate = customExpirationDate || defaultExpirationDate;

            // Get default storage location
            const defaultLocation = await this.getOrCreateDefaultStorageLocation();

            // Create SKU based on recipe name and batch
            const sku = `${productionRun.recipe.name.replace(/\s+/g, '-').toUpperCase()}-${batchNumber}`;

            // Create finished product
            const finishedProduct = await prisma.finishedProduct.create({
                data: {
                    name: `${productionRun.recipe.name} (${batchNumber})`,
                    description: `Produced from recipe: ${productionRun.recipe.name}`,
                    sku,
                    batchNumber,
                    productionDate,
                    expirationDate,
                    shelfLife: Math.ceil((expirationDate.getTime() - productionDate.getTime()) / (1000 * 60 * 60 * 24)), // Calculate shelf life in days
                    quantity,
                    unit: productionRun.targetUnit,
                    salePrice: 10.0, // Default price - should be calculated based on recipe cost
                    costToProduce: await this.calculateProductionCost(productionRun),
                    storageLocationId: defaultLocation.id,
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
                    // For intermediate products, use a default cost calculation
                    totalCost += requiredQuantity * 2.0; // Default $2 per unit
                }
            }

            // Add 20% overhead for labor and utilities
            return totalCost * 1.2;

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
