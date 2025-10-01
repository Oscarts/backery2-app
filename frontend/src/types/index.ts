// User types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

// Category types
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  description?: string;
  createdAt: string;
}

export enum CategoryType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  FINISHED_PRODUCT = 'FINISHED_PRODUCT',
  RECIPE = 'RECIPE'
}

// Supplier types
export interface Supplier {
  id: string;
  name: string;
  contactInfo?: any;
  address?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Storage Location types
export interface StorageLocation {
  id: string;
  name: string;
  type?: string;
  description?: string;
  capacity?: string;
  createdAt: string;
}

// Unit types
export interface Unit {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ProductStatus {
  IN_PRODUCTION = 'IN_PRODUCTION',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  DISCARDED = 'DISCARDED'
}

// Raw Material types
export interface RawMaterial {
  id: string;
  name: string;
  sku?: string; // Unified SKU shared with finished products by name
  description?: string;
  categoryId: string;
  supplierId: string;
  batchNumber: string;
  purchaseDate?: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  reorderLevel: number;
  storageLocationId: string;
  qualityStatusId?: string;
  isContaminated: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: Category;
  supplier?: Supplier;
  storageLocation?: StorageLocation;
  qualityStatus?: QualityStatus;
}

export interface CreateRawMaterialData {
  name: string;
  sku?: string;
  categoryId: string;
  supplierId: string;
  batchNumber: string;
  purchaseDate: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  costPerUnit: number; // Frontend uses costPerUnit, backend maps to unitPrice
  reorderLevel: number;
  storageLocationId: string;
  qualityStatusId?: string;
}

export interface UpdateRawMaterialData extends Partial<CreateRawMaterialData> {
  contaminated?: boolean; // Frontend uses contaminated, backend maps to isContaminated
}

// Quality Status types
export interface QualityStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy enum for backward compatibility (to be removed)
export enum QualityStatusLegacy {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW'
}

// Finished Product types
export interface FinishedProduct {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  batchNumber: string;
  productionDate: string;
  expirationDate: string;
  shelfLife: number;
  quantity: number;
  reservedQuantity: number;
  unit: string;
  salePrice: number;
  costToProduce?: number;
  packagingInfo?: string;
  storageLocationId?: string;
  qualityStatusId?: string;
  isContaminated: boolean;
  createdAt: string;
  updatedAt: string;

  // Optional production status (front-end aligned with intermediate products)
  status?: ProductionStatus;

