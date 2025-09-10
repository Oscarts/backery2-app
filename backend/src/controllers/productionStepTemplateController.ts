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

        // For now, we'll return default steps but this could be extended to store custom templates per recipe
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
