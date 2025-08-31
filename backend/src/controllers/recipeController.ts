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
            intermediateProduct: {
              include: {
                category: true
              }
            }
          }
        },
        intermediateProducts: true
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
            intermediateProduct: {
              include: {
                category: true
              }
            }
          }
        },
        intermediateProducts: true
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
      isActive
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Recipe name is required'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    // Create recipe with ingredients in a transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          name,
          description: description || '',
          categoryId,
          yieldQuantity: Number(yieldQuantity) || 1,
          yieldUnit: yieldUnit || '',
          prepTime: prepTime ? Number(prepTime) : null,
          cookTime: cookTime ? Number(cookTime) : null,
          instructions: instructions || [],
          isActive: isActive !== undefined ? isActive : true,
          version: 1 // Default version
        }
      });

      // Create ingredients if provided
      if (ingredients && ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ingredient: any) => ({
            recipeId: newRecipe.id,
            rawMaterialId: ingredient.rawMaterialId || null,
            intermediateProductId: ingredient.intermediateProductId || null,
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
              intermediateProduct: {
                include: {
                  category: true
                }
              }
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
      isActive
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

        // Create new ingredients
        if (ingredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: ingredients.map((ingredient: any) => ({
              recipeId: id,
              rawMaterialId: ingredient.rawMaterialId || null,
              intermediateProductId: ingredient.intermediateProductId || null,
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
              intermediateProduct: {
                include: {
                  category: true
                }
              }
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

    // Check if recipe is being used by intermediate products
    const usedByProducts = await prisma.intermediateProduct.findMany({
      where: { recipeId: id }
    });

    if (usedByProducts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete recipe that is being used by intermediate products'
      });
    }

    await prisma.recipe.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
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
            intermediateProduct: true
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

      if (ingredient.rawMaterial) {
        unitCost = ingredient.rawMaterial.unitPrice;
        ingredientName = ingredient.rawMaterial.name;
        availableQuantity = ingredient.rawMaterial.quantity;
        sourceUnit = ingredient.rawMaterial.unit;
      } else if (ingredient.intermediateProduct) {
        // For intermediate products, we use their costToProduce field from the database
        // This is calculated and updated during intermediate product creation/update
        unitCost = ingredient.intermediateProduct.costToProduce || 0;
        ingredientName = ingredient.intermediateProduct.name;
        availableQuantity = ingredient.intermediateProduct.quantity;
        sourceUnit = ingredient.intermediateProduct.unit;
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
        canMake: convertedQuantity >= ingredient.quantity
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
    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      include: {
        category: true,
        ingredients: {
          include: {
            rawMaterial: true,
            intermediateProduct: true
          }
        }
      }
    });

    const analysis = [];

    for (const recipe of recipes) {
      let canMake = true;
      let maxQuantityCanMake = Infinity;
      const missingIngredients = [];

      for (const ingredient of recipe.ingredients) {
        let availableQuantity = 0;
        let ingredientName = '';
        let ingredientUnit = '';
        let sourceUnit = '';

        if (ingredient.rawMaterial) {
          availableQuantity = ingredient.rawMaterial.quantity;
          ingredientName = ingredient.rawMaterial.name;
          sourceUnit = ingredient.rawMaterial.unit;
        } else if (ingredient.intermediateProduct) {
          availableQuantity = ingredient.intermediateProduct.quantity;
          ingredientName = ingredient.intermediateProduct.name;
          sourceUnit = ingredient.intermediateProduct.unit;
        }

        ingredientUnit = ingredient.unit;

        // Import the unit conversion utilities
        const { convertUnits, areUnitsCompatible } = await import('../utils/unitConversion');

        // Check if units need conversion
        let convertedQuantity = availableQuantity;
        if (sourceUnit !== ingredientUnit && sourceUnit && ingredientUnit) {
          if (areUnitsCompatible(sourceUnit, ingredientUnit)) {
            const converted = convertUnits(availableQuantity, sourceUnit, ingredientUnit);
            if (converted !== null) {
              convertedQuantity = converted;
            }
          }
        }

        if (convertedQuantity < ingredient.quantity) {
          canMake = false;
          missingIngredients.push({
            name: ingredientName,
            needed: `${ingredient.quantity} ${ingredientUnit}`,
            available: `${availableQuantity} ${sourceUnit}`,
            shortage: `${ingredient.quantity - convertedQuantity} ${ingredientUnit}`
          });
        } else {
          // Calculate how many complete batches can be made with this ingredient
          const possibleBatches = Math.floor(convertedQuantity / ingredient.quantity);

          // Update the max number of batches that can be made based on the most limiting ingredient
          maxQuantityCanMake = Math.min(maxQuantityCanMake, possibleBatches);
        }
      }

      analysis.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        category: recipe.category.name,
        yieldQuantity: recipe.yieldQuantity,
        yieldUnit: recipe.yieldUnit,
        canMake,
        maxBatches: canMake ? maxQuantityCanMake : 0,
        missingIngredients
      });
    }

    // Sort by canMake status and then by recipe name
    analysis.sort((a, b) => {
      if (a.canMake && !b.canMake) return -1;
      if (!a.canMake && b.canMake) return 1;
      return a.recipeName.localeCompare(b.recipeName);
    });

    res.json({
      success: true,
      data: {
        totalRecipes: recipes.length,
        canMakeCount: analysis.filter(r => r.canMake).length,
        recipes: analysis
      }
    });
  } catch (error) {
    console.error('Error analyzing what can be made:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze what can be made'
    });
  }
};
