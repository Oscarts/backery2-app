// Production Completion Service
// Handles creating finished products when production runs are completed

import { Prisma, PrismaClient } from '@prisma/client';
import InventoryAllocationService from './inventoryAllocationService';
import { getOrCreateSkuForName } from './skuService';
import { recipeCostService } from './recipeCostService';
import {
    ProductionCostCalculation,
    SalePriceCalculation,
    DEFAULT_PRODUCTION_COST_CONFIG,
} from '../types/productionCost';

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

            // Allocate materials if not already done
            const existingAllocations = await prisma.productionAllocation.findMany({
                where: { productionRunId }
            });

            if (existingAllocations.length === 0) {
                console.log('🔄 Auto-allocating materials for production run');
                fs.appendFileSync('/tmp/production-debug.log',
                    `${new Date().toISOString()} SERVICE: Auto-allocating materials\n`
                );

                try {
                    const productionMultiplier = productionRun.targetQuantity / (productionRun.recipe?.yieldQuantity || 1);
                    const allocations = await inventoryAllocationService.allocateIngredients(
                        productionRunId,
                        productionRun.recipeId,
                        productionMultiplier
                    );
                    console.log(`✓ Allocated ${allocations.length} materials`);
                    fs.appendFileSync('/tmp/production-debug.log',
                        `${new Date().toISOString()} SERVICE: Allocated ${allocations.length} materials\n`
                    );
                } catch (allocError) {
                    console.warn('⚠️ Material allocation failed:', allocError);
                    fs.appendFileSync('/tmp/production-debug.log',
                        `${new Date().toISOString()} SERVICE WARNING: Material allocation failed - ${allocError}\n`
                    );
                    // Continue with completion even if allocation fails
                }
            } else {
                console.log(`✓ Materials already allocated (${existingAllocations.length} items)`);
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
            // Get clientId from production run FIRST (required for multi-tenant isolation)
            const clientId = productionRun.clientId;
            if (!clientId) {
                throw new Error('Production run must have a clientId for tenant isolation');
            }

            // Generate batch number
            const batchNumber = `BATCH-${Date.now()}`;
            const productionDate = new Date();

            // Calculate expiration date (use provided date or default 7 days for bakery products)
            const finalExpirationDate = expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Get default storage location
            const defaultLocation = await this.getOrCreateDefaultStorageLocation(clientId);

            // Derive/reuse stable SKU (independent of batch)
            const sku = await getOrCreateSkuForName(productionRun.recipe.name, clientId);

            // Calculate production cost and sale price from recipe
            const productionCostCalc = await this.calculateProductionCost(productionRun);
            const salePriceCalc = await this.calculateSalePrice(productionRun.recipeId, productionCostCalc);

            let finishedProduct;
            try {
                // Attempt to create new finished product record
                finishedProduct = await prisma.finishedProduct.create({
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
                        salePrice: salePriceCalc.salePrice,
                        costToProduce: productionCostCalc.costPerUnit,
                        markupPercentage: salePriceCalc.markupPercentage, // Store the markup percentage
                        storageLocationId: defaultLocation.id,
                        productionRunId: productionRun.id, // Link to production run
                        status: 'COMPLETED',
                        packagingInfo: `Produced via ${productionRun.name}`,
                        isContaminated: false,
                        reservedQuantity: 0,
                        clientId // Explicitly add clientId from production run
                    }
                });
            } catch (err: any) {
                // If a unique constraint on SKU still exists in the database (legacy schema),
                // reuse the existing product and increment its quantity instead of failing.
                if (err.code === 'P2002' && Array.isArray(err.meta?.target) && err.meta.target.includes('sku')) {
                    console.warn('⚠️  Unique constraint on finished_products.sku detected (legacy). Reusing existing product for SKU:', sku);
                    finishedProduct = await prisma.finishedProduct.findFirst({ where: { sku }, orderBy: { createdAt: 'asc' } });
                    if (finishedProduct) {
                        finishedProduct = await prisma.finishedProduct.update({
                            where: { id: finishedProduct.id },
                            data: { quantity: finishedProduct.quantity + quantity }
                        });
                    } else {
                        throw err; // unexpected: sku conflict but no existing product
                    }
                } else {
                    throw err;
                }
            }

            console.log(`📦 Created finished product: ${finishedProduct.name}`);
            return finishedProduct;

        } catch (error) {
            console.error('❌ Error creating finished product:', error);
            throw error;
        }
    }

    /**
     * Calculate production cost for a run using recipe cost service
     * This ensures costs are calculated consistently with recipe overhead
     * 
     * @param productionRun - The production run to calculate cost for
     * @returns Promise<ProductionCostCalculation> - Detailed cost breakdown
     * @throws Error if recipe cost calculation fails
     */
    private async calculateProductionCost(productionRun: any): Promise<ProductionCostCalculation> {
        try {
            if (!productionRun.recipeId) {
                throw new Error('Production run must have a recipe ID');
            }

            if (!productionRun.targetQuantity || productionRun.targetQuantity <= 0) {
                throw new Error('Production run must have a valid target quantity');
            }

            // Use the recipe cost service to get accurate cost including proper overhead
            const recipeCostBreakdown = await recipeCostService.calculateRecipeCost(productionRun.recipeId);

            if (!recipeCostBreakdown || !recipeCostBreakdown.costPerUnit) {
                throw new Error('Failed to calculate recipe cost breakdown');
            }

            // Calculate total cost for the target quantity
            const costPerUnit = recipeCostBreakdown.costPerUnit;
            const totalCost = costPerUnit * productionRun.targetQuantity;

            const costCalculation: ProductionCostCalculation = {
                totalCost,
                costPerUnit,
                quantity: productionRun.targetQuantity,
                recipeId: productionRun.recipeId,
                recipeName: recipeCostBreakdown.recipeName,
                breakdown: {
                    materialCost: recipeCostBreakdown.totalMaterialCost || 0,
                    overheadCost: recipeCostBreakdown.overheadCost || 0,
                    overheadPercentage: recipeCostBreakdown.overheadCost
                        ? (recipeCostBreakdown.overheadCost / recipeCostBreakdown.totalMaterialCost) * 100
                        : 0,
                }
            };

            console.log(`📊 Production cost calculated: $${totalCost.toFixed(2)} (${productionRun.targetQuantity} units @ $${costPerUnit.toFixed(2)}/unit)`);
            console.log(`   Materials: $${costCalculation.breakdown.materialCost.toFixed(2)}, Overhead: $${costCalculation.breakdown.overheadCost.toFixed(2)} (${costCalculation.breakdown.overheadPercentage.toFixed(0)}%)`);

            return costCalculation;

        } catch (error) {
            console.error('❌ Error calculating production cost:', error);
            console.warn(`⚠️  Using fallback cost: $${DEFAULT_PRODUCTION_COST_CONFIG.fallbackCostPerUnit} per unit`);

            // Return fallback cost calculation
            return {
                totalCost: DEFAULT_PRODUCTION_COST_CONFIG.fallbackCostPerUnit * (productionRun.targetQuantity || 1),
                costPerUnit: DEFAULT_PRODUCTION_COST_CONFIG.fallbackCostPerUnit,
                quantity: productionRun.targetQuantity || 1,
                recipeId: productionRun.recipeId || 'unknown',
                breakdown: {
                    materialCost: 0,
                    overheadCost: 0,
                    overheadPercentage: 0,
                }
            };
        }
    }

    /**
     * Calculate sale price based on recipe cost and markup strategy
     * This ensures consistent pricing across all finished products
     * 
     * @param recipeId - The recipe ID to calculate price for
     * @param productionCostCalculation - The production cost calculation
     * @returns Promise<SalePriceCalculation> - Detailed price calculation
     * @throws Error if sale price calculation fails
     */
    private async calculateSalePrice(
        recipeId: string,
        productionCostCalculation: ProductionCostCalculation
    ): Promise<SalePriceCalculation> {
        try {
            console.log(`💵 Calculating sale price for recipe: ${recipeId}`);

            // Use cost per unit from production cost calculation
            const costPerUnit = productionCostCalculation.costPerUnit;

            // Apply markup: 50% markup by default (can be configured per recipe later)
            const markupPercentage = DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage;
            const markupAmount = costPerUnit * markupPercentage;
            const salePrice = costPerUnit + markupAmount;

            const priceCalculation: SalePriceCalculation = {
                salePrice,
                costPerUnit,
                markupPercentage,
                markupAmount,
            };

            console.log(`📊 Sale price calculated: $${salePrice.toFixed(2)} (Cost: $${costPerUnit.toFixed(2)} + ${(markupPercentage * 100)}% markup: $${markupAmount.toFixed(2)})`);

            return priceCalculation;

        } catch (error) {
            console.error('❌ Error calculating sale price:', error);
            console.warn(`⚠️  Using fallback sale price: $${DEFAULT_PRODUCTION_COST_CONFIG.fallbackSalePrice}`);

            // Return fallback price calculation
            return {
                salePrice: DEFAULT_PRODUCTION_COST_CONFIG.fallbackSalePrice,
                costPerUnit: productionCostCalculation.costPerUnit || DEFAULT_PRODUCTION_COST_CONFIG.fallbackCostPerUnit,
                markupPercentage: DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage,
                markupAmount: 0,
            };
        }
    }

    // Get default storage location or create one
    private async getOrCreateDefaultStorageLocation(clientId: string) {
        let location = await prisma.storageLocation.findFirst({
            where: {
                clientId, // Filter by tenant
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
                    capacity: '1000 units',
                    clientId // Explicitly add clientId for tenant isolation
                }
            });
        }

        return location;
    }
}

export default ProductionCompletionService;

// Factory helper to avoid constructor resolution issues in transpiled environments
export function createProductionCompletionService() {
    return new ProductionCompletionService();
}

// Lightweight functional API for tests to avoid constructor & circular issues
export async function completeProductionRunDirect(productionRunId: string, actualQuantity?: number) {
    const svc = new ProductionCompletionService();
    return svc.completeProductionRun(productionRunId, actualQuantity);
}
