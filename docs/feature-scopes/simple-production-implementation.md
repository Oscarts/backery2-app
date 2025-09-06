# Simple Production MVP - Implementation Roadmap

## 📋 Implementation Steps for Simple Production Module

This document outlines the specific steps to implement the Simple Production MVP, designed for small bakeries who need an intuitive, immediate production workflow.

## 🎯 Core Philosophy

**"Start Making Now, Plan as You Go"**

Unlike complex scheduling systems, this MVP focuses on:

- Immediate action ("I want to make cupcakes now")
- Visual feedback (see progress, ingredient usage)
- Flexible workflow (add steps on-the-fly)
- Real-time inventory updates
- Mobile-first design for kitchen use

## 📚 Implementation Phases

### Phase 1: Foundation & Database (Days 1-2)

#### 1.1 Database Schema Updates

Add to existing Prisma schema:

```prisma
// Add to schema.prisma

enum ProductionRunStatus {
  IN_PROGRESS
  PAUSED
  COMPLETED
  CANCELLED
}

enum ProductionStepStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model ProductionRun {
  id                  String              @id @default(uuid())
  name                String              // "24 Chocolate Cupcakes"
  recipeId            String
  recipe              Recipe              @relation(fields: [recipeId], references: [id])
  targetQuantity      Int
  targetUnit          String
  status              ProductionRunStatus @default(IN_PROGRESS)
  currentStepIndex    Int                 @default(0)
  batchNumber         String              @unique
  startedAt           DateTime            @default(now())
  completedAt         DateTime?
  estimatedFinishAt   DateTime?
  actualCost          Decimal?
  finalQuantity       Int?                // Actual quantity produced
  notes               String?
  createdBy           String?             // Optional user tracking
  
  // Relations
  steps               ProductionStep[]
  allocations         ProductionAllocation[]
  
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([status])
  @@index([startedAt])
}

model ProductionStep {
  id                  String              @id @default(uuid())
  productionRunId     String
  productionRun       ProductionRun       @relation(fields: [productionRunId], references: [id], onDelete: Cascade)
  name                String              // "Mix batter"
  description         String?             // "Cream butter and sugar first"
  estimatedMinutes    Int?
  stepOrder           Int                 // 1, 2, 3...
  status              ProductionStepStatus @default(PENDING)
  startedAt           DateTime?
  completedAt         DateTime?
  actualMinutes       Int?
  notes               String?
  
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([productionRunId, stepOrder])
}

model ProductionAllocation {
  id                  String              @id @default(uuid())
  productionRunId     String
  productionRun       ProductionRun       @relation(fields: [productionRunId], references: [id], onDelete: Cascade)
  materialType        String              // 'raw_material' or 'intermediate_product'
  materialId          String
  materialName        String              // Store name for history
  quantityAllocated   Decimal
  unit                String
  allocatedAt         DateTime            @default(now())
  
  @@index([productionRunId])
  @@index([materialType, materialId])
}

// Add relation to Recipe model
model Recipe {
  // ... existing fields
  productionRuns      ProductionRun[]
}
```

#### 1.2 Migration Script

```bash
npx prisma migrate dev --name add_simple_production_system
```

#### 1.3 Seed Data Updates

Add sample production runs for testing:

```typescript
// Add to seed.ts
const sampleProductionRuns = [
  {
    name: "24 Chocolate Cupcakes",
    recipeId: chocolateCupcakeRecipe.id,
    targetQuantity: 24,
    targetUnit: "cupcakes",
    batchNumber: "CC-20250906-001",
    status: "IN_PROGRESS",
    currentStepIndex: 2,
    steps: [
      { name: "Gather ingredients", estimatedMinutes: 5, stepOrder: 1, status: "COMPLETED" },
      { name: "Prep ingredients", estimatedMinutes: 15, stepOrder: 2, status: "COMPLETED" },
      { name: "Mix batter", estimatedMinutes: 10, stepOrder: 3, status: "IN_PROGRESS" },
      { name: "Bake", estimatedMinutes: 20, stepOrder: 4, status: "PENDING" },
      { name: "Cool & finish", estimatedMinutes: 15, stepOrder: 5, status: "PENDING" },
    ]
  }
];
```

### Phase 2: Backend API (Days 3-4)

#### 2.1 Production Service Layer

