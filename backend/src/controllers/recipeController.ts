import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { recipeCostService } from '../services/recipeCostService';

const prisma = new PrismaClient();

// Get all recipes with ingredients and category info
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        category: true,
        ingredients: {
          include: {
            rawMaterial: {
              include: {
                category: true,
                supplier: true
              }
            },
            finishedProduct: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipes'
    });
  }
};

// Get recipe by ID
export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true,
        ingredients: {
          include: {
            rawMaterial: {
              include: {
                category: true,
                supplier: true
              }
            },
            finishedProduct: true
          }
        }
      }
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipe'
    });
  }
};

// Create new recipe
export const createRecipe = async (req: Request, res: Response) => {
  try {
    console.log('Creating recipe with data:', JSON.stringify(req.body, null, 2));

    const {
      name,
      description,
      categoryId,
      yieldQuantity,
      yieldUnit,
      prepTime,
      cookTime,
      instructions,
      ingredients,
      isActive,
      emoji,
      difficulty,
      estimatedTotalTime,
      imageUrl,
      overheadPercentage
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Recipe name is required'
      });
    }

    // Create recipe with ingredients in a transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          name,
          description: description || '',
          categoryId: categoryId || undefined, // Make categoryId optional
          yieldQuantity: Number(yieldQuantity) || 1,
          yieldUnit: yieldUnit || '',
          prepTime: prepTime ? Number(prepTime) : null,
          cookTime: cookTime ? Number(cookTime) : null,
          instructions: instructions || [],
          isActive: isActive !== undefined ? isActive : true,
          emoji: emoji || '🍞',
          difficulty: difficulty || 'MEDIUM',
          estimatedTotalTime: estimatedTotalTime ? Number(estimatedTotalTime) : null,
          imageUrl: imageUrl || null,
          overheadPercentage: overheadPercentage !== undefined ? Number(overheadPercentage) : 20,
          version: 1 // Default version
        } as any // clientId added by Prisma middleware
      });

      // Create ingredients if provided
      if (ingredients && ingredients.length > 0) {
        console.log('📝 Ingredients received:', JSON.stringify(ingredients, null, 2));

        // Validate each ingredient - exactly one of rawMaterialId or finishedProductId
        for (let i = 0; i < ingredients.length; i++) {
          const ing = ingredients[i];
          console.log(`📋 Ingredient ${i}:`, JSON.stringify(ing, null, 2));
          console.log(`  - rawMaterialId: ${ing.rawMaterialId}`);
          console.log(`  - finishedProductId: ${ing.finishedProductId}`);
          console.log(`  - has both? ${!!(ing.rawMaterialId && ing.finishedProductId)}`);
          console.log(`  - has neither? ${!!(!ing.rawMaterialId && !ing.finishedProductId)}`);

          if ((!ing.rawMaterialId && !ing.finishedProductId) || (ing.rawMaterialId && ing.finishedProductId)) {
            throw new Error('Each ingredient must have exactly one of rawMaterialId or finishedProductId');
          }
        }
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ingredient: any) => ({
            recipeId: newRecipe.id,
            rawMaterialId: ingredient.rawMaterialId || null,
            finishedProductId: ingredient.finishedProductId || null,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            notes: ingredient.notes || null
          }))
        });
      }

      // Return the complete recipe with ingredients
      return await tx.recipe.findUnique({
        where: { id: newRecipe.id },
        include: {
          category: true,
          ingredients: {
            include: {
              rawMaterial: {
                include: {
                  category: true,
                  supplier: true
                }
              },
              finishedProduct: true
            }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (error: any) {
    console.error('Error creating recipe:', error);

    // Check for specific database errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: `Foreign key constraint failed - Invalid ${error.meta?.field_name || 'ID'}`
      });
    }

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: `A recipe with this name already exists`
      });
    }

    // Check for validation errors (thrown by our code)
    if (error.message && error.message.includes('must have exactly one')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Return a more specific error message if available
    res.status(500).json({
      success: false,
      error: `Failed to create recipe: ${error.message || 'Unknown error'}`
    });
  }
};

