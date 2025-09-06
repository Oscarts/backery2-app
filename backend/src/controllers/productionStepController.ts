import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
                },
                qualityChecks: true
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
            actualStartTime,
            actualEndTime,
            notes,
            qualityNotes,
            actualDuration
        } = req.body;

        const updateData: any = {};

        if (status) updateData.status = status;
        if (actualStartTime) updateData.actualStartTime = new Date(actualStartTime);
        if (actualEndTime) updateData.actualEndTime = new Date(actualEndTime);
        if (notes !== undefined) updateData.notes = notes;
        if (qualityNotes !== undefined) updateData.qualityNotes = qualityNotes;
        if (actualDuration) updateData.actualDuration = actualDuration;

        // If marking as completed, set end time if not provided
        if (status === 'COMPLETED' && !actualEndTime && !updateData.actualEndTime) {
            updateData.actualEndTime = new Date();
        }

        // If starting step, set start time if not provided
        if (status === 'IN_PROGRESS' && !actualStartTime && !updateData.actualStartTime) {
            updateData.actualStartTime = new Date();
        }

        // Calculate actual duration if both start and end times are available
        if (updateData.actualStartTime && updateData.actualEndTime) {
            updateData.actualDuration = Math.ceil(
                (updateData.actualEndTime.getTime() - updateData.actualStartTime.getTime()) / (1000 * 60)
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
                },
                qualityChecks: true
            }
        });

        // If this step is completed, check if we should auto-start the next step
        if (status === 'COMPLETED') {
            const nextStep = await prisma.productionStep.findFirst({
                where: {
                    productionRunId: updatedStep.productionRunId,
                    ordinalPosition: { gt: updatedStep.ordinalPosition },
                    status: 'PENDING'
                },
                orderBy: { ordinalPosition: 'asc' }
            });

            if (nextStep) {
                await prisma.productionStep.update({
                    where: { id: nextStep.id },
                    data: { status: 'IN_PROGRESS', actualStartTime: new Date() }
                });
            } else {
                // No more steps, mark production run as completed
                await prisma.productionRun.update({
                    where: { id: updatedStep.productionRunId },
                    data: {
                        status: 'COMPLETED',
                        actualEndTime: new Date()
                    }
                });
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
                ordinalPosition: { lt: step.ordinalPosition },
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
                actualStartTime: new Date()
            },
            include: {
                productionRun: {
                    include: {
                        recipe: true
                    }
                },
                qualityChecks: true
            }
        });

        // If this is the first step, update production run status
        if (step.ordinalPosition === 1) {
            await prisma.productionRun.update({
                where: { id: step.productionRunId },
                data: {
                    status: 'IN_PROGRESS',
                    actualStartTime: new Date()
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
        const { notes, qualityNotes, qualityCheckPassed = true } = req.body;

        const updatedStep = await prisma.productionStep.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                actualEndTime: new Date(),
                notes,
                qualityNotes
            },
            include: {
                productionRun: true,
                qualityChecks: true
            }
        });

        // Create quality check record if this is a quality step
        if (updatedStep.name.toLowerCase().includes('quality')) {
            await prisma.qualityCheck.create({
                data: {
                    productionStepId: id,
                    checkType: 'STEP_COMPLETION',
                    result: qualityCheckPassed ? 'PASS' : 'FAIL',
                    notes: qualityNotes,
                    checkedAt: new Date()
                }
            });
        }

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
