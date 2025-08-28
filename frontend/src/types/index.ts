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
  INTERMEDIATE = 'INTERMEDIATE',
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

// Intermediate Product types
export interface IntermediateProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  storageLocationId: string;
  recipeId?: string;
  batchNumber: string;
  productionDate: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  status: IntermediateProductStatus;
  contaminated: boolean;
  qualityStatus?: QualityStatus;
  qualityStatusId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (optional for populated data)
  category?: Category;
  storageLocation?: StorageLocation;
  recipe?: {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    yieldQuantity: number;
    yieldUnit: string;
    prepTime?: number;
    cookTime?: number;
    instructions?: string[];
    version: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export enum IntermediateProductStatus {
  IN_PRODUCTION = 'IN_PRODUCTION',
  COMPLETED = 'COMPLETED', 
  ON_HOLD = 'ON_HOLD',
  DISCARDED = 'DISCARDED'
}

// Raw Material types
export interface RawMaterial {
  id: string;
  name: string;
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
  createdAt: string;
  updatedAt: string;

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
  createdAt: string;
  updatedAt: string;
  ingredients?: RecipeIngredient[];
  intermediateProducts?: IntermediateProduct[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  rawMaterialId?: string;
  intermediateProductId?: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
  rawMaterial?: RawMaterial;
  intermediateProduct?: IntermediateProduct;
}

export interface RecipeCostAnalysis {
  recipeId: string;
  recipeName: string;
  yieldQuantity: number;
  yieldUnit: string;
  totalCost: number;
  costPerUnit: number;
  ingredientCosts: IngredientCost[];
  canMakeRecipe: boolean;
}

export interface IngredientCost {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  availableQuantity: number;
  canMake: boolean;
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
}

export interface CreateRecipeIngredientData {
  rawMaterialId?: string;
  intermediateProductId?: string;
  quantity: number;
  unit: string;
  notes?: string;
}