// Update recipe
export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      yieldQuantity,
      yieldUnit,
      prepTime,
      cookTime,
      instructions,
      ingredients,
      isActive,
      emoji,
      difficulty,
      estimatedTotalTime,
      imageUrl,
      overheadPercentage
    } = req.body;

    console.log('Update recipe request:', { id, body: req.body });

    const recipe = await prisma.$transaction(async (tx) => {
      // Update the recipe
      const updatedRecipe = await tx.recipe.update({
        where: { id },
        data: {
          name,
          description,
          categoryId,
          yieldQuantity,
          yieldUnit,
          prepTime,
          cookTime,
          instructions,
          isActive,
          emoji,
          difficulty,
          estimatedTotalTime,
          imageUrl,
          overheadPercentage,
          version: {
            increment: 1
          }
        }
      });

      // Update ingredients if provided
      if (ingredients) {
        // Delete existing ingredients
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: id }
        });

        if (ingredients.length > 0) {
          for (const ing of ingredients) {
            if ((!ing.rawMaterialId && !ing.finishedProductId) || (ing.rawMaterialId && ing.finishedProductId)) {
              throw new Error('Each ingredient must have exactly one of rawMaterialId or finishedProductId');
            }
          }
          await tx.recipeIngredient.createMany({
            data: ingredients.map((ingredient: any) => ({
              recipeId: id,
              rawMaterialId: ingredient.rawMaterialId || null,
              finishedProductId: ingredient.finishedProductId || null,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              notes: ingredient.notes || null
            }))
          });
        }
      }

      // Return the complete updated recipe
      return await tx.recipe.findUnique({
        where: { id },
        include: {
          category: true,
          ingredients: {
            include: {
              rawMaterial: {
                include: {
                  category: true,
                  supplier: true
                }
              },
              finishedProduct: true
            }
          }
        }
      });
    });

    // Recalculate cost if ingredients or overhead were updated
    if (ingredients !== undefined || overheadPercentage !== undefined) {
      try {
        await recipeCostService.updateRecipeEstimatedCost(id);
        console.log(`✅ Recalculated cost for recipe ${id} after update`);
      } catch (error) {
        console.warn(`⚠️ Could not recalculate cost for recipe ${id}:`, error);
      }
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error: any) {
    console.error('Error updating recipe:', error);

    // Check for validation errors
    if (error.message && error.message.includes('must have exactly one')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update recipe'
    });
  }
};

// Delete recipe
export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }
    // Perform a safe cascading style cleanup inside a transaction to handle legacy data
    const result = await prisma.$transaction(async (tx) => {
      // Gather production runs referencing this recipe
      const productionRuns = await tx.productionRun.findMany({
        where: { recipeId: id },
        select: { id: true }
      });

      let removedRuns = 0;
      if (productionRuns.length > 0) {
        const runIds = productionRuns.map(r => r.id);

        // Null out finished products tied to these runs (since relation is restrictive by default)
        await tx.finishedProduct.updateMany({
          where: { productionRunId: { in: runIds } },
          data: { productionRunId: null }
        });

        // Delete production runs (steps & allocations cascade via schema onDelete)
        await tx.productionRun.deleteMany({ where: { id: { in: runIds } } });
        removedRuns = runIds.length;
      }

      // Explicitly remove recipe ingredients (even though relation has cascade, this is defensive for older schema states)
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });

      // Finally delete the recipe
      await tx.recipe.delete({ where: { id } });

      return { removedRuns };
    });

    res.json({
      success: true,
      message: 'Recipe deleted successfully',
      meta: {
        removedProductionRuns: result.removedRuns
      }
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    if ((error as any).code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete recipe due to existing references (foreign key constraint)'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete recipe'
    });
  }
};

// Get recipe cost analysis
export const getRecipeCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const costBreakdown = await recipeCostService.calculateRecipeCost(id);

    res.json({
      success: true,
      data: costBreakdown,
      message: 'Recipe cost calculated successfully'
    });
  } catch (error: any) {
    console.error('Error calculating recipe cost:', error);

    if (error.message.includes('Recipe not found')) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to calculate recipe cost'
    });
  }
};