  // Relations
  category?: Category;
  storageLocation?: StorageLocation;
  qualityStatus?: QualityStatus;
}

export interface CreateFinishedProductData {
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  batchNumber: string;
  productionDate: string;
  expirationDate: string;
  shelfLife: number;
  quantity: number;
  unit: string;
  salePrice: number;
  costToProduce?: number;
  packagingInfo?: string;
  storageLocationId?: string;
  qualityStatusId?: string;
  isContaminated?: boolean;
  status?: ProductionStatus;
}

export interface UpdateFinishedProductData {
  name?: string;
  description?: string;
  sku?: string;
  categoryId?: string;
  batchNumber?: string;
  productionDate?: string;
  expirationDate?: string;
  shelfLife?: number;
  quantity?: number;
  reservedQuantity?: number;
  unit?: string;
  salePrice?: number;
  costToProduce?: number;
  packagingInfo?: string;
  storageLocationId?: string;
  qualityStatusId?: string;
  isContaminated?: boolean;
  status?: ProductionStatus;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Dashboard types
export interface DashboardStats {
  rawMaterialsCount: number;
  intermediateProductsCount: number;
  finishedProductsCount: number;
  recipesCount: number;
  expiringItemsCount: number;
  lowStockItemsCount: number;
  productionBatchesThisWeek: number;
  totalInventoryValue: number;
}

export interface RecentActivity {
  id: string;
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'EXPIRED' | 'LOW_STOCK';
  entity: 'RAW_MATERIAL' | 'INTERMEDIATE_PRODUCT' | 'FINISHED_PRODUCT' | 'RECIPE' | 'PRODUCTION_BATCH';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

// Recipe types
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  yieldQuantity: number;
  yieldUnit: string;
  prepTime?: number;
  cookTime?: number;
  instructions?: string[] | string | any; // JSON field can be array, string, or other format
  version: number;
  isActive: boolean;
  emoji?: string; // Added for production module
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'; // Added for production module
  estimatedTotalTime?: number; // Added for production module
  equipmentRequired?: string[]; // Added for production module
  estimatedCost?: number; // Added for cost calculation
  imageUrl?: string; // Added for recipe images/avatars
  overheadPercentage?: number; // Added for custom overhead
  createdAt: string;
  updatedAt: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  rawMaterialId?: string;
  finishedProductId?: string;
  intermediateProductId?: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
  rawMaterial?: RawMaterial;
  finishedProduct?: FinishedProduct;
}

export interface RecipeCostAnalysis {
  recipeId: string;
  recipeName: string;
  yieldQuantity: number;
  yieldUnit: string;
  ingredients: IngredientCost[];
  totalMaterialCost: number;
  overheadCost: number;
  totalProductionCost: number;
  costPerUnit: number;
  lastUpdated: string;
}

export interface IngredientCost {
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface WhatCanIMakeAnalysis {
  totalRecipes: number;
  canMakeCount: number;
  recipes: RecipeAnalysis[];
}

export interface RecipeAnalysis {
  recipeId: string;
  recipeName: string;
  category: string;
  yieldQuantity: number;
  yieldUnit: string;
  canMake: boolean;
  maxBatches: number;
  missingIngredients: MissingIngredient[];
}

export interface MissingIngredient {
  name: string;
  needed: number;
  available: number;
  shortage: number;
}

export interface CreateRecipeData {
  name: string;
  description?: string;
  categoryId: string;
  yieldQuantity: number;
  yieldUnit: string;
  prepTime?: number;
  cookTime?: number;
  instructions?: string[];
  ingredients?: CreateRecipeIngredientData[];
  isActive?: boolean;
  imageUrl?: string;
}

export type RecipeIngredientType = 'RAW' | 'FINISHED';

export interface CreateRecipeIngredientData {
  rawMaterialId?: string; // present when ingredientType === 'RAW'
  finishedProductId?: string; // present when ingredientType === 'FINISHED'
  ingredientType: RecipeIngredientType;
  quantity: number;
  unit: string;
  notes?: string;
}

// Production types
export enum ProductionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export enum ProductionStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED'
}

export interface ProductionRun {
  id: string;
  name: string;
  recipeId: string;
  targetQuantity: number;
  targetUnit: string;
  status: ProductionStatus;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  estimatedFinish?: string;
  actualCost?: number;
  finalQuantity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  recipe?: Recipe;
  steps?: ProductionStep[];
}

export interface ProductionStep {
  id: string;
  productionRunId: string;
  name: string;
  description?: string;
  stepOrder: number;
  estimatedMinutes?: number;
  status: ProductionStepStatus;
  startedAt?: string;
  completedAt?: string;
  actualMinutes?: number;
  notes?: string;
  temperature?: number;
  equipmentUsed?: string[];
  qualityCheckPassed?: boolean;
  createdAt: string;
  updatedAt: string;
  productionRun?: ProductionRun;
}

export interface CreateProductionRunData {
  name: string;
  recipeId: string;
  targetQuantity: number;
  targetUnit: string;
  notes?: string;
  customSteps?: CreateProductionStepData[];
}

export interface CreateProductionStepData {
  name: string;
  description?: string;
  stepOrder: number;
  estimatedMinutes?: number;
}

export interface UpdateProductionRunData {
  name?: string;
  status?: ProductionStatus;
  completedAt?: string;
  finalQuantity?: number;
  actualCost?: number;
  notes?: string;
}

export interface UpdateProductionStepData {
  status?: ProductionStepStatus;
  startedAt?: string;
  completedAt?: string;
  actualMinutes?: number;
  notes?: string;
  temperature?: number;
  equipmentUsed?: string[];
  qualityCheckPassed?: boolean;
}

export interface CompleteProductionStepData {
  notes?: string;
  qualityNotes?: string;
  qualityCheckPassed?: boolean;
}

// Material Allocation types for production tracking
export interface MaterialAllocation {
  id: string;
  materialType: string;
  materialName: string;
  materialSku: string;
  materialBatchNumber?: string;
  quantityAllocated: number;
  quantityConsumed?: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: string;
  notes?: string;
  consumedAt?: string;
}

export interface MaterialBreakdown {
  finishedProduct: {
    id: string;
    name: string;
    batchNumber: string;
    productionDate: string;
    quantity: number;
    unit: string;
    costToProduce: number;
    sku: string;
  };
  productionRun: {
    id: string;
    name: string;
    recipe: {
      id: string;
      name: string;
      description: string;
      categoryId?: string;
      yieldQuantity: number;
      yieldUnit: string;
      prepTime?: number;
      cookTime?: number;
      instructions?: string[];
      version: number;
      isActive: boolean;
      emoji?: string;
      difficulty?: string;
      estimatedTotalTime?: number;
      estimatedCost?: number;
      equipmentRequired?: string[];
      createdAt: string;
      updatedAt: string;
    };
    completedAt: string;
  };
  materials: MaterialAllocation[];
  costBreakdown: {
    materialCost: number;
    totalCost: number;
    materials: MaterialAllocation[];
  };
  summary: {
    totalMaterialsUsed: number;
    totalMaterialCost: number;
    totalProductionCost: number;
    costPerUnit: number;
  };
}

// Customer Orders types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  orderCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  FULFILLED = 'FULFILLED'
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitProductionCost: number;
  unitPrice: number;
  lineProductionCost: number;
  linePrice: number;
  createdAt: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  expectedDeliveryDate: string;
  status: OrderStatus;
  totalProductionCost: number;
  totalPrice: number;
  priceMarkupPercentage: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  customer?: Customer;
  items?: OrderItem[];
}

export interface CreateOrderData {
  customerId: string;
  expectedDeliveryDate: string;
  priceMarkupPercentage?: number;
  notes?: string;
  items: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderInventoryCheck {
  available: boolean;
  insufficientProducts: Array<{
    productId: string;
    productName: string;
    requiredQuantity: number;
    availableQuantity: number;
    shortage: number;
  }>;
}

export interface OrderExportFilters {
  startDate?: string;
  endDate?: string;
  customerIds?: string[];
  statuses?: OrderStatus[];
}
