// Production Types - Mobile-First Production Workflow
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
    recipe?: any; // Will use Recipe type when integrated
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
    suggestedQuantity?: number;
}

export interface IngredientCheck {
    materialId: string;
    materialName: string;
    needed: number;
    available: number;
    canMake: boolean;
    unit: string;
    shortage?: number;
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

// Mock data for UI development
export const mockRecipes = [
    {
        id: '1',
        name: 'Chocolate Cupcakes',
        description: 'Rich, moist chocolate cupcakes',
        emoji: '🧁',
        yieldQuantity: 12,
        yieldUnit: 'cupcakes',
        prepTime: 20,
        cookTime: 18,
        difficulty: 'Easy',
        category: 'Cupcakes',
        canMake: true,
        maxQuantity: 48,
        estimatedCost: 2.50
    },
    {
        id: '2',
        name: 'Sourdough Bread',
        description: 'Traditional artisan sourdough',
        emoji: '🍞',
        yieldQuantity: 2,
        yieldUnit: 'loaves',
        prepTime: 45,
        cookTime: 35,
        difficulty: 'Medium',
        category: 'Bread',
        canMake: false,
        shortage: 'Need 500g more flour',
        estimatedCost: 3.20
    },
    {
        id: '3',
        name: 'Classic Baguettes',
        description: 'Crispy French baguettes',
        emoji: '🥖',
        yieldQuantity: 4,
        yieldUnit: 'baguettes',
        prepTime: 30,
        cookTime: 25,
        difficulty: 'Medium',
        category: 'Bread',
        canMake: true,
        maxQuantity: 16,
        estimatedCost: 2.80
    },
    {
        id: '4',
        name: 'Blueberry Muffins',
        description: 'Fresh blueberry muffins',
        emoji: '🧁',
        yieldQuantity: 12,
        yieldUnit: 'muffins',
        prepTime: 15,
        cookTime: 20,
        difficulty: 'Easy',
        category: 'Muffins',
        canMake: true,
        maxQuantity: 36,
        estimatedCost: 3.10
    },
    {
        id: '5',
        name: 'Croissants',
        description: 'Buttery, flaky croissants',
        emoji: '🥐',
        yieldQuantity: 8,
        yieldUnit: 'croissants',
        prepTime: 120,
        cookTime: 15,
        difficulty: 'Hard',
        category: 'Pastries',
        canMake: true,
        maxQuantity: 24,
        estimatedCost: 4.50
    },
    {
        id: '6',
        name: 'Cinnamon Rolls',
        description: 'Sweet cinnamon rolls with glaze',
        emoji: '🌀',
        yieldQuantity: 9,
        yieldUnit: 'rolls',
        prepTime: 40,
        cookTime: 25,
        difficulty: 'Medium',
        category: 'Sweet Rolls',
        canMake: true,
        maxQuantity: 27,
        estimatedCost: 3.75
    }
];

export const mockActiveProductions: ProductionRun[] = [
    {
        id: 'prod-1',
        name: '24 Chocolate Cupcakes',
        recipeId: '1',
        targetQuantity: 24,
        targetUnit: 'cupcakes',
        status: ProductionRunStatus.IN_PROGRESS,
        currentStepIndex: 2,
        batchNumber: 'CC-20250906-001',
        startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Started 45 mins ago
        estimatedFinishAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins from now
        actualCost: 5.00,
        steps: [
            {
                id: 'step-1',
                productionRunId: 'prod-1',
                name: 'Gather ingredients',
                stepOrder: 1,
                status: ProductionStepStatus.COMPLETED,
                estimatedMinutes: 5,
                actualMinutes: 4,
                completedAt: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
                createdAt: '',
                updatedAt: ''
            },
            {
                id: 'step-2',
                productionRunId: 'prod-1',
                name: 'Prep ingredients',
                description: 'Measure flour, cocoa, sugar. Bring eggs to room temp.',
                stepOrder: 2,
                status: ProductionStepStatus.COMPLETED,
                estimatedMinutes: 15,
                actualMinutes: 12,
                completedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
                createdAt: '',
                updatedAt: ''
            },
            {
                id: 'step-3',
                productionRunId: 'prod-1',
                name: 'Mix batter',
                description: 'Cream butter and sugar, add eggs, then dry ingredients',
                stepOrder: 3,
                status: ProductionStepStatus.IN_PROGRESS,
                estimatedMinutes: 10,
                startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                createdAt: '',
                updatedAt: ''
            },
            {
                id: 'step-4',
                productionRunId: 'prod-1',
                name: 'Bake cupcakes',
                description: 'Fill cups 2/3 full, bake at 350°F for 18-20 minutes',
                stepOrder: 4,
                status: ProductionStepStatus.PENDING,
                estimatedMinutes: 20,
                createdAt: '',
                updatedAt: ''
            },
            {
                id: 'step-5',
                productionRunId: 'prod-1',
                name: 'Cool & finish',
                description: 'Cool completely before frosting',
                stepOrder: 5,
                status: ProductionStepStatus.PENDING,
                estimatedMinutes: 15,
                createdAt: '',
                updatedAt: ''
            }
        ],
        createdAt: '',
        updatedAt: ''
    }
];
