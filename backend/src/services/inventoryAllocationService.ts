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

export class InventoryAllocationService {
  
  /**
   * Allocate ingredients for a production run based on recipe requirements
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
        materialSku: `RM-${material.id.substring(0, 8)}`, // Generate SKU from ID if not available
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
  async calculateProductionCost(productionRunId: string): Promise<{ materialCost: number, totalCost: number, materials: any[] }> {
    const materials = await this.getMaterialUsage(productionRunId);
    
    const materialCost = materials.reduce((total, material) => {
      const quantity = material.quantityConsumed || material.quantityAllocated || 0;
      const unitCost = material.unitCost || 0;
      return total + (quantity * unitCost);
    }, 0);

    // Add 20% overhead for labor and utilities
    const totalCost = materialCost * 1.2;

    return {
      materialCost,
      totalCost,
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