import { Request, Response } from 'express';
import { PrismaClient, ProductionStatus, ProductionStepStatus } from '@prisma/client';
import ProductionCompletionService, { ProductionCompletionService as ProductionCompletionServiceNamed, createProductionCompletionService } from '../services/productionCompletionService';
import { InventoryAllocationService } from '../services/inventoryAllocationService';

const prisma = new PrismaClient();
// Support either named or default export depending on transpilation
const productionCompletionService = createProductionCompletionService();
const inventoryAllocationService = new InventoryAllocationService();

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
            // Validate custom steps and filter out invalid ones
            const validCustomSteps = customSteps.filter((step: any) => {
                return step.name && typeof step.name === 'string' && step.name.trim().length > 0;
            });

            if (validCustomSteps.length > 0) {
                // Use valid custom steps provided by frontend
                stepsToCreate = validCustomSteps.map((step: any, index: number) => ({
                    name: step.name.trim(),
                    description: step.description || '',
                    stepOrder: step.stepOrder || index + 1,
                    estimatedMinutes: step.estimatedMinutes || 30,
                    status: ProductionStepStatus.PENDING
                }));
            } else {
                // No valid custom steps, fall back to defaults
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

        // Auto-allocate materials for the production run
        console.log('🔄 Auto-allocating materials for new production run');
        try {
            const productionMultiplier = targetQuantity / (recipe.yieldQuantity || 1);
            const allocations = await inventoryAllocationService.allocateIngredients(
                productionRun.id,
                recipeId,
                productionMultiplier
            );
            console.log(`✓ Allocated ${allocations.length} materials for production run`);
        } catch (allocError) {
            console.warn('⚠️ Material allocation failed during creation:', allocError);
            // Continue - production run is created, allocation can be done later
        }

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
        // Active includes both PLANNED and IN_PROGRESS runs
        const [activeCount, onHoldCount, completedTodayCount] = await Promise.all([
            prisma.productionRun.count({
                where: { 
                    status: { 
                        in: [ProductionStatus.PLANNED, ProductionStatus.IN_PROGRESS] 
                    }
                }
            }),
            prisma.productionRun.count({
                where: { status: ProductionStatus.ON_HOLD }
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

        // Get total target quantity from all non-completed, non-cancelled productions
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
                planned: 0, // Deprecated - merged into active
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
                finishedProduct = (completionResult as any).finishedProduct;
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
                const updatedRun = (completionResult as any).productionRun;
                
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
                
            } catch (completionError: any) {
                console.error('❌ Error creating finished product during manual completion:', completionError);
                fs.appendFileSync('/tmp/production-debug.log', 
                    `${new Date().toISOString()} ERROR: ${completionError.message || completionError}\n`
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

// Allocate materials for production run
export const allocateProductionMaterials = async (req: Request, res: Response) => {
    try {
        const { productionRunId } = req.params;
        const { productionMultiplier = 1 } = req.body;

        console.log(`🔄 Allocating materials for production run: ${productionRunId}`);

        // Get production run details
        const productionRun = await prisma.productionRun.findUnique({
            where: { id: productionRunId },
            include: { recipe: true }
        });

        if (!productionRun) {
            return res.status(404).json({
                success: false,
                error: 'Production run not found'
            });
        }

        // Check if already allocated
        const existingAllocations = await prisma.productionAllocation.findMany({
            where: { productionRunId }
        });

        if (existingAllocations.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Materials already allocated for this production run'
            });
        }

        // Allocate materials
        const allocations = await inventoryAllocationService.allocateIngredients(
            productionRunId,
            productionRun.recipeId,
            productionMultiplier
        );

        res.json({
            success: true,
            data: {
                productionRunId,
                allocations
            },
            message: `Successfully allocated ${allocations.length} materials for production`
        });

    } catch (error) {
        console.error('Error allocating production materials:', error);
        res.status(500).json({
            success: false,
            error: (error as any).message || 'Failed to allocate materials'
        });
    }
};

// Get material usage for a production run
export const getProductionMaterials = async (req: Request, res: Response) => {
    try {
        const { productionRunId } = req.params;

        console.log(`📊 Getting material usage for production run: ${productionRunId}`);

        // Get material usage details
        const materials = await inventoryAllocationService.getMaterialUsage(productionRunId);
        
        // Get cost breakdown
        const costBreakdown = await inventoryAllocationService.calculateProductionCost(productionRunId);

        res.json({
            success: true,
            data: {
                productionRunId,
                materials,
                costBreakdown
            },
            message: 'Material usage retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting production materials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve material usage'
        });
    }
};

// Record material consumption during production
export const recordMaterialConsumption = async (req: Request, res: Response) => {
    try {
        const { productionRunId } = req.params;
        const { consumptions } = req.body;

        console.log(`📝 Recording material consumption for production run: ${productionRunId}`);

        if (!consumptions || !Array.isArray(consumptions)) {
            return res.status(400).json({
                success: false,
                error: 'Consumptions array is required'
            });
        }

        // Record the consumption
        await inventoryAllocationService.recordMaterialConsumption(consumptions);

        // Get updated material usage
        const updatedMaterials = await inventoryAllocationService.getMaterialUsage(productionRunId);
        const costBreakdown = await inventoryAllocationService.calculateProductionCost(productionRunId);

        res.json({
            success: true,
            data: {
                productionRunId,
                materials: updatedMaterials,
                costBreakdown
            },
            message: `Successfully recorded consumption for ${consumptions.length} materials`
        });

    } catch (error) {
        console.error('Error recording material consumption:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record material consumption'
        });
    }
};

// Get detailed material usage for finished product traceability
export const getFinishedProductMaterials = async (req: Request, res: Response) => {
    try {
        const { finishedProductId } = req.params;

        console.log(`🔍 Getting material traceability for finished product: ${finishedProductId}`);

        // Get finished product with linked production run
        const finishedProduct = await prisma.finishedProduct.findUnique({
            where: { id: finishedProductId },
            include: {
                productionRun: {
                    include: {
                        recipe: true
                    }
                }
            }
        });

        if (!finishedProduct) {
            return res.status(404).json({
                success: false,
                error: 'Finished product not found'
            });
        }

        if (!finishedProduct.productionRun) {
            return res.status(404).json({
                success: false,
                error: 'No production run linked to this finished product'
            });
        }

        // Get material usage
        const materials = await inventoryAllocationService.getMaterialUsage(finishedProduct.productionRun.id);
        const costBreakdown = await inventoryAllocationService.calculateProductionCost(finishedProduct.productionRun.id);

        res.json({
            success: true,
            data: {
                finishedProduct: {
                    id: finishedProduct.id,
                    name: finishedProduct.name,
                    batchNumber: finishedProduct.batchNumber,
                    productionDate: finishedProduct.productionDate,
                    quantity: finishedProduct.quantity,
                    unit: finishedProduct.unit,
                    costToProduce: finishedProduct.costToProduce,
                    sku: finishedProduct.sku
                },
                productionRun: {
                    id: finishedProduct.productionRun.id,
                    name: finishedProduct.productionRun.name,
                    recipe: finishedProduct.productionRun.recipe,
                    completedAt: finishedProduct.productionRun.completedAt
                },
                materials,
                costBreakdown,
                summary: {
                    totalMaterialsUsed: materials.length,
                    totalMaterialCost: costBreakdown.materialCost,
                    totalProductionCost: costBreakdown.totalCost,
                    costPerUnit: finishedProduct.quantity > 0 ? costBreakdown.totalCost / finishedProduct.quantity : 0
                }
            },
            message: 'Material traceability retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting finished product materials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve material traceability'
        });
    }
};
