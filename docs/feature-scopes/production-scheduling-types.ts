// Production scheduling type definitions

import { Recipe } from './recipe';

export enum ProductionStatus {
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    ON_HOLD = 'ON_HOLD'
}

export enum StepStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    SKIPPED = 'SKIPPED',
    FAILED = 'FAILED'
}

export enum ResourceType {
    RAW_MATERIAL = 'RAW_MATERIAL',
    INTERMEDIATE_PRODUCT = 'INTERMEDIATE_PRODUCT',
    EQUIPMENT = 'EQUIPMENT',
    PERSONNEL = 'PERSONNEL'
}

export interface ProductionSchedule {
    id: string;
    name: string;
    description?: string;
    status: ProductionStatus;
    startDate: string;
    endDate?: string;
    recipeId: string;
    recipe?: Recipe;
    outputQuantity: number;
    outputUnit: string;
    notes?: string;
    assignedTo?: string;
    productionSteps?: ProductionStep[];
    resourceAllocations?: ResourceAllocation[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductionStep {
    id: string;
    productionScheduleId: string;
    productionSchedule?: ProductionSchedule;
    name: string;
    description?: string;
    status: StepStatus;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    actualDurationMinutes?: number;
    ordinalPosition: number;
    notes?: string;
    ingredientsMapped?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface ResourceAllocation {
    id: string;
    productionScheduleId: string;
    productionSchedule?: ProductionSchedule;
    resourceType: ResourceType;
    resourceId: string;
    quantityRequired?: number;
    unit?: string;
    isConfirmed: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductionScheduleData {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    recipeId: string;
    outputQuantity: number;
    outputUnit: string;
    notes?: string;
    assignedTo?: string;
    initialSteps?: Omit<ProductionStep, 'id' | 'productionScheduleId' | 'productionSchedule' | 'createdAt' | 'updatedAt'>[];
    initialAllocations?: Omit<ResourceAllocation, 'id' | 'productionScheduleId' | 'productionSchedule' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateProductionScheduleData {
    name?: string;
    description?: string;
    status?: ProductionStatus;
    startDate?: string;
    endDate?: string;
    outputQuantity?: number;
    outputUnit?: string;
    notes?: string;
    assignedTo?: string;
}

export interface UpdateProductionStepData {
    name?: string;
    description?: string;
    status?: StepStatus;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    actualDurationMinutes?: number;
    ordinalPosition?: number;
    notes?: string;
    ingredientsMapped?: Record<string, any>;
}

export interface ResourceAvailabilityQuery {
    date?: string;
    startDate?: string;
    endDate?: string;
    resourceType?: ResourceType;
    resourceId?: string;
}

export interface ResourceAvailability {
    resourceType: ResourceType;
    resourceId: string;
    resourceName: string;
    availableQuantity: number;
    unit?: string;
    allocations: {
        productionScheduleId: string;
        productionScheduleName: string;
        startDate: string;
        endDate?: string;
        allocatedQuantity: number;
    }[];
}
