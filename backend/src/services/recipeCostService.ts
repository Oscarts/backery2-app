/**
 * Recipe Cost Calculation Service
 * 
 * Handles calculation of recipe production costs based on ingredient costs
 * and provides cost breakdown information for recipes.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RecipeCostBreakdown {
  recipeId: string;
  recipeName: string;
  yieldQuantity: number;
  yieldUnit: string;
  ingredients: IngredientCost[];
  totalMaterialCost: number;
  overheadCost: number; // 20% overhead for labor/utilities
  totalProductionCost: number;
  costPerUnit: number;
  lastUpdated: Date;
}

export interface IngredientCost {
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export class RecipeCostService {
  
  /**
   * Calculate the production cost for a recipe based on current ingredient prices
   */
  async calculateRecipeCost(recipeId: string): Promise<RecipeCostBreakdown> {
    console.log(`📊 Calculating production cost for recipe: ${recipeId}`);
    
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
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    const ingredients: IngredientCost[] = [];
    let totalMaterialCost = 0;

    for (const ingredient of recipe.ingredients) {
      let ingredientCost: IngredientCost;

      if (ingredient.rawMaterialId && ingredient.rawMaterial) {
        // Raw material cost
        const unitCost = ingredient.rawMaterial.unitPrice || 0;
        const totalCost = ingredient.quantity * unitCost;
        
        ingredientCost = {
          type: 'RAW_MATERIAL',
          id: ingredient.rawMaterial.id,
          name: ingredient.rawMaterial.name,
          sku: (ingredient.rawMaterial as any).sku || undefined,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          unitCost,
          totalCost
        };
        
        totalMaterialCost += totalCost;
      } else if (ingredient.finishedProductId && ingredient.finishedProduct) {
        // Finished product cost (use costToProduce if available, otherwise estimate)
        const unitCost = ingredient.finishedProduct.costToProduce || 
                        ingredient.finishedProduct.salePrice * 0.6; // 60% of sale price as fallback
        const totalCost = ingredient.quantity * unitCost;
        
        ingredientCost = {
          type: 'FINISHED_PRODUCT',
          id: ingredient.finishedProduct.id,
          name: ingredient.finishedProduct.name,
          sku: ingredient.finishedProduct.sku,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          unitCost,
          totalCost
        };
        
        totalMaterialCost += totalCost;
      } else {
        console.warn(`⚠️ Ingredient missing material reference: ${ingredient.id}`);
        continue;
      }

      ingredients.push(ingredientCost);
    }

    // Use recipe's overhead percentage or default to 50%
    const overheadRate = (recipe.overheadPercentage ?? 50) / 100;
    const overheadCost = totalMaterialCost * overheadRate;
    const totalProductionCost = totalMaterialCost + overheadCost;
    const costPerUnit = recipe.yieldQuantity > 0 ? totalProductionCost / recipe.yieldQuantity : 0;

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      yieldQuantity: recipe.yieldQuantity,
      yieldUnit: recipe.yieldUnit,
      ingredients,
      totalMaterialCost,
      overheadCost,
      totalProductionCost,
      costPerUnit,
      lastUpdated: new Date()
    };
  }

  /**
   * Update the estimated cost field for a recipe
   */
  async updateRecipeEstimatedCost(recipeId: string): Promise<number> {
    const costBreakdown = await this.calculateRecipeCost(recipeId);
    
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { estimatedCost: costBreakdown.totalProductionCost }
    });

    console.log(`✅ Updated estimated cost for recipe ${recipeId}: $${costBreakdown.totalProductionCost.toFixed(2)}`);
    return costBreakdown.totalProductionCost;
  }

  /**
   * Batch update estimated costs for all active recipes
   */
  async updateAllRecipeCosts(): Promise<{ updated: number; errors: string[] }> {
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    let updated = 0;
    const errors: string[] = [];

    for (const recipe of recipes) {
      try {
        await this.updateRecipeEstimatedCost(recipe.id);
        updated++;
      } catch (error) {
        const errorMsg = `Failed to update cost for recipe ${recipe.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`📊 Batch cost update complete: ${updated} recipes updated, ${errors.length} errors`);
    return { updated, errors };
  }
}

export const recipeCostService = new RecipeCostService();