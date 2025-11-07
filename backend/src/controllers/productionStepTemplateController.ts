import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get default production step templates
export const getDefaultStepTemplates = async (req: Request, res: Response) => {
    try {
        const defaultSteps = [
            {
                id: 'prep',
                name: 'Preparation',
                description: 'Gather and prepare all ingredients',
                estimatedMinutes: 15,
                stepOrder: 1,
                isDefault: true
            },
            {
                id: 'production',
                name: 'Production',
                description: 'Mix, bake, or process according to recipe',
                estimatedMinutes: 60,
                stepOrder: 2,
                isDefault: true
            },
            {
                id: 'quality',
                name: 'Quality Check',
                description: 'Inspect product quality and standards',
                estimatedMinutes: 10,
                stepOrder: 3,
                isDefault: true
            },
            {
                id: 'packaging',
                name: 'Packaging',
                description: 'Package finished products for inventory',
                estimatedMinutes: 15,
                stepOrder: 4,
                isDefault: true
            }
        ];

        res.json({
            success: true,
            data: defaultSteps
        });
    } catch (error) {
        console.error('Error getting default step templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get default step templates'
        });
    }
};

// Get recipe-specific step templates
export const getRecipeStepTemplates = async (req: Request, res: Response) => {
    try {
        const { recipeId } = req.params;

        // Fetch the recipe to get actual prep and cook times
        const recipe = await prisma.recipe.findUnique({
            where: { id: recipeId }
        });

        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }

        // Calculate step durations based on actual recipe times
        const prepTime = recipe.prepTime || 30; // Default 30 min if not set
        const cookTime = recipe.cookTime || 60; // Default 60 min if not set
        const totalTime = prepTime + cookTime;

        // Dynamic step times based on recipe
        const prepDuration = Math.max(10, Math.ceil(prepTime * 0.5)); // 50% of prep time for gathering
        const productionDuration = Math.max(15, cookTime); // Full cook time
        const qualityDuration = Math.max(5, Math.ceil(totalTime * 0.05)); // 5% of total time
        const packagingDuration = Math.max(10, Math.ceil(totalTime * 0.1)); // 10% of total time

        const recipeSteps = [
            {
                id: 'prep',
                name: 'Preparation',
                description: 'Gather and prepare all ingredients and equipment',
                estimatedMinutes: prepDuration,
                stepOrder: 1,
                isDefault: true
            },
            {
                id: 'production',
                name: 'Production',
                description: `Mix, bake, or process according to ${recipe.name} recipe`,
                estimatedMinutes: productionDuration,
                stepOrder: 2,
                isDefault: true
            },
            {
                id: 'quality',
                name: 'Quality Check',
                description: `Inspect ${recipe.name} quality and standards`,
                estimatedMinutes: qualityDuration,
                stepOrder: 3,
                isDefault: true
            },
            {
                id: 'packaging',
                name: 'Packaging',
                description: 'Package finished products for inventory',
                estimatedMinutes: packagingDuration,
                stepOrder: 4,
                isDefault: true
            }
        ];

        res.json({
            success: true,
            data: recipeSteps,
            meta: {
                recipeId: recipe.id,
                recipeName: recipe.name,
                totalEstimatedMinutes: prepDuration + productionDuration + qualityDuration + packagingDuration,
                basedOnRecipeTimes: {
                    prepTime: recipe.prepTime,
                    cookTime: recipe.cookTime
                }
            }
        });
    } catch (error) {
        console.error('Error getting recipe step templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recipe step templates'
        });
    }
};

// Create custom production step template
export const createCustomStepTemplate = async (req: Request, res: Response) => {
    try {
        const { name, description, estimatedMinutes, stepOrder } = req.body;

        if (!name || !estimatedMinutes || stepOrder === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Name, estimated minutes, and step order are required'
            });
        }

        const customStep = {
            id: `custom-${Date.now()}`,
            name,
            description: description || '',
            estimatedMinutes: Number(estimatedMinutes),
            stepOrder: Number(stepOrder),
            isDefault: false,
            isCustom: true
        };

        res.status(201).json({
            success: true,
            data: customStep
        });
    } catch (error) {
        console.error('Error creating custom step template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create custom step template'
        });
    }
};
