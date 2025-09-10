import { Request, Response } from 'express';
import { PrismaClient, ProductionStatus, ProductionStepStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Get all production runs with complete details
export const getProductionRuns = async (req: Request, res: Response) => {
    try {
        const { status, recipeId, limit = '50', offset = '0' } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (recipeId) where.recipeId = recipeId;

        const productionRuns = await prisma.productionRun.findMany({
            where,
            include: {
                recipe: {
                    include: {
                        category: true
                    }
                },
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            },
            orderBy: {
                startedAt: 'desc'
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        const total = await prisma.productionRun.count({ where });

        res.json({
            success: true,
            data: productionRuns,
            meta: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            }
        });
    } catch (error) {
        console.error('Error fetching production runs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch production runs'
        });
    }
};

// Create new production run
export const createProductionRun = async (req: Request, res: Response) => {
    try {
        const {
            name,
            recipeId,
            targetQuantity,
            targetUnit,
            notes,
            customSteps
        } = req.body;

        // Validate required fields
        if (!name || !recipeId || !targetQuantity || !targetUnit) {
            return res.status(400).json({
                success: false,
                error: 'Name, recipe ID, target quantity, and target unit are required'
            });
        }

        // Get recipe to validate it exists
        const recipe = await prisma.recipe.findUnique({
            where: { id: recipeId }
        });

        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }

        // Determine steps to create
        let stepsToCreate;

        if (customSteps && Array.isArray(customSteps) && customSteps.length > 0) {
            // Use custom steps provided by frontend
            stepsToCreate = customSteps.map((step: any, index: number) => ({
                name: step.name,
                description: step.description || '',
                stepOrder: step.stepOrder || index + 1,
                estimatedMinutes: step.estimatedMinutes || 30,
                status: ProductionStepStatus.PENDING
            }));
        } else {
            // Use default steps as fallback
            stepsToCreate = [
                {
                    name: 'Preparation',
                    description: 'Gather and prepare all ingredients and equipment',
                    stepOrder: 1,
                    estimatedMinutes: Math.ceil((recipe.prepTime || 30) * 0.3),
                    status: ProductionStepStatus.PENDING
                },
                {
                    name: 'Production',
                    description: 'Execute recipe production steps',
                    stepOrder: 2,
                    estimatedMinutes: recipe.prepTime || 30,
                    status: ProductionStepStatus.PENDING
                },
                {
                    name: 'Quality Check',
                    description: 'Perform quality control checks',
                    stepOrder: 3,
                    estimatedMinutes: 15,
                    status: ProductionStepStatus.PENDING
                },
                {
                    name: 'Packaging',
                    description: 'Package finished products',
                    stepOrder: 4,
                    estimatedMinutes: Math.ceil((recipe.prepTime || 30) * 0.2),
                    status: ProductionStepStatus.PENDING
                }
            ];
        }

        // Create production run with steps
        const productionRun = await prisma.productionRun.create({
            data: {
                name,
                recipeId,
                targetQuantity,
                targetUnit,
                notes,
                status: ProductionStatus.PLANNED,
                steps: {
                    create: stepsToCreate
                }
            },
            include: {
                recipe: {
                    include: {
                        category: true
                    }
                },
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: productionRun
        });
    } catch (error) {
        console.error('Error creating production run:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create production run'
        });
    }
};

// Get production runs for dashboard
export const getDashboardProductionRuns = async (req: Request, res: Response) => {
    try {
        const activeRuns = await prisma.productionRun.findMany({
            where: {
                status: { in: [ProductionStatus.PLANNED, ProductionStatus.IN_PROGRESS] }
            },
            include: {
                recipe: true,
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            },
            orderBy: [
                { status: 'asc' },
                { startedAt: 'asc' }
            ],
            take: 10
        });

        res.json({
            success: true,
            data: activeRuns
        });
    } catch (error) {
        console.error('Error fetching dashboard production runs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard production runs'
        });
    }
};

// Get production run by ID
export const getProductionRunById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const productionRun = await prisma.productionRun.findUnique({
            where: { id },
            include: {
                recipe: true,
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            }
        });

        if (!productionRun) {
            return res.status(404).json({
                success: false,
                message: 'Production run not found'
            });
        }

        res.json({
            success: true,
            data: productionRun
        });
    } catch (error) {
        console.error('Error fetching production run:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update production run
export const updateProductionRun = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, targetQuantity, targetUnit, status, notes } = req.body;

        const updatedRun = await prisma.productionRun.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(targetQuantity && { targetQuantity }),
                ...(targetUnit && { targetUnit }),
                ...(status && { status }),
                ...(notes && { notes }),
                updatedAt: new Date()
            },
            include: {
                recipe: true,
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            }
        });

        res.json({
            success: true,
            data: updatedRun
        });
    } catch (error) {
        console.error('Error updating production run:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete production run
export const deleteProductionRun = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Delete all steps first
        await prisma.productionStep.deleteMany({
            where: { productionRunId: id }
        });

        // Delete the production run
        await prisma.productionRun.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Production run deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting production run:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
