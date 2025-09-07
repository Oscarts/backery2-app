import { Request, Response } from 'express';
import { PrismaClient, ProductionStepStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Get production steps for a production run
export const getProductionSteps = async (req: Request, res: Response) => {
  try {
    const { productionRunId } = req.params;
    
    const steps = await prisma.productionStep.findMany({
      where: { productionRunId: productionRunId },
      orderBy: { stepOrder: 'asc' },
      include: {
        productionRun: {
          include: {
            recipe: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: steps,
      message: 'Production steps retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching production steps:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch production steps' 
    });
  }
};

// Get a specific production step
export const getProductionStepById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const step = await prisma.productionStep.findUnique({
      where: { id: id },
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
      data: step,
      message: 'Production step retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching production step:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch production step' 
    });
  }
};

// Update production step
export const updateProductionStep = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      estimatedMinutes,
      status,
      notes,
      temperature,
      equipmentUsed
    } = req.body;

    const updatedStep = await prisma.productionStep.update({
      where: { id: id },
      data: {
        name,
        description,
        estimatedMinutes,
        status,
        notes,
        temperature,
        equipmentUsed,
        updatedAt: new Date()
      },
      include: {
        productionRun: {
          include: {
            recipe: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedStep,
      message: 'Production step updated successfully'
    });
  } catch (error) {
    console.error('Error updating production step:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update production step' 
    });
  }
};

// Start a production step
export const startProductionStep = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if step is already started
    const currentStep = await prisma.productionStep.findUnique({
      where: { id: id }
    });

    if (!currentStep) {
      return res.status(404).json({ 
        success: false,
        error: 'Production step not found' 
      });
    }

    if (currentStep.status === ProductionStepStatus.IN_PROGRESS) {
      return res.status(400).json({ 
        success: false,
        error: 'Production step is already in progress' 
      });
    }

    if (currentStep.status === ProductionStepStatus.COMPLETED) {
      return res.status(400).json({ 
        success: false,
        error: 'Production step is already completed' 
      });
    }

    const updatedStep = await prisma.productionStep.update({
      where: { id: id },
      data: {
        status: ProductionStepStatus.IN_PROGRESS,
        startedAt: new Date(),
        notes: notes || currentStep.notes,
        updatedAt: new Date()
      },
      include: {
        productionRun: {
          include: {
            recipe: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedStep,
      message: 'Production step started successfully'
    });
  } catch (error) {
    console.error('Error starting production step:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start production step' 
    });
  }
};

// Complete a production step
export const completeProductionStep = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      qualityCheckData,
      resourcesConsumed,
      yieldQuantity,
      yieldUnit,
      actualMinutes,
      notes,
      qualityCheckPassed,
      temperature,
      equipmentUsed,
      stepPhotos
    } = req.body;

    const currentStep = await prisma.productionStep.findUnique({
      where: { id: id },
      include: {
        productionRun: {
          include: {
            recipe: true,
            steps: true
          }
        }
      }
    });

    if (!currentStep) {
      return res.status(404).json({ 
        success: false,
        error: 'Production step not found' 
      });
    }

    if (currentStep.status !== ProductionStepStatus.IN_PROGRESS) {
      return res.status(400).json({ 
        success: false,
        error: 'Production step must be in progress to complete' 
      });
    }

    const completionTime = new Date();
    const startTime = currentStep.startedAt;
    const calculatedMinutes = startTime ? 
      Math.round((completionTime.getTime() - startTime.getTime()) / (1000 * 60)) : 
      actualMinutes;

    // Calculate efficiency score
    const expectedMinutes = currentStep.estimatedMinutes || 60;
    const actualDuration = actualMinutes || calculatedMinutes || expectedMinutes;
    const efficiencyScore = expectedMinutes > 0 ? 
      Math.round((expectedMinutes / actualDuration) * 100) : 100;

    // Generate alerts for efficiency issues
    const alerts = [];
    if (efficiencyScore < 80) {
      alerts.push(`Low efficiency: ${efficiencyScore}% (${actualDuration}min vs ${expectedMinutes}min expected)`);
    }
    if (qualityCheckPassed === false) {
      alerts.push('Quality check failed');
    }

    const updatedStep = await prisma.productionStep.update({
      where: { id: id },
      data: {
        status: ProductionStepStatus.COMPLETED,
        completedAt: completionTime,
        actualMinutes: actualDuration,
        qualityCheckPassed: qualityCheckPassed !== undefined ? qualityCheckPassed : null,
        temperature: temperature || currentStep.temperature,
        equipmentUsed: equipmentUsed || currentStep.equipmentUsed,
        notes: notes || currentStep.notes,
        updatedAt: new Date()
      },
      include: {
        productionRun: {
          include: {
            recipe: true
          }
        }
      }
    });

    // Check if all steps are completed
    const allSteps = currentStep.productionRun.steps;
    const allStepsCompleted = allSteps.every(step => 
      step.id === id ? true : step.status === ProductionStepStatus.COMPLETED
    );

    let completedProductionRun = null;
    let createdFinishedProduct = null;

    if (allStepsCompleted) {
      console.log('🎉 All production steps completed! Finalizing production run...');

      // Calculate total actual time and final yield
      const totalActualMinutes = allSteps.reduce((total, step) => {
        return total + (step.id === id ? actualDuration : (step.actualMinutes || step.estimatedMinutes || 0));
      }, 0);

      const finalYield = yieldQuantity || currentStep.productionRun.targetQuantity;

      // Update production run to completed
      completedProductionRun = await prisma.productionRun.update({
        where: { id: currentStep.productionRunId },
        data: {
          status: 'COMPLETED' as any,
          completedAt: completionTime,
          finalQuantity: finalYield,
          actualCost: calculateProductionCost(allSteps),
          updatedAt: new Date()
        },
        include: {
          recipe: true,
          steps: true
        }
      });

      // Create finished product
      const recipe = currentStep.productionRun.recipe;
      const batchNumber = `BATCH-${Date.now()}`;
      
      try {
        createdFinishedProduct = await prisma.finishedProduct.create({
          data: {
            name: recipe.name,
            description: `Produced from recipe: ${recipe.name}`,
            sku: `SKU-${recipe.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
            batchNumber,
            productionDate: completionTime,
            expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            shelfLife: 7, // days
            quantity: finalYield,
            unit: currentStep.productionRun.targetUnit,
            salePrice: 10.0, // Default price - should be configurable
            costToProduce: calculateProductionCost(allSteps),
            status: 'COMPLETED' as any,
            isContaminated: qualityCheckPassed === false,
            categoryId: recipe.categoryId
          }
        });

        console.log(`✅ Created finished product: ${createdFinishedProduct.name} (${finalYield} ${currentStep.productionRun.targetUnit})`);
      } catch (productError) {
        console.error('Error creating finished product:', productError);
        // Don't fail the step completion if finished product creation fails
      }
    }

    res.json({
      success: true,
      data: {
        step: updatedStep,
        productionCompleted: allStepsCompleted,
        completedProductionRun,
        createdFinishedProduct
      },
      message: allStepsCompleted ? 'Production step completed and production run finished' : 'Production step completed successfully'
    });
  } catch (error) {
    console.error('Error completing production step:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete production step' 
    });
  }
};

// Helper function to calculate production cost
function calculateProductionCost(steps: any[]): number {
  // Basic cost calculation - can be enhanced based on actual resource consumption
  const baseLabourCost = 15; // $15/hour
  const totalMinutes = steps.reduce((total, step) => total + (step.actualMinutes || step.estimatedMinutes || 0), 0);
  const labourCost = (totalMinutes / 60) * baseLabourCost;
  
  // Add material costs from resourcesConsumed if available
  const materialCost = steps.reduce((total, step) => {
    if (step.resourcesConsumed) {
      // This would need to be calculated based on actual ingredient costs
      return total + 5; // Placeholder material cost per step
    }
    return total;
  }, 0);

  return Number((labourCost + materialCost).toFixed(2));
}

// Log quality checkpoint during production step
export const logQualityCheckpoint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      checkpointType,
      qualityStatus,
      measurements,
      notes,
      photos,
      checkedByUserId
    } = req.body;

    const currentStep = await prisma.productionStep.findUnique({
      where: { id: id }
    });

    if (!currentStep) {
      return res.status(404).json({ 
        success: false,
        error: 'Production step not found' 
      });
    }

    // Create quality checkpoint data (store in notes for now since schema doesn't have qualityCheckData)
    const checkpoint = {
      timestamp: new Date().toISOString(),
      checkpointType,
      qualityStatus,
      measurements: measurements || {},
      notes: notes || '',
      photos: photos || [],
      checkedByUserId
    };

    // Update step with quality information
    const updatedNotes = currentStep.notes 
      ? `${currentStep.notes}\n\nQuality Check: ${checkpointType} - ${qualityStatus}\nMeasurements: ${JSON.stringify(measurements)}\nNotes: ${notes}`
      : `Quality Check: ${checkpointType} - ${qualityStatus}\nMeasurements: ${JSON.stringify(measurements)}\nNotes: ${notes}`;

    const updatedStep = await prisma.productionStep.update({
      where: { id: id },
      data: {
        qualityCheckPassed: qualityStatus === 'PASS' ? true : (qualityStatus === 'FAIL' ? false : currentStep.qualityCheckPassed),
        notes: updatedNotes,
        updatedAt: new Date()
      },
      include: {
        productionRun: {
          include: {
            recipe: true
          }
        }
      }
    });

    // Generate alerts if quality issues detected
    const alerts = [];
    if (qualityStatus === 'FAIL') {
      alerts.push(`Quality check failed at ${checkpointType}: ${notes || 'No details provided'}`);
    }

    res.json({
      success: true,
      data: {
        productionStep: updatedStep,
        checkpoint,
        alerts: qualityStatus === 'FAIL' ? alerts : []
      },
      message: 'Quality checkpoint logged successfully'
    });
  } catch (error) {
    console.error('Error logging quality checkpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to log quality checkpoint' 
    });
  }
};