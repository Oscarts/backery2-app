/**
 * Inventory Allocation Service
 * 
 * This service handles allocation and consumption of raw materials and intermediate products
 * for production runs. It tracks detailed material usage including costs, batch numbers,
 * and SKUs for comprehensive material traceability.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MaterialAllocation {
  materialType: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  materialId: string;
  materialName: string;
  materialSku: string;
  materialBatchNumber: string;
  quantityNeeded: number;
  quantityAllocated: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface MaterialConsumption {
  allocationId: string;
  quantityConsumed: number;
  notes?: string;
}

export interface IngredientAvailability {
  materialId: string;
  materialName: string;
  materialType: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  quantityNeeded: number;
  quantityAvailable: number;
  unit: string;
  isAvailable: boolean;
  shortage?: number;
}

export interface StockCheckResult {
  canProduce: boolean;
  allIngredientsAvailable: boolean;
  unavailableIngredients: IngredientAvailability[];
  availableIngredients: IngredientAvailability[];
  message?: string;
}

export class InventoryAllocationService {
  
  /**
   * Check if all ingredients are available for production without allocating them
   * This should be called BEFORE creating a production run
   */
  async checkIngredientAvailability(recipeId: string, productionMultiplier: number = 1): Promise<StockCheckResult> {
    try {
      console.log(`🔍 Checking ingredient availability for recipe: ${recipeId}, multiplier: ${productionMultiplier}`);
      
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          ingredients: {
            include: {
              rawMaterial: true,
              finishedProduct: true
            }
          }
        }
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const availableIngredients: IngredientAvailability[] = [];
      const unavailableIngredients: IngredientAvailability[] = [];

      // Check each ingredient
      for (const ingredient of recipe.ingredients) {
        const quantityNeeded = ingredient.quantity * productionMultiplier;

        if (ingredient.rawMaterial) {
          const material = ingredient.rawMaterial;
          const available = material.quantity - material.reservedQuantity;
          const isAvailable = available >= quantityNeeded;
          
          const availability: IngredientAvailability = {
            materialId: material.id,
            materialName: material.name,
            materialType: 'RAW_MATERIAL',
            quantityNeeded,
            quantityAvailable: available,
            unit: ingredient.unit,
            isAvailable,
            shortage: isAvailable ? undefined : quantityNeeded - available
          };

          if (isAvailable) {
            availableIngredients.push(availability);
          } else {
            unavailableIngredients.push(availability);
          }
        } else if (ingredient.finishedProduct) {
          const product = ingredient.finishedProduct;
          const available = product.quantity - product.reservedQuantity;
          const isAvailable = available >= quantityNeeded;
          
          const availability: IngredientAvailability = {
            materialId: product.id,
            materialName: product.name,
            materialType: 'FINISHED_PRODUCT',
            quantityNeeded,
            quantityAvailable: available,
            unit: ingredient.unit,
            isAvailable,
            shortage: isAvailable ? undefined : quantityNeeded - available
          };

          if (isAvailable) {
            availableIngredients.push(availability);
          } else {
            unavailableIngredients.push(availability);
          }
        }
      }

      const allIngredientsAvailable = unavailableIngredients.length === 0;
      
      let message = '';
      if (!allIngredientsAvailable) {
        const shortageList = unavailableIngredients
          .map(ing => `${ing.materialName}: need ${ing.quantityNeeded} ${ing.unit}, only ${ing.quantityAvailable} ${ing.unit} available (shortage: ${ing.shortage} ${ing.unit})`)
          .join('; ');
        message = `Insufficient stock for: ${shortageList}`;
      }

      console.log(`${allIngredientsAvailable ? '✅' : '❌'} Ingredient check: ${allIngredientsAvailable ? 'All available' : message}`);

      return {
        canProduce: allIngredientsAvailable,
        allIngredientsAvailable,
        unavailableIngredients,
        availableIngredients,
        message
      };

    } catch (error) {
      console.error('❌ Error checking ingredient availability:', error);
      throw error;
    }
  }
  
  /**
   * Allocate ingredients for a production run based on recipe requirements
   * NOTE: Call checkIngredientAvailability() first to verify stock before allocating
   */
  async allocateIngredients(productionRunId: string, recipeId: string, productionMultiplier: number = 1): Promise<MaterialAllocation[]> {
    try {
      console.log(`🔄 Allocating ingredients for production run: ${productionRunId}`);
      
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          ingredients: {
            include: {
              rawMaterial: true,
              finishedProduct: true
            }
          }
        }
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      const allocations: MaterialAllocation[] = [];

      // Process each recipe ingredient
      for (const ingredient of recipe.ingredients) {
        const quantityNeeded = ingredient.quantity * productionMultiplier;

        if (ingredient.rawMaterial) {
          const allocation = await this.allocateRawMaterial(
            productionRunId,
            ingredient.rawMaterial,
            quantityNeeded,
            ingredient.unit
          );
          allocations.push(allocation);
        } else if (ingredient.finishedProduct) {
          const allocation = await this.allocateFinishedProduct(
            productionRunId,
            ingredient.finishedProduct,
            quantityNeeded,
            ingredient.unit
          );
          allocations.push(allocation);
        }
      }

      console.log(`✅ Allocated ${allocations.length} ingredients for production run`);
      return allocations;

    } catch (error) {
      console.error('❌ Error allocating ingredients:', error);
      throw error;
    }
  }

  /**
   * Allocate raw material for production
   */
  private async allocateRawMaterial(
    productionRunId: string,
    material: any,
    quantityNeeded: number,
    unit: string
  ): Promise<MaterialAllocation> {
    // Check available stock
    if (material.quantity - material.reservedQuantity < quantityNeeded) {
      throw new Error(`Insufficient stock for ${material.name}. Available: ${material.quantity - material.reservedQuantity}, Needed: ${quantityNeeded}`);
    }

    // Update reserved quantity
    await prisma.rawMaterial.update({
      where: { id: material.id },
      data: {
        reservedQuantity: material.reservedQuantity + quantityNeeded
      }
    });

    const unitCost = material.unitPrice || 0;
    const totalCost = quantityNeeded * unitCost;

    // Create allocation record
    const allocation = await prisma.productionAllocation.create({
      data: {
        productionRunId,
        materialType: 'RAW_MATERIAL',
        materialId: material.id,
        materialName: material.name,
  materialSku: material.sku || `RM-${material.id.substring(0, 8)}`, // Use unified SKU if available
        materialBatchNumber: material.batchNumber || 'NO-BATCH',
        quantityAllocated: quantityNeeded,
        unit,
        unitCost,
        totalCost,
        status: 'ALLOCATED'
      }
    });

    console.log(`📦 Allocated ${quantityNeeded} ${unit} of ${material.name} (Batch: ${material.batchNumber})`);

    return {
      materialType: 'RAW_MATERIAL',
      materialId: material.id,
      materialName: material.name,
  materialSku: allocation.materialSku || material.sku || 'N/A',
      materialBatchNumber: material.batchNumber || 'NO-BATCH',
      quantityNeeded,
      quantityAllocated: quantityNeeded,
      unit,
      unitCost,
      totalCost
    };
  }

  /**
   * Allocate finished product for production
   */
  private async allocateFinishedProduct(
    productionRunId: string,
    material: any,
    quantityNeeded: number,
    unit: string
  ): Promise<MaterialAllocation> {
    // Check available stock
    if (material.quantity - material.reservedQuantity < quantityNeeded) {
      throw new Error(`Insufficient stock for ${material.name}. Available: ${material.quantity - material.reservedQuantity}, Needed: ${quantityNeeded}`);
    }

    // Update reserved quantity
    await prisma.finishedProduct.update({
      where: { id: material.id },
      data: {
        reservedQuantity: material.reservedQuantity + quantityNeeded
      }
    });

    const unitCost = material.costToProduce || 2.0; // Use cost to produce for finished products
    const totalCost = quantityNeeded * unitCost;

    // Create allocation record
    const allocation = await prisma.productionAllocation.create({
      data: {
        productionRunId,
        materialType: 'FINISHED_PRODUCT',
        materialId: material.id,
        materialName: material.name,
        materialSku: material.sku, // Use the finished product SKU
        materialBatchNumber: material.batchNumber || 'NO-BATCH',
        quantityAllocated: quantityNeeded,
        unit,
        unitCost,
        totalCost,
        status: 'ALLOCATED'
      }
    });

    console.log(`🏭 Allocated ${quantityNeeded} ${unit} of ${material.name} (Batch: ${material.batchNumber})`);

    return {
  materialType: 'FINISHED_PRODUCT',
      materialId: material.id,
      materialName: material.name,
      materialSku: allocation.materialSku || 'N/A',
      materialBatchNumber: material.batchNumber || 'NO-BATCH',
      quantityNeeded,
      quantityAllocated: quantityNeeded,
      unit,
      unitCost,
      totalCost
    };
  }

  /**
   * Record material consumption during production steps
   */
  async recordMaterialConsumption(consumptions: MaterialConsumption[]): Promise<void> {
    try {
      console.log(`📝 Recording consumption for ${consumptions.length} materials`);

      for (const consumption of consumptions) {
        await prisma.productionAllocation.update({
          where: { id: consumption.allocationId },
          data: {
            quantityConsumed: consumption.quantityConsumed,
            consumedAt: new Date(),
            status: 'CONSUMED',
            notes: consumption.notes
          }
        });

        // Update actual inventory quantities
        const allocation = await prisma.productionAllocation.findUnique({
          where: { id: consumption.allocationId }
        });

        if (allocation) {
          if (allocation.materialType === 'RAW_MATERIAL') {
            await prisma.rawMaterial.update({
              where: { id: allocation.materialId },
              data: {
                quantity: { decrement: consumption.quantityConsumed },
                reservedQuantity: { decrement: Math.min(allocation.quantityAllocated, consumption.quantityConsumed) }
              }
            });
          } else if (allocation.materialType === 'FINISHED_PRODUCT') {
            await prisma.finishedProduct.update({
              where: { id: allocation.materialId },
              data: {
                quantity: { decrement: consumption.quantityConsumed },
                reservedQuantity: { decrement: Math.min(allocation.quantityAllocated, consumption.quantityConsumed) }
              }
            });
          }
        }
      }

      console.log('✅ Material consumption recorded successfully');

    } catch (error) {
      console.error('❌ Error recording material consumption:', error);
      throw error;
    }
  }

  /**
   * Get detailed material usage for a production run
   */
  async getMaterialUsage(productionRunId: string): Promise<any[]> {
    const allocations = await prisma.productionAllocation.findMany({
      where: { productionRunId },
      orderBy: { createdAt: 'asc' }
    });

    return allocations.map(allocation => ({
      id: allocation.id,
      materialType: allocation.materialType,
      materialName: allocation.materialName,
      materialSku: allocation.materialSku,
      materialBatchNumber: allocation.materialBatchNumber,
      quantityAllocated: allocation.quantityAllocated,
      quantityConsumed: allocation.quantityConsumed || allocation.quantityAllocated,
      unit: allocation.unit,
      unitCost: allocation.unitCost,
      totalCost: (allocation.quantityConsumed || allocation.quantityAllocated) * (allocation.unitCost || 0),
      status: allocation.status,
      notes: allocation.notes,
      consumedAt: allocation.consumedAt || allocation.allocatedAt
    }));
  }

  /**
   * Calculate total production cost from material usage
   */
  async calculateProductionCost(productionRunId: string): Promise<{ materialCost: number, overheadCost: number, totalCost: number, overheadPercentage: number, materials: any[] }> {
    const materials = await this.getMaterialUsage(productionRunId);
    
    const materialCost = materials.reduce((total, material) => {
      const quantity = material.quantityConsumed || material.quantityAllocated || 0;
      const unitCost = material.unitCost || 0;
      return total + (quantity * unitCost);
    }, 0);

    // Get the production run's recipe to use its overhead percentage
    const productionRun = await prisma.productionRun.findUnique({
      where: { id: productionRunId },
      include: { recipe: { select: { overheadPercentage: true } } }
    });

    // Use recipe's overhead percentage or default to 50%
    const overheadPercentage = productionRun?.recipe?.overheadPercentage ?? 50;
    const overheadRate = overheadPercentage / 100;
    const overheadCost = materialCost * overheadRate;
    const totalCost = materialCost + overheadCost;

    return {
      materialCost,
      overheadCost,
      totalCost,
      overheadPercentage,
      materials
    };
  }

  /**
   * Release allocated materials (when production is cancelled)
   */
  async releaseAllocatedIngredients(productionRunId: string): Promise<void> {
    try {
      const allocations = await prisma.productionAllocation.findMany({
        where: { 
          productionRunId,
          status: 'ALLOCATED'
        }
      });

      for (const allocation of allocations) {
        // Release reserved quantities
        if (allocation.materialType === 'RAW_MATERIAL') {
          await prisma.rawMaterial.update({
            where: { id: allocation.materialId },
            data: {
              reservedQuantity: { decrement: allocation.quantityAllocated }
            }
          });
        } else if (allocation.materialType === 'FINISHED_PRODUCT') {
          await prisma.finishedProduct.update({
            where: { id: allocation.materialId },
            data: {
              reservedQuantity: { decrement: allocation.quantityAllocated }
            }
          });
        }

        // Mark allocation as released and set quantityReleased
        await prisma.productionAllocation.update({
          where: { id: allocation.id },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
            quantityReleased: allocation.quantityAllocated
          }
        });
      }

      console.log(`✅ Released ${allocations.length} material allocations`);

    } catch (error) {
      console.error('❌ Error releasing allocated ingredients:', error);
      throw error;
    }
  }
}

export default InventoryAllocationService;