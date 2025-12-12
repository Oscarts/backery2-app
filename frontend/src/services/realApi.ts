// Real API service for backend communication
import {
  Category,
  StorageLocation,
  Unit,
  RawMaterial,
  CreateRawMaterialData,
  UpdateRawMaterialData,
  FinishedProduct,
  CreateFinishedProductData,
  UpdateFinishedProductData,
  Supplier,
  ApiResponse,
  ProductionRun,
  ProductionStep,
  CreateProductionRunData,
  UpdateProductionRunData,
  UpdateProductionStepData,
  CompleteProductionStepData,
  MaterialBreakdown,
  Customer,
  CreateCustomerData,
  CustomerOrder,
  CreateOrderData,
  OrderInventoryCheck,
  OrderExportFilters
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for API calls
const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    return apiCall<Category[]>('/categories');
  },

  getById: async (id: string): Promise<ApiResponse<Category>> => {
    return apiCall<Category>(`/categories/${id}`);
  },

  create: async (data: Omit<Category, 'id' | 'createdAt'>): Promise<ApiResponse<Category>> => {
    return apiCall<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Category>): Promise<ApiResponse<Category>> => {
    return apiCall<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Storage Locations API
export const storageLocationsApi = {
  getAll: async (): Promise<ApiResponse<StorageLocation[]>> => {
    return apiCall<StorageLocation[]>('/storage-locations');
  },

  getById: async (id: string): Promise<ApiResponse<StorageLocation>> => {
    return apiCall<StorageLocation>(`/storage-locations/${id}`);
  },

  create: async (data: Omit<StorageLocation, 'id' | 'createdAt'>): Promise<ApiResponse<StorageLocation>> => {
    return apiCall<StorageLocation>('/storage-locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<StorageLocation>): Promise<ApiResponse<StorageLocation>> => {
    return apiCall<StorageLocation>(`/storage-locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/storage-locations/${id}`, {
      method: 'DELETE',
    });
  },
};

// Units API
export const unitsApi = {
  getAll: async (): Promise<ApiResponse<Unit[]>> => {
    return apiCall<Unit[]>('/units');
  },

  getById: async (id: string): Promise<ApiResponse<Unit>> => {
    return apiCall<Unit>(`/units/${id}`);
  },

  create: async (data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Unit>> => {
    return apiCall<Unit>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> => {
    return apiCall<Unit>(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/units/${id}`, {
      method: 'DELETE',
    });
  },
};

// Suppliers API
export const suppliersApi = {
  getAll: async (): Promise<ApiResponse<Supplier[]>> => {
    return apiCall<Supplier[]>('/suppliers');
  },

  getById: async (id: string): Promise<ApiResponse<Supplier>> => {
    return apiCall<Supplier>(`/suppliers/${id}`);
  },

  create: async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Supplier>> => {
    return apiCall<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    return apiCall<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Raw Materials API
export const rawMaterialsApi = {
  getAll: async (): Promise<ApiResponse<RawMaterial[]>> => {
    return apiCall<RawMaterial[]>('/raw-materials');
  },

  getById: async (id: string): Promise<ApiResponse<RawMaterial>> => {
    return apiCall<RawMaterial>(`/raw-materials/${id}`);
  },

  create: async (data: CreateRawMaterialData): Promise<ApiResponse<RawMaterial>> => {
    return apiCall<RawMaterial>('/raw-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateRawMaterialData): Promise<ApiResponse<RawMaterial>> => {
    return apiCall<RawMaterial>(`/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/raw-materials/${id}`, {
      method: 'DELETE',
    });
  },

  getSkuMappings: async (): Promise<ApiResponse<Array<{ name: string; sku: string; source: string }>>> => {
    return apiCall<Array<{ name: string; sku: string; source: string }>>('/raw-materials/sku-mappings');
  },

  checkSkuUsage: async (name: string): Promise<ApiResponse<{ inUse: boolean; rawMaterialCount: number; finishedProductCount: number }>> => {
    return apiCall<{ inUse: boolean; rawMaterialCount: number; finishedProductCount: number }>(
      `/raw-materials/sku-mappings/${encodeURIComponent(name)}/usage`
    );
  },

  deleteSkuMapping: async (name: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/raw-materials/sku-mappings/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
};

// Finished Products API
export const finishedProductsApi = {
  getAll: async (): Promise<ApiResponse<FinishedProduct[]>> => {
    return apiCall<FinishedProduct[]>('/finished-products');
  },

  getById: async (id: string): Promise<ApiResponse<FinishedProduct>> => {
    return apiCall<FinishedProduct>(`/finished-products/${id}`);
  },

  create: async (data: CreateFinishedProductData): Promise<ApiResponse<FinishedProduct>> => {
    return apiCall<FinishedProduct>('/finished-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateFinishedProductData): Promise<ApiResponse<FinishedProduct>> => {
    return apiCall<FinishedProduct>(`/finished-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/finished-products/${id}`, {
      method: 'DELETE',
    });
  },

  getExpiring: async (days?: number): Promise<ApiResponse<FinishedProduct[]>> => {
    const params = days ? `?days=${days}` : '';
    return apiCall<FinishedProduct[]>(`/finished-products/expiring${params}`);
  },

  getLowStock: async (threshold?: number): Promise<ApiResponse<FinishedProduct[]>> => {
    const params = threshold ? `?threshold=${threshold}` : '';
    return apiCall<FinishedProduct[]>(`/finished-products/low-stock${params}`);
  },

  reserveQuantity: async (id: string, quantity: number, reason?: string): Promise<ApiResponse<FinishedProduct>> => {
    return apiCall<FinishedProduct>(`/finished-products/${id}/reserve`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, reason }),
    });
  },

  releaseReservation: async (id: string, quantity: number, reason?: string): Promise<ApiResponse<FinishedProduct>> => {
    return apiCall<FinishedProduct>(`/finished-products/${id}/release`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, reason }),
    });
  },

  // Fetch material & cost breakdown for a finished product (traceability endpoint)
  getMaterialBreakdown: async (id: string): Promise<ApiResponse<MaterialBreakdown>> => {
    return apiCall<MaterialBreakdown>(`/production/finished-products/${id}/materials`);
  },
};

// Quality Status API
export const qualityStatusApi = {
  getAll: async () => {
    return apiCall('/quality-statuses');
  },

  getById: async (id: string) => {
    return apiCall(`/quality-statuses/${id}`);
  },

  create: async (data: {
    name: string;
    description?: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => {
    return apiCall('/quality-statuses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    name?: string;
    description?: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => {
    return apiCall(`/quality-statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/quality-statuses/${id}`, {
      method: 'DELETE',
    });
  },

  getUsage: async (id: string) => {
    return apiCall(`/quality-statuses/${id}/usage`);
  },
};

// Recipe API
import { Recipe, CreateRecipeData, RecipeCostAnalysis, WhatCanIMakeAnalysis } from '../types';

export const recipesApi = {
  getAll: async (): Promise<ApiResponse<Recipe[]>> => {
    return apiCall<Recipe[]>('/recipes');
  },

  getById: async (id: string): Promise<ApiResponse<Recipe>> => {
    return apiCall<Recipe>(`/recipes/${id}`);
  },

  create: async (data: CreateRecipeData): Promise<ApiResponse<Recipe>> => {
    return apiCall<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateRecipeData>): Promise<ApiResponse<Recipe>> => {
    return apiCall<Recipe>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/recipes/${id}`, {
      method: 'DELETE',
    });
  },

  getCost: async (id: string): Promise<ApiResponse<RecipeCostAnalysis>> => {
    return apiCall<RecipeCostAnalysis>(`/recipes/${id}/cost`);
  },

  getWhatCanIMake: async (): Promise<ApiResponse<WhatCanIMakeAnalysis>> => {
    return apiCall<WhatCanIMakeAnalysis>('/recipes/what-can-i-make');
  }
};

// Production API
export const productionApi = {
  // Production Runs
  getRuns: async (): Promise<ApiResponse<ProductionRun[]>> => {
    return apiCall<ProductionRun[]>('/production/runs');
  },

  getDashboardRuns: async (): Promise<ApiResponse<ProductionRun[]>> => {
    return apiCall<ProductionRun[]>('/production/runs/dashboard');
  },

  getStats: async (): Promise<ApiResponse<{
    active: number;
    onHold: number;
    planned: number;
    completedToday: number;
    totalItemsProducedToday: number;
  }>> => {
    return apiCall('/production/runs/stats');
  },

  getCompletedRuns: async (limit?: number, offset?: number): Promise<ApiResponse<ProductionRun[]>> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return apiCall<ProductionRun[]>(`/production/runs/completed?${params.toString()}`);
  },

  getRunById: async (id: string): Promise<ApiResponse<ProductionRun>> => {
    return apiCall<ProductionRun>(`/production/runs/${id}`);
  },

  createRun: async (data: CreateProductionRunData): Promise<ApiResponse<ProductionRun>> => {
    return apiCall<ProductionRun>('/production/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRun: async (id: string, data: UpdateProductionRunData): Promise<ApiResponse<ProductionRun>> => {
    return apiCall<ProductionRun>(`/production/runs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteRun: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/production/runs/${id}`, {
      method: 'DELETE',
    });
  },

  // Production Steps
  getSteps: async (productionRunId: string): Promise<ApiResponse<ProductionStep[]>> => {
    return apiCall<ProductionStep[]>(`/production/runs/${productionRunId}/steps`);
  },

  getStepById: async (id: string): Promise<ApiResponse<ProductionStep>> => {
    return apiCall<ProductionStep>(`/production/steps/${id}`);
  },

  updateStep: async (id: string, data: UpdateProductionStepData): Promise<ApiResponse<ProductionStep>> => {
    return apiCall<ProductionStep>(`/production/steps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  startStep: async (id: string): Promise<ApiResponse<ProductionStep>> => {
    return apiCall<ProductionStep>(`/production/steps/${id}/start`, {
      method: 'POST',
    });
  },

  completeStep: async (id: string, data: CompleteProductionStepData): Promise<ApiResponse<ProductionStep>> => {
    return apiCall<ProductionStep>(`/production/steps/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logQualityCheckpoint: async (id: string, data: {
    checkpointType: string;
    qualityStatus: 'PASS' | 'FAIL' | 'WARNING';
    measurements?: Record<string, any>;
    notes?: string;
    photos?: string[];
    checkedByUserId?: string;
  }): Promise<ApiResponse<{
    productionStep: ProductionStep;
    checkpoint: any;
    alerts: string[];
  }>> => {
    return apiCall(`/production/steps/${id}/quality-check`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dynamic Step Management
  addStep: async (productionRunId: string, data: {
    name: string;
    description?: string;
    estimatedMinutes: number;
    insertAfterStepId?: string;
  }): Promise<ApiResponse<{
    newStep: ProductionStep;
    allSteps: ProductionStep[];
  }>> => {
    return apiCall(`/production/runs/${productionRunId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeStep: async (stepId: string): Promise<ApiResponse<{
    removedStepId: string;
    allSteps: ProductionStep[];
  }>> => {
    return apiCall(`/production/steps/${stepId}`, {
      method: 'DELETE',
    });
  },

  // Production Step Templates
  getDefaultStepTemplates: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>('/production/step-templates/default');
  },

  getRecipeStepTemplates: async (recipeId: string): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>(`/production/step-templates/recipe/${recipeId}`);
  },

  createCustomStepTemplate: async (recipeId: string, data: {
    name: string;
    description?: string;
    estimatedMinutes: number;
    order: number;
    isRequired?: boolean;
  }): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/production/step-templates/recipe/${recipeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// Customers API
export const customersApi = {
  getAll: async (search?: string): Promise<ApiResponse<Customer[]>> => {
    const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiCall<Customer[]>(`/customers${queryParams}`);
  },

  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    return apiCall<Customer>(`/customers/${id}`);
  },

  create: async (data: CreateCustomerData): Promise<ApiResponse<Customer>> => {
    return apiCall<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateCustomerData>): Promise<ApiResponse<Customer>> => {
    return apiCall<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Customer Orders API
export const customerOrdersApi = {
  getAll: async (filters?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<CustomerOrder[]>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    return apiCall<CustomerOrder[]>(`/customer-orders${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string): Promise<ApiResponse<CustomerOrder>> => {
    return apiCall<CustomerOrder>(`/customer-orders/${id}`);
  },

  create: async (data: CreateOrderData): Promise<ApiResponse<CustomerOrder>> => {
    return apiCall<CustomerOrder>('/customer-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateOrderData>): Promise<ApiResponse<CustomerOrder>> => {
    return apiCall<CustomerOrder>(`/customer-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/customer-orders/${id}`, {
      method: 'DELETE',
    });
  },

  // Status transitions
  confirmOrder: async (id: string): Promise<ApiResponse<CustomerOrder>> => {
    return apiCall<CustomerOrder>(`/customer-orders/${id}/confirm`, {
      method: 'POST',
    });
  },

  revertToDraft: async (id: string): Promise<ApiResponse<CustomerOrder>> => {
    return apiCall<CustomerOrder>(`/customer-orders/${id}/revert-draft`, {
      method: 'POST',
    });
  },

  fulfillOrder: async (id: string): Promise<ApiResponse<CustomerOrder>> => {
    return apiCall<CustomerOrder>(`/customer-orders/${id}/fulfill`, {
      method: 'POST',
    });
  },

  // Inventory check
  checkInventory: async (id: string): Promise<ApiResponse<OrderInventoryCheck>> => {
    return apiCall<OrderInventoryCheck>(`/customer-orders/${id}/inventory-check`);
  },

  // Export functions
  exportPDF: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/customer-orders/${id}/export/pdf`);
    if (!response.ok) {
      throw new Error(`Failed to export PDF: ${response.statusText}`);
    }
    return response.blob();
  },

  exportExcel: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/customer-orders/${id}/export/excel`);
    if (!response.ok) {
      throw new Error(`Failed to export Excel: ${response.statusText}`);
    }
    return response.blob();
  },

  exportBulkExcel: async (filters: OrderExportFilters): Promise<Blob> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/customer-orders/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(filters),
    });
    if (!response.ok) {
      throw new Error(`Failed to export bulk Excel: ${response.statusText}`);
    }
    return response.blob();
  },

  // Export as professional Word document (DOCX) with multi-language support
  exportWord: async (id: string, language: 'fr' | 'en' | 'es' = 'fr'): Promise<Blob> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/customer-orders/${id}/export/word?lang=${language}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to export Word: ${response.statusText}`);
    }
    return response.blob();
  },
};

// Admin - Users API
export const usersApi = {
  getAll: async (): Promise<ApiResponse<import('../types').AdminUser[]>> => {
    return apiCall<import('../types').AdminUser[]>('/users');
  },

  getById: async (id: string): Promise<ApiResponse<import('../types').AdminUser>> => {
    return apiCall<import('../types').AdminUser>(`/users/${id}`);
  },

  create: async (data: import('../types').CreateUserData): Promise<ApiResponse<import('../types').AdminUser>> => {
    return apiCall<import('../types').AdminUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: import('../types').UpdateUserData): Promise<ApiResponse<import('../types').AdminUser>> => {
    return apiCall<import('../types').AdminUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin - Roles API
export const rolesApi = {
  getAll: async (): Promise<ApiResponse<import('../types').Role[]>> => {
    return apiCall<import('../types').Role[]>('/roles');
  },

  getById: async (id: string): Promise<ApiResponse<import('../types').Role>> => {
    return apiCall<import('../types').Role>(`/roles/${id}`);
  },

  create: async (data: import('../types').CreateRoleData): Promise<ApiResponse<import('../types').Role>> => {
    return apiCall<import('../types').Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: import('../types').UpdateRoleData): Promise<ApiResponse<import('../types').Role>> => {
    return apiCall<import('../types').Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin - Permissions API
export const permissionsApi = {
  getAll: async (): Promise<ApiResponse<import('../types').Permission[]>> => {
    return apiCall<import('../types').Permission[]>('/permissions');
  },
};
