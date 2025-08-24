import { RawMaterial, Category, Supplier, StorageLocation, ApiResponse, PaginatedResponse, CategoryType } from '../types';

// Mock data
let mockCategories: Category[] = [
  // Raw Material Categories
  { id: '1', name: 'Flour', type: CategoryType.RAW_MATERIAL, description: 'Various types of flour', createdAt: '2024-01-01' },
  { id: '2', name: 'Sugar', type: CategoryType.RAW_MATERIAL, description: 'Sweeteners and sugars', createdAt: '2024-01-01' },
  { id: '3', name: 'Dairy', type: CategoryType.RAW_MATERIAL, description: 'Milk, butter, cream', createdAt: '2024-01-01' },
  { id: '4', name: 'Chocolate', type: CategoryType.RAW_MATERIAL, description: 'Cocoa and chocolate products', createdAt: '2024-01-01' },
  { id: '5', name: 'Spices', type: CategoryType.RAW_MATERIAL, description: 'Vanilla, cinnamon, etc.', createdAt: '2024-01-01' },
  
  // Intermediate Product Categories
  { id: '6', name: 'Dough', type: CategoryType.INTERMEDIATE, description: 'Pre-made doughs and bases', createdAt: '2024-01-01' },
  { id: '7', name: 'Fillings', type: CategoryType.INTERMEDIATE, description: 'Creams, jams, and fillings', createdAt: '2024-01-01' },
  { id: '8', name: 'Glazes', type: CategoryType.INTERMEDIATE, description: 'Icings and glazes', createdAt: '2024-01-01' },
  
  // Finished Product Categories
  { id: '9', name: 'Breads', type: CategoryType.FINISHED_PRODUCT, description: 'All types of bread', createdAt: '2024-01-01' },
  { id: '10', name: 'Pastries', type: CategoryType.FINISHED_PRODUCT, description: 'Croissants, danishes, etc.', createdAt: '2024-01-01' },
  { id: '11', name: 'Cakes', type: CategoryType.FINISHED_PRODUCT, description: 'Layer cakes and cupcakes', createdAt: '2024-01-01' },
  { id: '12', name: 'Cookies', type: CategoryType.FINISHED_PRODUCT, description: 'All cookie varieties', createdAt: '2024-01-01' },
  
  // Recipe Categories
  { id: '13', name: 'Basic Recipes', type: CategoryType.RECIPE, description: 'Fundamental baking recipes', createdAt: '2024-01-01' },
  { id: '14', name: 'Seasonal Recipes', type: CategoryType.RECIPE, description: 'Holiday and seasonal items', createdAt: '2024-01-01' },
];

