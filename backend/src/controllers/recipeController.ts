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

// Create recipe
export const createRecipe = async (req: Request, res: Response) => {
  try {
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
      difficulty
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
          version: 1, // Default version
          emoji: emoji || '🍞', // Default emoji
          difficulty: difficulty || 'MEDIUM'
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
      isActive,
      emoji,
      difficulty
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
        // For intermediate products, calculate a basic cost estimate 
        // TODO: Implement proper cost tracking for intermediate products
        unitCost = 0; // Placeholder until cost tracking is implemented
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
    console.log('📊 Starting What Can I Make analysis');

    // Step 1: Get all recipes with ingredients
    const recipes = await prisma.recipe.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true,
        ingredients: {
          include: {
            rawMaterial: {
              include: {
                category: true
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

    // Get all categories
    const categoriesData = await prisma.category.findMany();

    console.log(`Found ${recipes.length} active recipes`);

    // Quick validation of recipe ingredients
    let hasInvalidIngredient = false;
    for (const recipe of recipes) {
      console.log(`Recipe: ${recipe.name} - Has ${recipe.ingredients.length} ingredients`);

      // Check for ingredients with neither rawMaterialId nor intermediateProductId
      for (const ingredient of recipe.ingredients) {
        if (!ingredient.rawMaterialId && !ingredient.intermediateProductId) {
          console.error(`❌ Invalid ingredient found in recipe ${recipe.name}: Neither rawMaterialId nor intermediateProductId is set`);
          hasInvalidIngredient = true;
        }
      }
    }

    if (hasInvalidIngredient) {
      console.warn('⚠️ Some recipes have invalid ingredients. This may affect results.');
    }

    // Step 2: Get current inventory of raw materials (excluding expired and contaminated)
    const currentDate = new Date();
    const rawMaterials = await prisma.rawMaterial.findMany({
      where: {
        isContaminated: false,
        expirationDate: { gt: currentDate }
      }
    });
    const rawMaterialInventory = new Map();
    rawMaterials.forEach(material => {
      rawMaterialInventory.set(material.id, {
        quantity: material.quantity,
        unit: material.unit,
        isExpired: material.expirationDate <= currentDate,
        isContaminated: material.isContaminated
      });
    });

    console.log(`Found ${rawMaterials.length} available raw materials in inventory (excluding expired/contaminated)`);

    // Step 3: Get current inventory of intermediate products (excluding expired and contaminated)
    const intermediateProducts = await prisma.intermediateProduct.findMany({
      where: {
        contaminated: false,
        expirationDate: { gt: currentDate }
      }
    });
    const intermediateProductInventory = new Map();
    intermediateProducts.forEach(product => {
      intermediateProductInventory.set(product.id, {
        quantity: product.quantity,
        unit: product.unit,
        isExpired: product.expirationDate <= currentDate,
        isContaminated: product.contaminated
      });
    });

    console.log(`Found ${intermediateProducts.length} available intermediate products in inventory (excluding expired/contaminated)`);

    // Step 4: Check which recipes can be made based on inventory
    const canMakeRecipes = [];
    const cannotMakeRecipes = [];

    for (const recipe of recipes) {
      let canMake = true;
      const missingIngredients = [];

      for (const ingredient of recipe.ingredients) {
        // Skip invalid ingredients
        if (!ingredient.rawMaterialId && !ingredient.intermediateProductId) {
          console.warn(`⚠️ Skipping invalid ingredient in recipe ${recipe.name}`);
          continue;
        }

        if (ingredient.rawMaterialId) {
          const material = rawMaterialInventory.get(ingredient.rawMaterialId);

          if (!material || material.quantity < ingredient.quantity) {
            canMake = false;

            const rawMaterial = await prisma.rawMaterial.findUnique({
              where: { id: ingredient.rawMaterialId }
            });

            // Determine the reason for unavailability
            let reason = 'insufficient';
            if (!material) {
              // Check if the material exists but is expired or contaminated
              const allMaterials = await prisma.rawMaterial.findUnique({
                where: { id: ingredient.rawMaterialId }
              });
              if (allMaterials) {
                if (allMaterials.isContaminated) {
                  reason = 'contaminated';
                } else if (allMaterials.expirationDate <= currentDate) {
                  reason = 'expired';
                }
              } else {
                reason = 'not_found';
              }
            }

            missingIngredients.push({
              name: rawMaterial?.name || `Raw Material (${ingredient.rawMaterialId})`,
              required: ingredient.quantity,
              available: material ? material.quantity : 0,
              unit: ingredient.unit,
              reason
            });
          }
        } else if (ingredient.intermediateProductId) {
          const product = intermediateProductInventory.get(ingredient.intermediateProductId);

          if (!product || product.quantity < ingredient.quantity) {
            canMake = false;

            const intermediateProduct = await prisma.intermediateProduct.findUnique({
              where: { id: ingredient.intermediateProductId }
            });

            // Determine the reason for unavailability
            let reason = 'insufficient';
            if (!product) {
              // Check if the product exists but is expired or contaminated
              const allProducts = await prisma.intermediateProduct.findUnique({
                where: { id: ingredient.intermediateProductId }
              });
              if (allProducts) {
                if (allProducts.contaminated) {
                  reason = 'contaminated';
                } else if (allProducts.expirationDate <= currentDate) {
                  reason = 'expired';
                }
              } else {
                reason = 'not_found';
              }
            }

            missingIngredients.push({
              name: intermediateProduct?.name || `Intermediate Product (${ingredient.intermediateProductId})`,
              required: ingredient.quantity,
              available: product ? product.quantity : 0,
              unit: ingredient.unit,
              reason
            });
          }
        }
      }

      // Calculate maximum batches based on ingredient availability
      let maxBatches = 0;
      if (canMake) {
        maxBatches = Number.MAX_SAFE_INTEGER; // Start with infinite, reduce based on limiting ingredient

        for (const ingredient of recipe.ingredients) {
          // Skip invalid ingredients
          if (!ingredient.rawMaterialId && !ingredient.intermediateProductId) {
            continue;
          }

          let availableQuantity = 0;

          if (ingredient.rawMaterialId) {
            const material = rawMaterialInventory.get(ingredient.rawMaterialId);
            availableQuantity = material ? material.quantity : 0;
          } else if (ingredient.intermediateProductId) {
            const product = intermediateProductInventory.get(ingredient.intermediateProductId);
            availableQuantity = product ? product.quantity : 0;
          }

          // Calculate how many batches this ingredient allows
          const batchesForThisIngredient = Math.floor(availableQuantity / ingredient.quantity);
          maxBatches = Math.min(maxBatches, batchesForThisIngredient);
        }

        // If we didn't find any ingredients or maxBatches is still infinite, set to 0
        if (maxBatches === Number.MAX_SAFE_INTEGER || maxBatches < 0) {
          maxBatches = 0;
        }
      }

      // Create a recipe analysis object that matches the frontend's expected structure
      const recipeData = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        category: recipe.category?.name || 'Uncategorized',
        yieldQuantity: recipe.yieldQuantity || 0,
        yieldUnit: recipe.yieldUnit || '',
        canMake: canMake,
        maxBatches: maxBatches,
        missingIngredients: missingIngredients.map(ing => ({
          name: ing.name,
          needed: ing.required,
          available: ing.available,
          shortage: ing.required - ing.available,
          reason: ing.reason || 'insufficient'
        }))
      };

      if (canMake) {
        canMakeRecipes.push(recipeData);
      } else {
        cannotMakeRecipes.push(recipeData);
      }
    }

    // Combine the recipes into a single flat array as expected by the frontend
    const allRecipes = [...canMakeRecipes, ...cannotMakeRecipes];

    console.log(`Analysis complete: Can make ${canMakeRecipes.length} out of ${recipes.length} recipes`);

    // Return the analysis in the format expected by the frontend
    res.json({
      success: true,
      data: {
        canMakeCount: canMakeRecipes.length,
        totalRecipes: recipes.length,
        recipes: allRecipes
      }
    });
  } catch (error: any) {
    console.error('❌ Error in "What can I make" analysis:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to analyze recipes'
    });
  }
};
