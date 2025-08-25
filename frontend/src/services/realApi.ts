// Real API service for backend communication
import { 
  IntermediateProduct, 
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
  ApiResponse 
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function for API calls
const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
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

// Intermediate Products API
export const intermediateProductsApi = {
  getAll: async (): Promise<ApiResponse<IntermediateProduct[]>> => {
    return apiCall<IntermediateProduct[]>('/intermediate-products');
  },

  getById: async (id: string): Promise<ApiResponse<IntermediateProduct>> => {
    return apiCall<IntermediateProduct>(`/intermediate-products/${id}`);
  },

  create: async (data: Omit<IntermediateProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<IntermediateProduct>> => {
    return apiCall<IntermediateProduct>('/intermediate-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<IntermediateProduct>): Promise<ApiResponse<IntermediateProduct>> => {
    return apiCall<IntermediateProduct>(`/intermediate-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/intermediate-products/${id}`, {
      method: 'DELETE',
    });
  },
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
};