```typescript
// backend/src/services/productionService.ts
import { PrismaClient } from '@prisma/client';
import { Recipe, RawMaterial, IntermediateProduct } from '../types';

export class ProductionService {
  constructor(private prisma: PrismaClient) {}

  // Check if recipe can be made with current inventory
  async checkRecipeAvailability(recipeId: string, targetQuantity: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: true }
    });

    if (!recipe) throw new Error('Recipe not found');

    const multiplier = targetQuantity / recipe.yieldQuantity;
    const ingredientChecks = [];

    for (const ingredient of recipe.ingredients) {
      const neededQuantity = ingredient.quantity * multiplier;
      let available = 0;

      if (ingredient.materialType === 'raw_material') {
        const material = await this.prisma.rawMaterial.findUnique({
          where: { id: ingredient.materialId }
        });
        available = material?.quantity || 0;
      } else {
        const material = await this.prisma.intermediateProduct.findUnique({
          where: { id: ingredient.materialId }
        });
        available = material?.quantity || 0;
      }

      ingredientChecks.push({
        materialId: ingredient.materialId,
        materialName: ingredient.materialName,
        needed: neededQuantity,
        available,
        canMake: available >= neededQuantity,
        unit: ingredient.unit
      });
    }

    return {
      canMake: ingredientChecks.every(check => check.canMake),
      ingredients: ingredientChecks,
      estimatedCost: this.calculateCost(recipe, multiplier)
    };
  }

  // Start a new production run
  async startProductionRun(data: {
    recipeId: string;
    targetQuantity: number;
    name?: string;
  }) {
    const { recipeId, targetQuantity } = data;
    
    // Check availability first
    const availability = await this.checkRecipeAvailability(recipeId, targetQuantity);
    if (!availability.canMake) {
      throw new Error('Insufficient ingredients for this production run');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: true }
    });

    // Generate batch number
    const batchNumber = this.generateBatchNumber(recipe!.name);
    
    // Create production run with default steps
    const productionRun = await this.prisma.productionRun.create({
      data: {
        name: data.name || `${targetQuantity} ${recipe!.name}`,
        recipeId,
        targetQuantity,
        targetUnit: recipe!.yieldUnit,
        batchNumber,
        estimatedFinishAt: this.calculateEstimatedFinish(recipe!),
        steps: {
          createMany: {
            data: this.createDefaultSteps(recipe!)
          }
        }
      },
      include: {
        recipe: true,
        steps: { orderBy: { stepOrder: 'asc' } },
        allocations: true
      }
    });

    // Allocate ingredients (remove from inventory)
    await this.allocateIngredients(productionRun.id, recipe!.ingredients, targetQuantity / recipe!.yieldQuantity);

    return productionRun;
  }

  // Complete a production step
  async completeStep(productionRunId: string, stepId: string, data?: {
    actualMinutes?: number;
    notes?: string;
  }) {
    const step = await this.prisma.productionStep.update({
      where: { id: stepId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualMinutes: data?.actualMinutes,
        notes: data?.notes
      }
    });

    // Check if this was the last step
    const productionRun = await this.prisma.productionRun.findUnique({
      where: { id: productionRunId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } }
    });

    const allStepsCompleted = productionRun!.steps.every(s => 
      s.status === 'COMPLETED' || s.status === 'SKIPPED'
    );

    if (allStepsCompleted) {
      await this.completeProductionRun(productionRunId);
    } else {
      // Move to next step
      const nextStep = productionRun!.steps.find(s => s.status === 'PENDING');
      if (nextStep) {
        await this.prisma.productionRun.update({
          where: { id: productionRunId },
          data: { currentStepIndex: nextStep.stepOrder - 1 }
        });
      }
    }

    return step;
  }

  // Add custom step during production
  async addCustomStep(productionRunId: string, data: {
    name: string;
    description?: string;
    estimatedMinutes?: number;
    insertAfter: number; // Insert after this step order
  }) {
    // Shift existing steps
    await this.prisma.productionStep.updateMany({
      where: {
        productionRunId,
        stepOrder: { gt: data.insertAfter }
      },
      data: {
        stepOrder: { increment: 1 }
      }
    });

    // Insert new step
    const newStep = await this.prisma.productionStep.create({
      data: {
        productionRunId,
        name: data.name,
        description: data.description,
        estimatedMinutes: data.estimatedMinutes,
        stepOrder: data.insertAfter + 1,
        status: 'PENDING'
      }
    });

    return newStep;
  }

  // Complete entire production run
  async completeProductionRun(productionRunId: string, data?: {
    finalQuantity?: number;
    qualityNotes?: string;
  }) {
    const productionRun = await this.prisma.productionRun.findUnique({
      where: { id: productionRunId },
      include: { recipe: true }
    });

    if (!productionRun) throw new Error('Production run not found');

    // Update production run
    await this.prisma.productionRun.update({
      where: { id: productionRunId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        finalQuantity: data?.finalQuantity || productionRun.targetQuantity,
        notes: data?.qualityNotes
      }
    });

    // Create finished product
    await this.createFinishedProduct(productionRun, data?.finalQuantity);

    return productionRun;
  }

  private async allocateIngredients(productionRunId: string, ingredients: any[], multiplier: number) {
    for (const ingredient of ingredients) {
      const quantityNeeded = ingredient.quantity * multiplier;

      // Update inventory
      if (ingredient.materialType === 'raw_material') {
        await this.prisma.rawMaterial.update({
          where: { id: ingredient.materialId },
          data: { quantity: { decrement: quantityNeeded } }
        });
      } else {
        await this.prisma.intermediateProduct.update({
          where: { id: ingredient.materialId },
          data: { quantity: { decrement: quantityNeeded } }
        });
      }

      // Create allocation record
      await this.prisma.productionAllocation.create({
        data: {
          productionRunId,
          materialType: ingredient.materialType,
          materialId: ingredient.materialId,
          materialName: ingredient.materialName,
          quantityAllocated: quantityNeeded,
          unit: ingredient.unit
        }
      });
    }
  }

  private async createFinishedProduct(productionRun: any, finalQuantity?: number) {
    const quantity = finalQuantity || productionRun.targetQuantity;
    
    await this.prisma.finishedProduct.create({
      data: {
        name: productionRun.name,
        sku: `${productionRun.recipe.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
        categoryId: productionRun.recipe.categoryId,
        batchNumber: productionRun.batchNumber,
        productionDate: productionRun.startedAt.toISOString(),
        expirationDate: this.calculateExpirationDate(productionRun.recipe).toISOString(),
        shelfLife: productionRun.recipe.shelfLifeDays || 3,
        quantity,
        reservedQuantity: 0,
        unit: productionRun.targetUnit,
        salePrice: 0, // To be set later
        costToProduce: productionRun.actualCost,
        storageLocationId: productionRun.recipe.defaultStorageLocationId,
        isContaminated: false
      }
    });
  }

  private generateBatchNumber(recipeName: string): string {
    const prefix = recipeName.substring(0, 2).toUpperCase();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${random}`;
  }

  private createDefaultSteps(recipe: any) {
    const baseSteps = [
      { name: "Gather ingredients", estimatedMinutes: 5, stepOrder: 1 },
      { name: "Prep ingredients", estimatedMinutes: 15, stepOrder: 2 },
      { name: "Mix/Prepare", estimatedMinutes: recipe.prepTime || 15, stepOrder: 3 }
    ];

    if (recipe.cookTime && recipe.cookTime > 0) {
      baseSteps.push({ name: "Bake/Cook", estimatedMinutes: recipe.cookTime, stepOrder: 4 });
      baseSteps.push({ name: "Cool & finish", estimatedMinutes: 15, stepOrder: 5 });
    } else {
      baseSteps.push({ name: "Finish & package", estimatedMinutes: 10, stepOrder: 4 });
    }

    return baseSteps;
  }
}
```

#### 2.2 Production Controller

```typescript
// backend/src/controllers/productionController.ts
import { Request, Response } from 'express';
import { ProductionService } from '../services/productionService';
import { prisma } from '../config/database';

const productionService = new ProductionService(prisma);

export const productionController = {
  // GET /api/production/check-recipe/:recipeId
  async checkRecipeAvailability(req: Request, res: Response) {
    try {
      const { recipeId } = req.params;
      const { quantity = 1 } = req.query;
      
      const result = await productionService.checkRecipeAvailability(
        recipeId, 
        parseInt(quantity as string)
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // POST /api/production/start
  async startProduction(req: Request, res: Response) {
    try {
      const result = await productionService.startProductionRun(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // GET /api/production/active
  async getActiveProductions(req: Request, res: Response) {
    try {
      const productions = await prisma.productionRun.findMany({
        where: { status: { in: ['IN_PROGRESS', 'PAUSED'] } },
        include: {
          recipe: true,
          steps: { orderBy: { stepOrder: 'asc' } },
          allocations: true
        },
        orderBy: { startedAt: 'desc' }
      });
      
      res.json({ success: true, data: productions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PUT /api/production/:id/step/:stepId/complete
  async completeStep(req: Request, res: Response) {
    try {
      const { id: productionRunId, stepId } = req.params;
      const result = await productionService.completeStep(productionRunId, stepId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // POST /api/production/:id/add-step
  async addCustomStep(req: Request, res: Response) {
    try {
      const { id: productionRunId } = req.params;
      const result = await productionService.addCustomStep(productionRunId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // PUT /api/production/:id/complete
  async completeProduction(req: Request, res: Response) {
    try {
      const { id: productionRunId } = req.params;
      const result = await productionService.completeProductionRun(productionRunId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // PUT /api/production/:id/pause
  async pauseProduction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const production = await prisma.productionRun.update({
        where: { id },
        data: { status: 'PAUSED' }
      });
      res.json({ success: true, data: production });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // PUT /api/production/:id/resume
  async resumeProduction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const production = await prisma.productionRun.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });
      res.json({ success: true, data: production });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};
```

#### 2.3 Production Routes

```typescript
// backend/src/routes/production.ts
import { Router } from 'express';
import { productionController } from '../controllers/productionController';

const router = Router();

// Recipe availability check
router.get('/check-recipe/:recipeId', productionController.checkRecipeAvailability);

// Production management
router.post('/start', productionController.startProduction);
router.get('/active', productionController.getActiveProductions);
router.put('/:id/pause', productionController.pauseProduction);
router.put('/:id/resume', productionController.resumeProduction);
router.put('/:id/complete', productionController.completeProduction);

// Step management
router.put('/:id/step/:stepId/complete', productionController.completeStep);
router.post('/:id/add-step', productionController.addCustomStep);

export default router;
```

### Phase 3: Frontend Types & Services (Day 5)

#### 3.1 TypeScript Types

```typescript
// frontend/src/types/production.ts
export enum ProductionRunStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProductionStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export interface ProductionRun {
  id: string;
  name: string;
  recipeId: string;
  recipe?: Recipe;
  targetQuantity: number;
  targetUnit: string;
  status: ProductionRunStatus;
  currentStepIndex: number;
  batchNumber: string;
  startedAt: string;
  completedAt?: string;
  estimatedFinishAt?: string;
  actualCost?: number;
  finalQuantity?: number;
  notes?: string;
  steps?: ProductionStep[];
  allocations?: ProductionAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionStep {
  id: string;
  productionRunId: string;
  name: string;
  description?: string;
  estimatedMinutes?: number;
  stepOrder: number;
  status: ProductionStepStatus;
  startedAt?: string;
  completedAt?: string;
  actualMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionAllocation {
  id: string;
  productionRunId: string;
  materialType: string;
  materialId: string;
  materialName: string;
  quantityAllocated: number;
  unit: string;
  allocatedAt: string;
}

export interface RecipeAvailability {
  canMake: boolean;
  ingredients: IngredientCheck[];
  estimatedCost: number;
}

export interface IngredientCheck {
  materialId: string;
  materialName: string;
  needed: number;
  available: number;
  canMake: boolean;
  unit: string;
}

export interface StartProductionData {
  recipeId: string;
  targetQuantity: number;
  name?: string;
}

export interface CompleteStepData {
  actualMinutes?: number;
  notes?: string;
}

export interface AddStepData {
  name: string;
  description?: string;
  estimatedMinutes?: number;
  insertAfter: number;
}
```

#### 3.2 Production API Service

```typescript
// frontend/src/services/productionApi.ts
import { apiClient } from './apiClient';
import {
  ProductionRun,
  RecipeAvailability,
  StartProductionData,
  CompleteStepData,
  AddStepData
} from '../types/production';

export const productionApi = {
  // Check if recipe can be made
  checkRecipeAvailability: async (recipeId: string, quantity: number = 1): Promise<RecipeAvailability> => {
    const response = await apiClient.get(`/production/check-recipe/${recipeId}?quantity=${quantity}`);
    return response.data.data;
  },

  // Start new production run
  startProduction: async (data: StartProductionData): Promise<ProductionRun> => {
    const response = await apiClient.post('/production/start', data);
    return response.data.data;
  },

  // Get active productions
  getActiveProductions: async (): Promise<ProductionRun[]> => {
    const response = await apiClient.get('/production/active');
    return response.data.data;
  },

  // Get specific production run
  getProductionRun: async (id: string): Promise<ProductionRun> => {
    const response = await apiClient.get(`/production/${id}`);
    return response.data.data;
  },

  // Complete a step
  completeStep: async (productionId: string, stepId: string, data?: CompleteStepData): Promise<void> => {
    await apiClient.put(`/production/${productionId}/step/${stepId}/complete`, data);
  },

  // Add custom step
  addCustomStep: async (productionId: string, data: AddStepData): Promise<void> => {
    await apiClient.post(`/production/${productionId}/add-step`, data);
  },

  // Pause production
  pauseProduction: async (id: string): Promise<void> => {
    await apiClient.put(`/production/${id}/pause`);
  },

  // Resume production
  resumeProduction: async (id: string): Promise<void> => {
    await apiClient.put(`/production/${id}/resume`);
  },

  // Complete production
  completeProduction: async (id: string, data?: { finalQuantity?: number; qualityNotes?: string }): Promise<void> => {
    await apiClient.put(`/production/${id}/complete`, data);
  }
};
```

### Phase 4: Core UI Components (Days 6-8)

#### 4.1 Production Dashboard

```tsx
// frontend/src/components/Production/ProductionDashboard.tsx
import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Check as CheckIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '../../services/productionApi';
import { ProductionRun, ProductionRunStatus } from '../../types/production';
import { formatDistanceToNow } from 'date-fns';

interface ProductionDashboardProps {
  onStartNew: () => void;
  onViewDetails: (productionId: string) => void;
}

const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
  onStartNew,
  onViewDetails,
}) => {
  const queryClient = useQueryClient();
  
  const { data: activeProductions = [], isLoading } = useQuery(
    ['activeProductions'],
    productionApi.getActiveProductions,
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const pauseMutation = useMutation(productionApi.pauseProduction, {
    onSuccess: () => queryClient.invalidateQueries(['activeProductions']),
  });

  const resumeMutation = useMutation(productionApi.resumeProduction, {
    onSuccess: () => queryClient.invalidateQueries(['activeProductions']),
  });

  const getStatusColor = (status: ProductionRunStatus) => {
    switch (status) {
      case ProductionRunStatus.IN_PROGRESS:
        return 'primary';
      case ProductionRunStatus.PAUSED:
        return 'warning';
      case ProductionRunStatus.COMPLETED:
        return 'success';
      default:
        return 'default';
    }
  };

  const calculateProgress = (production: ProductionRun) => {
    if (!production.steps) return 0;
    const completedSteps = production.steps.filter(s => s.status === 'COMPLETED').length;
    return (completedSteps / production.steps.length) * 100;
  };

  const getCurrentStep = (production: ProductionRun) => {
    if (!production.steps) return null;
    return production.steps.find(s => s.status === 'IN_PROGRESS') ||
           production.steps.find(s => s.status === 'PENDING');
  };

  if (isLoading) {
    return <Typography>Loading production runs...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Production Dashboard</Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={onStartNew}
          sx={{ minWidth: 200 }}
        >
          🚀 Start Production
        </Button>
      </Box>

      {activeProductions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No active productions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ready to start baking? Create your first production run!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={onStartNew}
            >
              Start Your First Production
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {activeProductions.map((production) => {
            const currentStep = getCurrentStep(production);
            const progress = calculateProgress(production);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={production.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => onViewDetails(production.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
                        {production.name}
                      </Typography>
                      <Chip
                        label={production.status.replace('_', ' ')}
                        color={getStatusColor(production.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Batch: {production.batchNumber}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Started: {formatDistanceToNow(new Date(production.startedAt), { addSuffix: true })}
                    </Typography>

                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress</Typography>
                        <Typography variant="body2">{Math.round(progress)}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {currentStep && (
                      <Box sx={{ 
                        bgcolor: 'action.hover', 
                        p: 1.5, 
                        borderRadius: 1,
                        border: currentStep.status === 'IN_PROGRESS' ? '2px solid' : '1px solid',
                        borderColor: currentStep.status === 'IN_PROGRESS' ? 'primary.main' : 'divider'
                      }}>
                        <Typography variant="subtitle2" color="primary">
                          Current Step:
                        </Typography>
                        <Typography variant="body2">
                          {currentStep.name}
                        </Typography>
                        {currentStep.estimatedMinutes && (
                          <Typography variant="caption" color="text.secondary">
                            ~{currentStep.estimatedMinutes} minutes
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                    <Box>
                      {production.status === ProductionRunStatus.IN_PROGRESS && (
                        <Tooltip title="Pause Production">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseMutation.mutate(production.id);
                            }}
                          >
                            <PauseIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {production.status === ProductionRunStatus.PAUSED && (
                        <Tooltip title="Resume Production">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              resumeMutation.mutate(production.id);
                            }}
                          >
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(production.id);
                      }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ProductionDashboard;
```

#### 4.2 Recipe Selection Wizard

```tsx
// frontend/src/components/Production/RecipeSelectionWizard.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Chip,
  Box,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from '../../services/realApi';
import { productionApi } from '../../services/productionApi';
import { Recipe } from '../../types';
import { RecipeAvailability } from '../../types/production';

interface RecipeSelectionWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (productionId: string) => void;
}

const RecipeSelectionWizard: React.FC<RecipeSelectionWizardProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [targetQuantity, setTargetQuantity] = useState<number>(1);
  const [availability, setAvailability] = useState<RecipeAvailability | null>(null);
  const [step, setStep] = useState<'select' | 'quantity' | 'confirm'>('select');
  
  const queryClient = useQueryClient();
  
  const { data: recipesResponse } = useQuery(['recipes'], recipesApi.getAll);
  const recipes = recipesResponse?.data || [];

  const startProductionMutation = useMutation(productionApi.startProduction, {
    onSuccess: (production) => {
      queryClient.invalidateQueries(['activeProductions']);
      onSuccess(production.id);
      handleClose();
    },
  });

  // Check availability when recipe or quantity changes
  useEffect(() => {
    if (selectedRecipe && targetQuantity > 0) {
      productionApi.checkRecipeAvailability(selectedRecipe.id, targetQuantity)
        .then(setAvailability)
        .catch(() => setAvailability(null));
    }
  }, [selectedRecipe, targetQuantity]);

  const handleClose = () => {
    setSelectedRecipe(null);
    setTargetQuantity(1);
    setAvailability(null);
    setStep('select');
    onClose();
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setTargetQuantity(recipe.yieldQuantity); // Start with recipe's default yield
    setStep('quantity');
  };

  const handleQuantityConfirm = () => {
    setStep('confirm');
  };

  const handleStartProduction = () => {
    if (selectedRecipe && availability?.canMake) {
      const productionName = `${targetQuantity} ${selectedRecipe.name}`;
      startProductionMutation.mutate({
        recipeId: selectedRecipe.id,
        targetQuantity,
        name: productionName,
      });
    }
  };

  const getAvailabilityIcon = (recipe: Recipe) => {
    // This would be enhanced with real-time availability checking
    return <CheckIcon color="success" />;
  };

  const renderRecipeSelection = () => (
    <Grid container spacing={2}>
      {recipes.map((recipe) => (
        <Grid item xs={12} sm={6} md={4} key={recipe.id}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              height: '100%',
            }}
            onClick={() => handleRecipeSelect(recipe)}
          >
            <CardMedia
              component="div"
              sx={{
                height: 120,
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
              }}
            >
              🧁
            </CardMedia>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {recipe.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Makes {recipe.yieldQuantity} {recipe.yieldUnit}
              </Typography>
              {recipe.prepTime && recipe.cookTime && (
                <Typography variant="caption" display="block">
                  Total time: ~{recipe.prepTime + recipe.cookTime} minutes
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getAvailabilityIcon(recipe)}
                <Typography variant="caption" color="success.main">
                  Ready to make
                </Typography>
              </Box>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderQuantitySelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        How many {selectedRecipe?.name} do you want to make?
      </Typography>
      
      <Box sx={{ my: 3 }}>
        <TextField
          label="Target Quantity"
          type="number"
          value={targetQuantity}
          onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
          inputProps={{ min: 1 }}
          sx={{ mr: 2 }}
        />
        <Typography component="span" variant="body1">
          {selectedRecipe?.yieldUnit}
        </Typography>
      </Box>

      {selectedRecipe && targetQuantity > 0 && (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 This means:
          </Typography>
          <Typography variant="body2">
            • {(targetQuantity / selectedRecipe.yieldQuantity).toFixed(1)}x the recipe
          </Typography>
          {selectedRecipe.prepTime && selectedRecipe.cookTime && (
            <Typography variant="body2">
              • About {Math.round((selectedRecipe.prepTime + selectedRecipe.cookTime) * (targetQuantity / selectedRecipe.yieldQuantity))} minutes total
            </Typography>
          )}
          <Typography variant="body2">
            • Estimated cost: ${availability?.estimatedCost?.toFixed(2) || '0.00'}
          </Typography>
        </Box>
      )}

      {availability && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            📦 Ingredient Check:
          </Typography>
          {availability.ingredients.map((ingredient, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {ingredient.canMake ? (
                <CheckIcon color="success" fontSize="small" />
              ) : (
                <ErrorIcon color="error" fontSize="small" />
              )}
              <Typography variant="body2">
                {ingredient.materialName}: {ingredient.needed}{ingredient.unit}
                {ingredient.canMake ? (
                  <span style={{ color: 'green' }}> ✓ (have {ingredient.available}{ingredient.unit})</span>
                ) : (
                  <span style={{ color: 'red' }}> ✗ (need {ingredient.needed - ingredient.available}{ingredient.unit} more)</span>
                )}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {availability && !availability.canMake && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You don't have enough ingredients for this quantity. Please reduce the quantity or restock ingredients.
        </Alert>
      )}
    </Box>
  );

  const renderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ready to start production?
      </Typography>
      
      <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          🧁 {targetQuantity} {selectedRecipe?.name}
        </Typography>
        <Typography variant="body2">
          Recipe: {selectedRecipe?.name}
        </Typography>
        <Typography variant="body2">
          Estimated time: ~{selectedRecipe && ((selectedRecipe.prepTime || 0) + (selectedRecipe.cookTime || 0)) * (targetQuantity / selectedRecipe.yieldQuantity)} minutes
        </Typography>
        <Typography variant="body2">
          Estimated cost: ${availability?.estimatedCost?.toFixed(2) || '0.00'}
        </Typography>
      </Box>

      <Alert severity="info">
        Starting this production will reserve the required ingredients and create a new production run that you can track in real-time.
      </Alert>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        {step === 'select' && '🚀 Start New Production'}
        {step === 'quantity' && '📊 Set Quantity'}
        {step === 'confirm' && '✅ Confirm Production'}
      </DialogTitle>
      
      <DialogContent>
        {step === 'select' && renderRecipeSelection()}
        {step === 'quantity' && renderQuantitySelection()}
        {step === 'confirm' && renderConfirmation()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        
        {step === 'quantity' && (
          <Button onClick={() => setStep('select')} variant="outlined">
            Back
          </Button>
        )}
        
        {step === 'confirm' && (
          <Button onClick={() => setStep('quantity')} variant="outlined">
            Back
          </Button>
        )}
        
        {step === 'quantity' && availability?.canMake && (
          <Button 
            onClick={handleQuantityConfirm} 
            variant="contained"
            disabled={!availability.canMake}
          >
            Next: Review
          </Button>
        )}
        
        {step === 'confirm' && (
          <Button 
            onClick={handleStartProduction} 
            variant="contained"
            disabled={startProductionMutation.isLoading}
            startIcon={startProductionMutation.isLoading ? <CircularProgress size={20} /> : null}
          >
            🚀 Start Production!
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RecipeSelectionWizard;
```

## 📱 Next Implementation Steps

### Immediate (Week 1)

1. **Day 1-2**: Database schema & migration
2. **Day 3-4**: Backend API implementation
3. **Day 5**: Frontend services & types

### Short Term (Week 2)

4. **Day 6-8**: Core UI components
5. **Day 9-10**: Mobile optimization & testing

### Integration (Week 3)

6. **Day 11-12**: Dashboard integration
7. **Day 13-14**: Real-time updates & polish

## 🎯 Success Criteria

- ✅ Baker can start production in under 30 seconds
- ✅ Real-time inventory updates work correctly
- ✅ Mobile interface is touch-friendly
- ✅ Production tracking is visual and intuitive
- ✅ No training required - interface is self-explanatory

This MVP focuses on the core need: **immediate, flexible production management** that works like bakers actually think and work! 🧑‍🍳
