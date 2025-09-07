import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProductionCompletionService } from '../services/productionCompletionService';

const prisma = new PrismaClient();
const completionService = new ProductionCompletionService();

// Get all steps for a production run
export const getProductionSteps = async (req: Request, res: Response) => {
    try {
        const { productionRunId } = req.params;

        const steps = await prisma.productionStep.findMany({
            where: { productionRunId },
            include: {
                productionRun: true
            },
            orderBy: { stepOrder: 'asc' }
        });

        res.json({
            success: true,
            data: steps
        });
    } catch (error) {
        console.error('Error fetching production steps:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch production steps'
        });
    }
};

// Get step by ID
export const getProductionStepById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const step = await prisma.productionStep.findUnique({
            where: { id },
            include: {
                productionRun: {
                    include: {
                        recipe: true
                    }
                }
            }
        });

        if (!step) {
            return res.status(404).json({
                success: false,
                error: 'Production step not found'
            });
        }

        res.json({
            success: true,
            data: step
        });
    } catch (error) {
        console.error('Error fetching production step:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch production step'
        });
    }
};

// Update production step status and details
export const updateProductionStep = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            status,
            startedAt,
            completedAt,
            notes,
            actualMinutes
        } = req.body;

        const updateData: any = {};

        if (status) updateData.status = status;
        if (startedAt) updateData.startedAt = new Date(startedAt);
        if (completedAt) updateData.completedAt = new Date(completedAt);
        if (notes !== undefined) updateData.notes = notes;
        if (actualMinutes) updateData.actualMinutes = actualMinutes;

        // If marking as completed, set end time if not provided
        if (status === 'COMPLETED' && !completedAt && !updateData.completedAt) {
            updateData.completedAt = new Date();
        }

        // If starting step, set start time if not provided
        if (status === 'IN_PROGRESS' && !startedAt && !updateData.startedAt) {
            updateData.startedAt = new Date();
        }

        // Calculate actual duration if both start and end times are available
        if (updateData.startedAt && updateData.completedAt) {
            updateData.actualMinutes = Math.ceil(
                (updateData.completedAt.getTime() - updateData.startedAt.getTime()) / (1000 * 60)
            );
        }

        const updatedStep = await prisma.productionStep.update({
            where: { id },
            data: updateData,
            include: {
                productionRun: {
                    include: {
                        recipe: true
                    }
                }
            }
        });

        // If this step is completed, check if we should auto-start the next step
        if (status === 'COMPLETED') {
            const nextStep = await prisma.productionStep.findFirst({
                where: {
                    productionRunId: updatedStep.productionRunId,
                    stepOrder: { gt: updatedStep.stepOrder },
                    status: 'PENDING'
                },
                orderBy: { stepOrder: 'asc' }
            });

            if (nextStep) {
                await prisma.productionStep.update({
                    where: { id: nextStep.id },
                    data: { status: 'IN_PROGRESS', startedAt: new Date() }
                });
            } else {
                // No more steps, complete production run and create finished products
                try {
                    console.log('🏁 Last step completed, completing production run...');
                    const completionResult = await completionService.completeProductionRun(
                        updatedStep.productionRunId
                    );
                    if (completionResult && 'finishedProduct' in completionResult) {
                        console.log('✅ Production completed successfully:', completionResult.finishedProduct.name);
                    } else {
                        console.log('✅ Production completed successfully');
                    }
                } catch (error) {
                    console.error('❌ Error completing production run:', error);
                    // Still mark production as completed even if finished product creation fails
                    await prisma.productionRun.update({
                        where: { id: updatedStep.productionRunId },
                        data: {
                            status: 'COMPLETED',
                            completedAt: new Date()
                        }
                    });
                }
            }
        }

        res.json({
            success: true,
            data: updatedStep
        });
    } catch (error) {
        console.error('Error updating production step:', error);
        if ((error as any).code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Production step not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update production step'
        });
    }
};

// Start production step
export const startProductionStep = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const step = await prisma.productionStep.findUnique({
            where: { id },
            include: { productionRun: true }
        });

        if (!step) {
            return res.status(404).json({
                success: false,
                error: 'Production step not found'
            });
        }

        if (step.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: 'Step is not in pending status'
            });
        }

        // Check if previous steps are completed
        const incompletePreviousSteps = await prisma.productionStep.count({
            where: {
                productionRunId: step.productionRunId,
                stepOrder: { lt: step.stepOrder },
                status: { notIn: ['COMPLETED', 'SKIPPED'] }
            }
        });

        if (incompletePreviousSteps > 0) {
            return res.status(400).json({
                success: false,
                error: 'Previous steps must be completed first'
            });
        }

        // Start the step
        const updatedStep = await prisma.productionStep.update({
            where: { id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
            },
            include: {
                productionRun: {
                    include: {
                        recipe: true
                    }
                }
            }
        });

        // If this is the first step, update production run status
        if (step.stepOrder === 1) {
            await prisma.productionRun.update({
                where: { id: step.productionRunId },
                data: {
                    status: 'IN_PROGRESS'
                }
            });
        }

        res.json({
            success: true,
            data: updatedStep
        });
    } catch (error) {
        console.error('Error starting production step:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start production step'
        });
    }
};

// Complete production step
export const completeProductionStep = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const updatedStep = await prisma.productionStep.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                notes
            },
            include: {
                productionRun: true
            }
        });

        res.json({
            success: true,
            data: updatedStep
        });
    } catch (error) {
        console.error('Error completing production step:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete production step'
        });
    }
};
