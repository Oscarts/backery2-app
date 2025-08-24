import {
  RawMaterial,
  CreateRawMaterialData,
  UpdateRawMaterialData,
  Category,
  Supplier,
  StorageLocation,
  ApiResponse,
  PaginatedResponse
} from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

// Raw Materials API
export const rawMaterialsApi = {
  // Get all raw materials with optional filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    supplierId?: string;
    expiringSoon?: boolean;
    contaminated?: boolean;
  }): Promise<PaginatedResponse<RawMaterial>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.supplierId) queryParams.append('supplierId', params.supplierId);
    if (params?.expiringSoon) queryParams.append('expiringSoon', 'true');
    if (params?.contaminated !== undefined) queryParams.append('contaminated', params.contaminated.toString());

    const url = `/raw-materials${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiGet<PaginatedResponse<RawMaterial>>(url);
  },

  // Get single raw material by ID
  getById: async (id: string): Promise<ApiResponse<RawMaterial>> => {
    return apiGet<ApiResponse<RawMaterial>>(`/raw-materials/${id}`);
  },

  // Create new raw material
  create: async (data: CreateRawMaterialData): Promise<ApiResponse<RawMaterial>> => {
    return apiPost<ApiResponse<RawMaterial>, CreateRawMaterialData>('/raw-materials', data);
  },

  // Update raw material
  update: async (id: string, data: UpdateRawMaterialData): Promise<ApiResponse<RawMaterial>> => {
    return apiPut<ApiResponse<RawMaterial>, UpdateRawMaterialData>(`/raw-materials/${id}`, data);
  },

  // Delete raw material
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<ApiResponse<void>>(`/raw-materials/${id}`);
  },

  // Mark as contaminated
  markContaminated: async (id: string, reason: string): Promise<ApiResponse<RawMaterial>> => {
    return apiPut<ApiResponse<RawMaterial>>(`/raw-materials/${id}/contaminate`, { reason });
  },

  // Get expiring items
  getExpiring: async (days: number = 7): Promise<ApiResponse<RawMaterial[]>> => {
    return apiGet<ApiResponse<RawMaterial[]>>(`/raw-materials/expiring?days=${days}`);
  },

  // Get low stock items
  getLowStock: async (threshold?: number): Promise<ApiResponse<RawMaterial[]>> => {
    const url = threshold ? `/raw-materials/low-stock?threshold=${threshold}` : '/raw-materials/low-stock';
    return apiGet<ApiResponse<RawMaterial[]>>(url);
  }
};

// Categories API
export const categoriesApi = {
  getAll: async (type?: string): Promise<ApiResponse<Category[]>> => {
    const url = type ? `/categories?type=${type}` : '/categories';
    return apiGet<ApiResponse<Category[]>>(url);
  },

  getById: async (id: string): Promise<ApiResponse<Category>> => {
    return apiGet<ApiResponse<Category>>(`/categories/${id}`);
  },

  create: async (data: Omit<Category, 'id' | 'createdAt'>): Promise<ApiResponse<Category>> => {
    return apiPost<ApiResponse<Category>>('/categories', data);
  },

  update: async (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<ApiResponse<Category>> => {
    return apiPut<ApiResponse<Category>>(`/categories/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<ApiResponse<void>>(`/categories/${id}`);
  }
};

// Suppliers API
export const suppliersApi = {
  getAll: async (): Promise<ApiResponse<Supplier[]>> => {
    return apiGet<ApiResponse<Supplier[]>>('/suppliers');
  },

  getById: async (id: string): Promise<ApiResponse<Supplier>> => {
    return apiGet<ApiResponse<Supplier>>(`/suppliers/${id}`);
  },

  create: async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Supplier>> => {
    return apiPost<ApiResponse<Supplier>>('/suppliers', data);
  },

  update: async (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Supplier>> => {
    return apiPut<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<ApiResponse<void>>(`/suppliers/${id}`);
  }
};

// Storage Locations API
export const storageLocationsApi = {
  getAll: async (): Promise<ApiResponse<StorageLocation[]>> => {
    return apiGet<ApiResponse<StorageLocation[]>>('/storage-locations');
  },

  getById: async (id: string): Promise<ApiResponse<StorageLocation>> => {
    return apiGet<ApiResponse<StorageLocation>>(`/storage-locations/${id}`);
  },

  create: async (data: Omit<StorageLocation, 'id' | 'createdAt'>): Promise<ApiResponse<StorageLocation>> => {
    return apiPost<ApiResponse<StorageLocation>>('/storage-locations', data);
  },

  update: async (id: string, data: Partial<Omit<StorageLocation, 'id' | 'createdAt'>>): Promise<ApiResponse<StorageLocation>> => {
    return apiPut<ApiResponse<StorageLocation>>(`/storage-locations/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<ApiResponse<void>>(`/storage-locations/${id}`);
  }
};