const mockSuppliers: Supplier[] = [
  { 
    id: '1', 
    name: 'Premium Flour Co.', 
    contactInfo: { email: 'contact@premiumflour.com', phone: '+1-555-0101' }, 
    address: '123 Mill St, Wheat Valley, CA 90210', 
    isActive: true, 
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: '2', 
    name: 'Sweet Supply Inc.', 
    contactInfo: { email: 'info@sweetsupply.com', phone: '+1-555-0202' }, 
    address: '456 Sugar Ave, Sweettown, TX 75001', 
    isActive: true, 
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: '3', 
    name: 'Dairy Fresh Ltd.', 
    contactInfo: { email: 'sales@dairyfresh.com', phone: '+1-555-0303' }, 
    address: '789 Cream Rd, Milkshire, WI 53001', 
    isActive: true, 
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: '4', 
    name: 'Cocoa Masters', 
    contactInfo: { email: 'orders@cocoamasters.com', phone: '+1-555-0404' }, 
    address: '321 Chocolate Blvd, Cacao City, NY 10001', 
    isActive: true, 
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  { 
    id: '5', 
    name: 'Organic Vanilla Co.', 
    contactInfo: { email: 'hello@organicvanilla.com', phone: '+1-555-0505' }, 
    address: '987 Vanilla Lane, Spice Town, OR 97001', 
    isActive: true, 
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05'
  },
  { 
    id: '6', 
    name: 'Local Eggs Farm', 
    contactInfo: { email: 'farm@localeggs.com', phone: '+1-555-0606' }, 
    address: '654 Farm Road, Eggville, IA 50001', 
    isActive: true, 
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10'
  },
];

const mockStorageLocations: StorageLocation[] = [
  { 
    id: '1', 
    name: 'Dry Storage A', 
    type: 'DRY', 
    description: 'Main dry ingredients storage with climate control', 
    capacity: '500 kg', 
    createdAt: '2024-01-01' 
  },
  { 
    id: '2', 
    name: 'Cold Storage B', 
    type: 'COLD', 
    description: 'Refrigerated storage for dairy and perishables (2-8°C)', 
    capacity: '200 kg', 
    createdAt: '2024-01-01' 
  },
  { 
    id: '3', 
    name: 'Freezer C', 
    type: 'FROZEN', 
    description: 'Frozen storage unit (-18°C)', 
    capacity: '100 kg', 
    createdAt: '2024-01-01' 
  },
  { 
    id: '4', 
    name: 'Pantry D', 
    type: 'DRY', 
    description: 'Secondary dry storage for overflow items', 
    capacity: '300 kg', 
    createdAt: '2024-01-01' 
  },
  { 
    id: '5', 
    name: 'Spice Cabinet', 
    type: 'DRY', 
    description: 'Temperature-controlled storage for spices and extracts', 
    capacity: '50 kg', 
    createdAt: '2024-01-05' 
  },
  { 
    id: '6', 
    name: 'Prep Area Storage', 
    type: 'AMBIENT', 
    description: 'Quick access storage near preparation area', 
    capacity: '75 kg', 
    createdAt: '2024-01-08' 
  },
];

let mockRawMaterials: RawMaterial[] = [
  {
    id: '1',
    name: 'All-Purpose Flour',
    description: 'High-quality all-purpose flour for baking',
    categoryId: '1',
    supplierId: '1',
    storageLocationId: '1',
    quantity: 45.5,
    unit: 'kg',
    unitPrice: 2.50,
    reorderLevel: 10,
    expirationDate: '2024-12-31',
    batchNumber: 'FL-2024-001',
    isContaminated: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Granulated Sugar',
    description: 'Pure white granulated sugar',
    categoryId: '2',
    supplierId: '2',
    storageLocationId: '1',
    quantity: 25.0,
    unit: 'kg',
    unitPrice: 1.80,
    reorderLevel: 15,
    expirationDate: '2025-06-30',
    batchNumber: 'SG-2024-007',
    isContaminated: false,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Unsalted Butter',
    description: 'Premium unsalted butter',
    categoryId: '3',
    supplierId: '3',
    storageLocationId: '2',
    quantity: 12.5,
    unit: 'kg',
    unitPrice: 6.20,
    reorderLevel: 5,
    expirationDate: '2024-02-15',
    batchNumber: 'BT-2024-003',
    isContaminated: false,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'Dark Chocolate',
    description: '70% cocoa dark chocolate chips',
    categoryId: '4',
    supplierId: '4',
    storageLocationId: '1',
    quantity: 8.2,
    unit: 'kg',
    unitPrice: 12.50,
    reorderLevel: 3,
    expirationDate: '2024-08-30',
    batchNumber: 'CH-2024-012',
    isContaminated: false,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-12',
  },
  {
    id: '5',
    name: 'Vanilla Extract',
    description: 'Pure vanilla extract',
    categoryId: '5',
    supplierId: '1',
    storageLocationId: '1',
    quantity: 2.5,
    unit: 'L',
    unitPrice: 45.00,
    reorderLevel: 1,
    expirationDate: '2026-01-15',
    batchNumber: 'VN-2024-005',
    isContaminated: false,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08',
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API implementation
export const rawMaterialsApi = {
  getAll: async (params?: any): Promise<PaginatedResponse<RawMaterial>> => {
    await delay(500);
    
    let filtered = [...mockRawMaterials];
    
    // Apply filters
    if (params?.search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(params.search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(params.search.toLowerCase()))
      );
    }
    
    if (params?.categoryId) {
      filtered = filtered.filter(item => item.categoryId === params.categoryId);
    }
    
    if (params?.supplierId) {
      filtered = filtered.filter(item => item.supplierId === params.supplierId);
    }
    
    if (params?.showExpiring) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => {
        const expDate = new Date(item.expirationDate);
        return expDate <= thirtyDaysFromNow;
      });
    }
    
    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filtered.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    };
  },

  getById: async (id: string): Promise<ApiResponse<RawMaterial>> => {
    await delay(300);
    const item = mockRawMaterials.find(rm => rm.id === id);
    if (!item) {
      throw new Error('Raw material not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<RawMaterial>> => {
    await delay(800);
    const newItem: RawMaterial = {
      ...data,
      id: (mockRawMaterials.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRawMaterials.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<RawMaterial, 'id' | 'createdAt'>>): Promise<ApiResponse<RawMaterial>> => {
    await delay(700);
    const index = mockRawMaterials.findIndex(rm => rm.id === id);
    if (index === -1) {
      throw new Error('Raw material not found');
    }
    
    mockRawMaterials[index] = {
      ...mockRawMaterials[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return { success: true, data: mockRawMaterials[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockRawMaterials.findIndex(rm => rm.id === id);
    if (index === -1) {
      throw new Error('Raw material not found');
    }
    
    mockRawMaterials.splice(index, 1);
    return { success: true, data: undefined };
  },
};

export const categoriesApi = {
  getAll: async (type?: string): Promise<ApiResponse<Category[]>> => {
    await delay(300);
    let filtered = [...mockCategories];
    if (type) {
      filtered = filtered.filter(cat => cat.type === type);
    }
    return { success: true, data: filtered };
  },

  getById: async (id: string): Promise<ApiResponse<Category>> => {
    await delay(300);
    const item = mockCategories.find(cat => cat.id === id);
    if (!item) {
      throw new Error('Category not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<Category, 'id' | 'createdAt'>): Promise<ApiResponse<Category>> => {
    await delay(800);
    const newItem: Category = {
      ...data,
      id: (mockCategories.length + 1).toString(),
      createdAt: new Date().toISOString(),
    };
    mockCategories.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<ApiResponse<Category>> => {
    await delay(700);
    const index = mockCategories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }
    
    mockCategories[index] = {
      ...mockCategories[index],
      ...data,
    };
    
    return { success: true, data: mockCategories[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockCategories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }
    
    mockCategories.splice(index, 1);
    return { success: true, data: undefined };
  },
};

export const suppliersApi = {
  getAll: async (): Promise<ApiResponse<Supplier[]>> => {
    await delay(300);
    return { success: true, data: mockSuppliers.filter(s => s.isActive !== false) };
  },

  getById: async (id: string): Promise<ApiResponse<Supplier>> => {
    await delay(300);
    const item = mockSuppliers.find(sup => sup.id === id);
    if (!item) {
      throw new Error('Supplier not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Supplier>> => {
    await delay(800);
    const newItem: Supplier = {
      ...data,
      id: (mockSuppliers.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockSuppliers.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Promise<ApiResponse<Supplier>> => {
    await delay(700);
    const index = mockSuppliers.findIndex(sup => sup.id === id);
    if (index === -1) {
      throw new Error('Supplier not found');
    }
    
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return { success: true, data: mockSuppliers[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockSuppliers.findIndex(sup => sup.id === id);
    if (index === -1) {
      throw new Error('Supplier not found');
    }
    
    mockSuppliers.splice(index, 1);
    return { success: true, data: undefined };
  },
};

export const storageLocationsApi = {
  getAll: async (): Promise<ApiResponse<StorageLocation[]>> => {
    await delay(300);
    return { success: true, data: mockStorageLocations };
  },

  getById: async (id: string): Promise<ApiResponse<StorageLocation>> => {
    await delay(300);
    const item = mockStorageLocations.find(loc => loc.id === id);
    if (!item) {
      throw new Error('Storage location not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<StorageLocation, 'id' | 'createdAt'>): Promise<ApiResponse<StorageLocation>> => {
    await delay(800);
    const newItem: StorageLocation = {
      ...data,
      id: (mockStorageLocations.length + 1).toString(),
      createdAt: new Date().toISOString(),
    };
    mockStorageLocations.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<StorageLocation, 'id' | 'createdAt'>>): Promise<ApiResponse<StorageLocation>> => {
    await delay(700);
    const index = mockStorageLocations.findIndex(loc => loc.id === id);
    if (index === -1) {
      throw new Error('Storage location not found');
    }
    
    mockStorageLocations[index] = {
      ...mockStorageLocations[index],
      ...data,
    };
    
    return { success: true, data: mockStorageLocations[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockStorageLocations.findIndex(loc => loc.id === id);
    if (index === -1) {
      throw new Error('Storage location not found');
    }
    
    mockStorageLocations.splice(index, 1);
    return { success: true, data: undefined };
  },
};