// Get "What can I make" analysis
export const getWhatCanIMake = async (req: Request, res: Response) => {
  try {
    console.log('📊 Starting What Can I Make analysis');

    // Get all active recipes with only raw material ingredients
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      include: {
        category: true,
        ingredients: {
          include: {
            rawMaterial: true,
            finishedProduct: true
          }
        }
      }
    });

    console.log(`Found ${recipes.length} active recipes`);

    // Get raw material inventory
    const rawMaterials = await prisma.rawMaterial.findMany();
    const finishedProducts = await prisma.finishedProduct.findMany();
    const inventory = new Map();
    const now = new Date();

    rawMaterials.forEach(material => {
      const isExpired = material.expirationDate && material.expirationDate <= now;
      const isContaminated = material.isContaminated;
      inventory.set(`RAW:${material.id}`, {
        quantity: (!isExpired && !isContaminated) ? material.quantity : 0,
        unit: material.unit,
        expired: isExpired,
        contaminated: isContaminated,
        type: 'RAW'
      });
    });

    finishedProducts.forEach(fp => {
      const isExpired = fp.expirationDate && fp.expirationDate <= now;
      const isContaminated = fp.isContaminated;
      inventory.set(`FINISHED:${fp.id}`, {
        quantity: (!isExpired && !isContaminated) ? fp.quantity : 0,
        unit: fp.unit,
        expired: isExpired,
        contaminated: isContaminated,
        type: 'FINISHED'
      });
    });

    // Analyze recipes
    const results = [];
    for (const recipe of recipes) {
      let canMake = true;
      let maxBatches = Number.MAX_SAFE_INTEGER;
      const missingIngredients = [];

      for (const ingredient of recipe.ingredients) {
        let invKey: string | null = null;
        let name = 'Unknown';
        if (ingredient.rawMaterialId) {
          invKey = `RAW:${ingredient.rawMaterialId}`;
          name = ingredient.rawMaterial?.name || 'Unknown Material';
        } else if (ingredient.finishedProductId) {
          invKey = `FINISHED:${ingredient.finishedProductId}`;
          name = ingredient.finishedProduct?.name || 'Unknown Finished Product';
        } else {
          canMake = false;
          continue;
        }
        const material = inventory.get(invKey);
        const available = material ? material.quantity : 0;
        if (available < ingredient.quantity) {
          canMake = false;
          missingIngredients.push({
            name,
            needed: ingredient.quantity,
            available: available,
            shortage: ingredient.quantity - available,
            reason: material?.expired ? 'expired' : material?.contaminated ? 'contaminated' : 'insufficient'
          });
        } else {
          const batchesForIngredient = Math.floor(available / ingredient.quantity);
          maxBatches = Math.min(maxBatches, batchesForIngredient);
        }
      }

      if (maxBatches === Number.MAX_SAFE_INTEGER) {
        maxBatches = 0;
      }

      results.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        category: recipe.category?.name || 'Uncategorized',
        yieldQuantity: recipe.yieldQuantity || 0,
        yieldUnit: recipe.yieldUnit || '',
        canMake: canMake,
        maxBatches: canMake ? maxBatches : 0,
        emoji: recipe.emoji || '🍞',
        imageUrl: recipe.imageUrl,
        difficulty: recipe.difficulty || 'MEDIUM',
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        estimatedTotalTime: recipe.estimatedTotalTime,
        estimatedCost: recipe.estimatedCost,
        description: recipe.description,
        missingIngredients: missingIngredients
      });
    }

    const canMakeCount = results.filter(r => r.canMake).length;

    console.log(`Analysis complete: Can make ${canMakeCount} out of ${recipes.length} recipes`);

    res.json({
      success: true,
      data: {
        canMakeCount: canMakeCount,
        totalRecipes: recipes.length,
        recipes: results
      }
    });
  } catch (error: any) {
    console.error('❌ Error in "What can I make" analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze recipes',
      error: error.message
    });
  }
};

// Update estimated cost for a recipe
export const updateRecipeCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updatedCost = await recipeCostService.updateRecipeEstimatedCost(id);

    res.json({
      success: true,
      data: { estimatedCost: updatedCost },
      message: 'Recipe cost updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating recipe cost:', error);

    if (error.message.includes('Recipe not found')) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update recipe cost'
    });
  }
};

// Batch update all recipe costs
export const updateAllRecipeCosts = async (req: Request, res: Response) => {
  try {
    const result = await recipeCostService.updateAllRecipeCosts();

    res.json({
      success: true,
      data: result,
      message: `Updated costs for ${result.updated} recipes`
    });
  } catch (error: any) {
    console.error('Error updating all recipe costs:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to update recipe costs'
    });
  }
};
