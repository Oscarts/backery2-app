import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
      estimatedTotalTime
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
          version: 1 // Default version
        }
      });

      // Create ingredients if provided
      if (ingredients && ingredients.length > 0) {
        // Validate each ingredient - exactly one of rawMaterialId or finishedProductId
        for (const ing of ingredients) {
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
      estimatedTotalTime
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

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
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

    const recipe = await prisma.recipe.findUnique({
      where: { id },
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
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }

    let totalCost = 0;
    const ingredientCosts = [];

    // Import the unit conversion utilities
    const { convertUnits, areUnitsCompatible } = await import('../utils/unitConversion');

    for (const ingredient of recipe.ingredients) {
      let unitCost = 0;
      let ingredientName = '';
      let availableQuantity = 0;
      let sourceUnit = '';
      let ingredientType: 'RAW' | 'FINISHED' = 'RAW';

      if (ingredient.rawMaterial) {
        ingredientType = 'RAW';
        unitCost = ingredient.rawMaterial.unitPrice;
        ingredientName = ingredient.rawMaterial.name;
        availableQuantity = ingredient.rawMaterial.quantity;
        sourceUnit = ingredient.rawMaterial.unit;
      } else if (ingredient.finishedProduct) {
        ingredientType = 'FINISHED';
        ingredientName = ingredient.finishedProduct.name;
        // Derive unit cost from costToProduce / quantity (fallback 0)
        const fpQty = ingredient.finishedProduct.quantity || 0;
        const fpCost = ingredient.finishedProduct.costToProduce || 0;
        unitCost = fpQty > 0 ? fpCost / fpQty : 0;
        availableQuantity = ingredient.finishedProduct.quantity || 0;
        sourceUnit = ingredient.finishedProduct.unit;
      } else {
        continue; // skip invalid
      }

      // Check if units need conversion
      let convertedQuantity = availableQuantity;
      if (sourceUnit !== ingredient.unit && sourceUnit && ingredient.unit) {
        if (areUnitsCompatible(sourceUnit, ingredient.unit)) {
          const converted = convertUnits(availableQuantity, sourceUnit, ingredient.unit);
          if (converted !== null) {
            convertedQuantity = converted;

            // We also need to adjust the unit cost to match the new unit
            unitCost = unitCost * (convertUnits(1, ingredient.unit, sourceUnit) || 1);
          }
        }
      }

      const ingredientTotalCost = unitCost * ingredient.quantity;
      totalCost += ingredientTotalCost;

      ingredientCosts.push({
        ingredientId: ingredient.id,
        name: ingredientName,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        unitCost,
        totalCost: ingredientTotalCost,
        availableQuantity: convertedQuantity,
        canMake: convertedQuantity >= ingredient.quantity,
        type: ingredientType
      });
    }

    const costPerUnit = recipe.yieldQuantity > 0 ? totalCost / recipe.yieldQuantity : 0;

    res.json({
      success: true,
      data: {
        recipeId: recipe.id,
        recipeName: recipe.name,
        yieldQuantity: recipe.yieldQuantity,
        yieldUnit: recipe.yieldUnit,
        totalCost,
        costPerUnit,
        ingredientCosts,
        canMakeRecipe: ingredientCosts.every(ing => ing.canMake)
      }
    });
  } catch (error) {
    console.error('Error calculating recipe cost:', error);
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
        difficulty: recipe.difficulty || 'MEDIUM',
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
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
