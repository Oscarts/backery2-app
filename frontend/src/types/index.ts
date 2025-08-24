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
  costPerUnit?: number;
  unitPrice: number;
  reorderLevel: number;
  storageLocationId: string;
  contaminated?: boolean;
  isContaminated: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: Category;
  supplier?: Supplier;
  storageLocation?: StorageLocation;
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
  costPerUnit: number;
  storageLocationId: string;
}

export interface UpdateRawMaterialData extends Partial<CreateRawMaterialData> {
  contaminated?: boolean;
}

// Intermediate Product types
export interface IntermediateProduct {
  id: string;
  name: string;
  batchNumber: string;
  productionDate: string;
  expirationDate: string;
  quantity: number;
  unit: string;
  storageLocationId: string;
  contaminated: boolean;
  qualityStatus: QualityStatus;
  createdAt: string;
  updatedAt: string;

  // Relations
  storageLocation?: StorageLocation;
}

export enum QualityStatus {
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
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: Category;
  storageLocation?: StorageLocation;
}

// Recipe types
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  yieldQuantity: number;
  yieldUnit: string;
  prepTime: number;
  instructions: any;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: Category;
  createdBy?: User;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientType: IngredientType;
  ingredientId: string;
  quantity: number;
  unit: string;
  optional: boolean;
}

export enum IngredientType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  INTERMEDIATE_PRODUCT = 'INTERMEDIATE_PRODUCT',
  FINISHED_PRODUCT = 'FINISHED_PRODUCT'
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
