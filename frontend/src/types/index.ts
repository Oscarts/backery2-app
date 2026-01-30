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

// SKU Reference types
export enum SkuItemType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  FINISHED_PRODUCT = 'FINISHED_PRODUCT'
}

export interface SkuReference {
  id: string;
  name: string;
  sku: string;
  description?: string;
  itemType: SkuItemType;
  unitPrice?: number;
  unit?: string;
  reorderLevel?: number;
  storageLocationId?: string;
  categoryId?: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: Category;
  storageLocation?: StorageLocation;
  _count?: {
    rawMaterials: number;
    finishedProducts: number;
  };
}

export interface CreateSkuReferenceData {
  name: string;
  sku?: string;
  description?: string;
  itemType: SkuItemType;
  unitPrice?: number;
  unit?: string;
  reorderLevel?: number;
  storageLocationId?: string;
  categoryId?: string;
}

export interface UpdateSkuReferenceData extends Partial<CreateSkuReferenceData> { }

export interface SkuReferenceUsage {
  skuReference: {
    id: string;
    name: string;
    sku: string;
  };
  usage: {
    rawMaterials: Array<{
      id: string;
      name: string;
      batchNumber: string;
      quantity: number;
      unit: string;
    }>;
    finishedProducts: Array<{
      id: string;
      name: string;
      batchNumber: string;
      quantity: number;
      unit: string;
    }>;
    totalCount: number;
  };
}

export enum ProductStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

// Raw Material types
export interface RawMaterial {
  id: string;
  name: string;
  sku?: string; // Unified SKU shared with finished products by name
  skuReferenceId?: string | null; // OPTIONAL: Link to SKU reference template
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
  reservedQuantity: number; // Amount allocated to active production runs
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
  skuReference?: SkuReference | null; // OPTIONAL: Populated SKU reference data
}

export interface CreateRawMaterialData {
  name: string;
  sku?: string;
  skuReferenceId?: string | null; // OPTIONAL: Link to SKU reference
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
  markupPercentage?: number; // Profit margin percentage (default 50%)
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
  sku?: string; // Optional - auto-generated from name if not provided
  categoryId: string;
  batchNumber: string;
  productionDate: string;
  expirationDate: string;
  shelfLife: number;
  quantity: number;
  unit: string;
  salePrice: number;
  costToProduce?: number;
  markupPercentage?: number; // Profit margin percentage
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
  markupPercentage?: number; // Profit margin percentage
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

export interface SkuMappingForRecipe {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unit?: string;
  category?: Category;
  availableQuantity: number;
  estimatedPrice: number;
  itemType: 'raw_material' | 'finished_product' | 'both' | 'none';
  hasRawMaterials: boolean;
  hasFinishedProducts: boolean;
  rawMaterialCount: number;
  finishedProductCount: number;
  earliestExpiration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  skuMappingId?: string;
  rawMaterialId?: string;
  finishedProductId?: string;
  intermediateProductId?: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
  skuMapping?: SkuMappingForRecipe;
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
  emoji?: string;
  imageUrl?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  estimatedTotalTime?: number;
  estimatedCost?: number;
  description?: string;
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

export type RecipeIngredientType = 'RAW' | 'FINISHED' | 'SKU';

export interface CreateRecipeIngredientData {
  skuMappingId?: string; // present when ingredientType === 'SKU'
  rawMaterialId?: string; // present when ingredientType === 'RAW' (legacy)
  finishedProductId?: string; // present when ingredientType === 'FINISHED' (legacy)
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
    overheadPercentage: number;
    overheadCost: number;
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
  tvaRate: number; // TVA/VAT rate in percentage (e.g., 20 for 20%)
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
  tvaRate?: number; // TVA/VAT rate - defaults to 20 if not provided
  notes?: string;
  items: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderInventoryCheck {
  canFulfill: boolean;
  insufficientProducts: Array<{
    productId: string;
    productName: string;
    required: number;
    available: number;
    shortage: number;
  }>;
}

export interface OrderExportFilters {
  startDate?: string;
  endDate?: string;
  customerIds?: string[];
  statuses?: OrderStatus[];
}

// Admin types for user/role management
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string | null;
  clientId: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    isActive: boolean;
  };
  customRole: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
  client?: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    users: number;
  };
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: string;
  permission: Permission;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}
