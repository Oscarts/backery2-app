// Resource & Inventory Integration Service
// Handles automatic inventory allocation and consumption during production

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductionInventoryService {
    // Check if recipe ingredients are available for production
    async checkIngredientAvailability(recipeId: string, quantity: number = 1) {
        const recipe = await prisma.recipe.findUnique({
            where: { id: recipeId },
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
            throw new Error('Recipe not found');
        }

        const availabilityChecks = [];
        const insufficientIngredients = [];

        for (const ingredient of recipe.ingredients) {
            const requiredQuantity = ingredient.quantity * quantity;
            let available = false;
            let currentStock = 0;

            if (ingredient.rawMaterialId && ingredient.rawMaterial) {
                currentStock = ingredient.rawMaterial.quantity;
                available = currentStock >= requiredQuantity;
            } else if (ingredient.intermediateProductId && ingredient.intermediateProduct) {
                currentStock = ingredient.intermediateProduct.quantity;
                available = currentStock >= requiredQuantity;
            }

            const check = {
                materialId: ingredient.rawMaterialId || ingredient.intermediateProductId,
                materialName: ingredient.rawMaterial?.name || ingredient.intermediateProduct?.name,
                materialType: ingredient.rawMaterialId ? 'raw_material' : 'intermediate_product',
                required: requiredQuantity,
                available: currentStock,
                unit: ingredient.unit,
                sufficient: available
            };

            availabilityChecks.push(check);

            if (!available) {
                insufficientIngredients.push({
                    ...check,
                    shortage: requiredQuantity - currentStock
                });
            }
        }

        return {
            canProduce: insufficientIngredients.length === 0,
            checks: availabilityChecks,
            insufficientIngredients,
            estimatedCost: this.calculateProductionCost(recipe, quantity)
        };
    }

    // Allocate (reserve) ingredients for production
    async allocateIngredients(productionRunId: string, recipeId: string, quantity: number = 1) {
        const availability = await this.checkIngredientAvailability(recipeId, quantity);
        
        if (!availability.canProduce) {
            throw new Error(`Insufficient ingredients: ${availability.insufficientIngredients.map(i => i.materialName).join(', ')}`);
        }

        const recipe = await prisma.recipe.findUnique({
            where: { id: recipeId },
            include: { ingredients: true }
        });

        const allocations = [];

        // Create allocation records and reserve inventory
        for (const ingredient of recipe.ingredients) {
            const requiredQuantity = ingredient.quantity * quantity;
            
            // Create allocation record
            const allocation = await prisma.productionAllocation.create({
                data: {
                    productionRunId,
                    materialType: ingredient.rawMaterialId ? 'raw_material' : 'intermediate_product',
                    materialId: ingredient.rawMaterialId || ingredient.intermediateProductId,
                    materialName: ingredient.rawMaterial?.name || ingredient.intermediateProduct?.name || 'Unknown',
                    quantityAllocated: requiredQuantity,
                    unit: ingredient.unit,
                    status: 'ALLOCATED'
                }
            });

            allocations.push(allocation);

            // Update inventory to reserve the quantity
            if (ingredient.rawMaterialId) {
                await prisma.rawMaterial.update({
                    where: { id: ingredient.rawMaterialId },
                    data: { 
                        quantity: { decrement: requiredQuantity },
                        reservedQuantity: { increment: requiredQuantity }
                    }
                });
            } else if (ingredient.intermediateProductId) {
                await prisma.intermediateProduct.update({
                    where: { id: ingredient.intermediateProductId },
                    data: { 
                        quantity: { decrement: requiredQuantity },
                        reservedQuantity: { increment: requiredQuantity }
                    }
                });
            }
        }

        return allocations;
    }

    // Consume allocated ingredients during production
    async consumeIngredients(productionRunId: string) {
        const allocations = await prisma.productionAllocation.findMany({
            where: { 
                productionRunId,
                status: 'ALLOCATED'
            }
        });

        for (const allocation of allocations) {
            // Mark as consumed
            await prisma.productionAllocation.update({
                where: { id: allocation.id },
                data: { 
                    status: 'CONSUMED',
                    consumedAt: new Date()
                }
            });

            // Update reserved quantities
            if (allocation.materialType === 'raw_material') {
                await prisma.rawMaterial.update({
                    where: { id: allocation.materialId },
                    data: { 
                        reservedQuantity: { decrement: allocation.quantityAllocated }
                    }
                });
            } else if (allocation.materialType === 'intermediate_product') {
                await prisma.intermediateProduct.update({
                    where: { id: allocation.materialId },
                    data: { 
                        reservedQuantity: { decrement: allocation.quantityAllocated }
                    }
                });
            }
        }

        return allocations;
    }

    // Release allocated ingredients (in case of production cancellation)
    async releaseAllocatedIngredients(productionRunId: string) {
        const allocations = await prisma.productionAllocation.findMany({
            where: { 
                productionRunId,
                status: 'ALLOCATED'
            }
        });

        for (const allocation of allocations) {
            // Mark as released
            await prisma.productionAllocation.update({
                where: { id: allocation.id },
                data: { 
                    status: 'RELEASED',
                    releasedAt: new Date()
                }
            });

            // Return quantities to available inventory
            if (allocation.materialType === 'raw_material') {
                await prisma.rawMaterial.update({
                    where: { id: allocation.materialId },
                    data: { 
                        quantity: { increment: allocation.quantityAllocated },
                        reservedQuantity: { decrement: allocation.quantityAllocated }
                    }
                });
            } else if (allocation.materialType === 'intermediate_product') {
                await prisma.intermediateProduct.update({
                    where: { id: allocation.materialId },
                    data: { 
                        quantity: { increment: allocation.quantityAllocated },
                        reservedQuantity: { decrement: allocation.quantityAllocated }
                    }
                });
            }
        }

        return allocations;
    }

    // Generate finished product when production completes
    async generateFinishedProduct(productionRunId: string) {
        const productionRun = await prisma.productionRun.findUnique({
            where: { id: productionRunId },
            include: {
                recipe: true,
                allocations: true
            }
        });

        if (!productionRun) {
            throw new Error('Production run not found');
        }

        // Calculate actual production cost
        const actualCost = await this.calculateActualProductionCost(productionRun.allocations);

        // Create finished product
        const finishedProduct = await prisma.finishedProduct.create({
            data: {
                name: productionRun.name,
                description: `Produced from ${productionRun.recipe.name}`,
                sku: `PROD-${productionRun.id.slice(-8)}`,
                quantity: productionRun.finalQuantity || productionRun.targetQuantity,
                unit: productionRun.targetUnit,
                costPerUnit: actualCost / (productionRun.finalQuantity || productionRun.targetQuantity),
                salePrice: productionRun.recipe.estimatedCost * 1.5, // 50% markup as default
                batchNumber: `BATCH-${Date.now()}`,
                productionDate: new Date(),
                expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
                status: 'AVAILABLE',
                notes: `Auto-generated from production run ${productionRun.id}`
            }
        });

        // Update production run with finished product reference
        await prisma.productionRun.update({
            where: { id: productionRunId },
            data: {
                actualCost,
                notes: `${productionRun.notes || ''}\nGenerated finished product: ${finishedProduct.id}`
            }
        });

        return finishedProduct;
    }

    // Calculate estimated production cost
    private calculateProductionCost(recipe: any, quantity: number = 1) {
        let totalCost = 0;

        for (const ingredient of recipe.ingredients) {
            const requiredQuantity = ingredient.quantity * quantity;
            const unitCost = ingredient.rawMaterial?.unitPrice || ingredient.intermediateProduct?.costPerUnit || 0;
            totalCost += requiredQuantity * unitCost;
        }

        return totalCost;
    }

    // Calculate actual production cost from allocations
    private async calculateActualProductionCost(allocations: any[]) {
        let totalCost = 0;

        for (const allocation of allocations) {
            let unitCost = 0;

            if (allocation.materialType === 'raw_material') {
                const material = await prisma.rawMaterial.findUnique({
                    where: { id: allocation.materialId }
                });
                unitCost = material?.unitPrice || 0;
            } else if (allocation.materialType === 'intermediate_product') {
                const product = await prisma.intermediateProduct.findUnique({
                    where: { id: allocation.materialId }
                });
                unitCost = product?.costPerUnit || 0;
            }

            totalCost += allocation.quantityAllocated * unitCost;
        }

        return totalCost;
    }
}

export const productionInventoryService = new ProductionInventoryService();
