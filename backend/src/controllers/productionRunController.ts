import { Request, Response } from 'express';
import { PrismaClient, ProductionStatus, ProductionStepStatus } from '@prisma/client';
import { ProductionCompletionService } from '../services/productionCompletionService';

const prisma = new PrismaClient();
const productionCompletionService = new ProductionCompletionService();

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
                status: { in: [ProductionStatus.PLANNED, ProductionStatus.IN_PROGRESS, ProductionStatus.ON_HOLD] }
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

// Get production statistics for dashboard indicators
export const getProductionStats = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Get counts for each status
        const [activeCount, onHoldCount, plannedCount, completedTodayCount] = await Promise.all([
            prisma.productionRun.count({
                where: { status: ProductionStatus.IN_PROGRESS }
            }),
            prisma.productionRun.count({
                where: { status: ProductionStatus.ON_HOLD }
            }),
            prisma.productionRun.count({
                where: { status: ProductionStatus.PLANNED }
            }),
            prisma.productionRun.count({
                where: {
                    status: ProductionStatus.COMPLETED,
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            })
        ]);

        // Get total target quantity from active productions
        const activeProductions = await prisma.productionRun.findMany({
            where: {
                status: { in: [ProductionStatus.PLANNED, ProductionStatus.IN_PROGRESS, ProductionStatus.ON_HOLD] }
            },
            select: {
                targetQuantity: true
            }
        });

        const totalTargetQuantity = activeProductions.reduce((sum, run) => sum + (run.targetQuantity || 0), 0);

        res.json({
            success: true,
            data: {
                active: activeCount,
                onHold: onHoldCount,
                planned: plannedCount,
                completedToday: completedTodayCount,
                totalTargetQuantity: totalTargetQuantity
            }
        });
    } catch (error) {
        console.error('Error fetching production statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch production statistics'
        });
    }
};

// Get completed production runs for history
export const getCompletedProductionRuns = async (req: Request, res: Response) => {
    try {
        const { limit = '20', offset = '0' } = req.query;

        const completedRuns = await prisma.productionRun.findMany({
            where: {
                status: ProductionStatus.COMPLETED
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
            },
            orderBy: {
                completedAt: 'desc'
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        const total = await prisma.productionRun.count({
            where: { status: ProductionStatus.COMPLETED }
        });

        res.json({
            success: true,
            data: completedRuns,
            meta: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            }
        });
    } catch (error) {
        console.error('Error fetching completed production runs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch completed production runs'
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

        // First, get the current production run to check its status
        const currentRun = await prisma.productionRun.findUnique({
            where: { id },
            include: {
                recipe: true,
                steps: true
            }
        });

        if (!currentRun) {
            return res.status(404).json({
                success: false,
                message: 'Production run not found'
            });
        }

        // Check if this is a completion (status changed to COMPLETED)
        const isCompletion = status === 'COMPLETED' && currentRun.status !== 'COMPLETED';
        let productionCompleted = isCompletion;
        let finishedProduct = null;

        console.log(`🔍 DEBUG: isCompletion=${isCompletion}, status=${status}, currentRun.status=${currentRun.status}`);
        
        // Write to debug file
        const fs = require('fs');
        fs.appendFileSync('/tmp/production-debug.log', 
            `${new Date().toISOString()} DEBUG: isCompletion=${isCompletion}, status=${status}, currentRun.status=${currentRun.status}\n`
        );

        if (isCompletion) {
            console.log('🎉 Production run manually completed via finish button!');
            fs.appendFileSync('/tmp/production-debug.log', 
                `${new Date().toISOString()} Production completion triggered!\n`
            );
            
            try {
                // Call the ProductionCompletionService BEFORE updating status
                console.log(`📞 Calling productionCompletionService.completeProductionRun(${id}, ${targetQuantity || currentRun.targetQuantity})`);
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} Calling ProductionCompletionService...\n`
                );
                const completionResult = await productionCompletionService.completeProductionRun(
                    id, 
                    targetQuantity || currentRun.targetQuantity
                );
                console.log('✅ ProductionCompletionService call succeeded:', completionResult);
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} Service returned: ${JSON.stringify(completionResult)}\n`
                );
                finishedProduct = completionResult.finishedProduct;
                if (finishedProduct) {
                    console.log(`✅ Finished product created: ${finishedProduct.name}`);
                    fs.appendFileSync('/tmp/production-debug.log', 
                        `${new Date().toISOString()} SUCCESS: Finished product created: ${finishedProduct.name}\n`
                    );
                } else {
                    fs.appendFileSync('/tmp/production-debug.log', 
                        `${new Date().toISOString()} WARNING: finishedProduct is undefined\n`
                    );
                }
                
                // The service already updated the status to COMPLETED, so don't update it again
                const updatedRun = completionResult.productionRun;
                
                res.json({
                    success: true,
                    data: {
                        ...updatedRun,
                        productionCompleted,
                        finishedProduct
                    },
                    message: 'Production run completed successfully'
                });
                return;
                
            } catch (completionError) {
                console.error('❌ Error creating finished product during manual completion:', completionError);
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} ERROR: ${completionError.message}\n`
                );
                // Fall through to regular update if completion fails
            }
        }

        // Regular update (not a completion or completion failed)
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
            data: {
                ...updatedRun,
                productionCompleted: false
            },
            message: 'Production run updated successfully'
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
