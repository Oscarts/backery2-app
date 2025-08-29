import {
  RawMaterial,
  Category,
  Supplier,
  StorageLocation,
  IntermediateProduct,
  IntermediateProductStatus,
  FinishedProduct,
  QualityStatus,
  Unit,
  CreateRawMaterialData,
  UpdateRawMaterialData,
  CreateFinishedProductData,
  UpdateFinishedProductData,
  ApiResponse,
  PaginatedResponse,
  CategoryType
} from '../types';

// Mock Quality Status data
const mockQualityStatuses: QualityStatus[] = [
  {
    id: 'approved',
    name: 'Approved',
    description: 'Product meets all quality standards',
    color: '#4caf50',
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'pending',
    name: 'Pending',
    description: 'Awaiting quality inspection',
    color: '#ff9800',
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rejected',
    name: 'Rejected',
    description: 'Does not meet quality standards',
    color: '#f44336',
    isActive: true,
    sortOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Units data
const mockUnits: Unit[] = [
  {
    id: '1',
    name: 'Kilogram',
    symbol: 'kg',
    category: 'Weight',
    description: 'Standard unit for weight measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Gram',
    symbol: 'g',
    category: 'Weight',
    description: 'Small unit for weight measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Liter',
    symbol: 'L',
    category: 'Volume',
    description: 'Standard unit for liquid measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Milliliter',
    symbol: 'ml',
    category: 'Volume',
    description: 'Small unit for liquid measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Pieces',
    symbol: 'pcs',
    category: 'Count',
    description: 'Count of individual items',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Finished Products data
let mockFinishedProducts: FinishedProduct[] = [
  {
    id: '1',
    name: 'Chocolate Croissant',
    sku: 'CHC-001',
    categoryId: '10', // Pastries
    batchNumber: 'FP-2024-001',
    productionDate: '2024-08-28',
    expirationDate: '2024-08-30',
    shelfLife: 2,
    quantity: 24,
    reservedQuantity: 0,
    unit: 'pcs',
    salePrice: 4.50,
    costToProduce: 2.25,
    packagingInfo: 'Individual paper wrapper',
    storageLocationId: '2',
    qualityStatusId: 'approved',
    createdAt: '2024-08-28T00:00:00Z',
    updatedAt: '2024-08-28T00:00:00Z'
  },
  {
    id: '2',
    name: 'Sourdough Bread',
    sku: 'SDB-001',
    categoryId: '9', // Breads
    batchNumber: 'FP-2024-002',
    productionDate: '2024-08-28',
    expirationDate: '2024-08-31',
    shelfLife: 3,
    quantity: 12,
    reservedQuantity: 3,
    unit: 'loaves',
    salePrice: 8.00,
    costToProduce: 3.50,
    packagingInfo: 'Bakery bag',
    storageLocationId: '1',
    qualityStatusId: 'approved',
    createdAt: '2024-08-28T00:00:00Z',
    updatedAt: '2024-08-28T00:00:00Z'
  },
  {
    id: '3',
    name: 'Chocolate Chip Cookies',
    sku: 'CCC-001',
    categoryId: '12', // Cookies
    batchNumber: 'FP-2024-003',
    productionDate: '2024-08-27',
    expirationDate: '2024-09-03',
    shelfLife: 7,
    quantity: 36,
    reservedQuantity: 6,
    unit: 'pcs',
    salePrice: 2.25,
    costToProduce: 1.00,
    packagingInfo: 'Clear container',
    storageLocationId: '1',
    qualityStatusId: 'pending',
    createdAt: '2024-08-27T00:00:00Z',
    updatedAt: '2024-08-27T00:00:00Z'
  }
];

// Mock data
let mockIntermediateProducts: IntermediateProduct[] = [
  {
    id: '1',
    name: 'Basic Bread Dough',
    description: 'Pre-fermented bread dough base',
    categoryId: '6', // Dough category
    storageLocationId: '3',
    recipeId: '1',
    batchNumber: 'BD001',
    productionDate: '2024-08-20',
    expirationDate: '2024-08-22',
    quantity: 25.5,
    unit: 'kg',
    status: IntermediateProductStatus.COMPLETED,
    contaminated: false,
    qualityStatus: mockQualityStatuses[0], // Approved
    createdAt: '2024-08-20',
    updatedAt: '2024-08-20'
  },
  {
    id: '2',
    name: 'Vanilla Pastry Cream',
    description: 'Basic pastry cream for fillings',
    categoryId: '7', // Fillings category
    storageLocationId: '2',
    recipeId: '2',
    batchNumber: 'PC001',
    productionDate: '2024-08-24',
    expirationDate: '2024-08-26',
    quantity: 10,
    unit: 'L',
    status: IntermediateProductStatus.IN_PRODUCTION,
    contaminated: false,
    qualityStatus: mockQualityStatuses[1], // Pending
    createdAt: '2024-08-24',
    updatedAt: '2024-08-24'
  },
  {
    id: '3',
    name: 'Chocolate Ganache',
    description: 'Dark chocolate ganache for cake coating',
    categoryId: '8', // Glazes category
    storageLocationId: '4',
    recipeId: '3',
    batchNumber: 'CG001',
    productionDate: '2024-08-23',
    expirationDate: '2024-08-30',
    quantity: 15,
    unit: 'kg',
    status: IntermediateProductStatus.COMPLETED,
    contaminated: false,
    qualityStatus: mockQualityStatuses[0], // Approved
    createdAt: '2024-08-23',
    updatedAt: '2024-08-23'
  }
];

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

  create: async (data: CreateRawMaterialData): Promise<ApiResponse<RawMaterial>> => {
    await delay(800);
    const newItem: RawMaterial = {
      id: (mockRawMaterials.length + 1).toString(),
      name: data.name,
      description: '', // Default value
      categoryId: data.categoryId,
      supplierId: data.supplierId,
      batchNumber: data.batchNumber,
      purchaseDate: data.purchaseDate,
      expirationDate: data.expirationDate,
      quantity: data.quantity,
      unit: data.unit,
      unitPrice: data.costPerUnit, // Map costPerUnit to unitPrice
      reorderLevel: data.reorderLevel,
      storageLocationId: data.storageLocationId,
      qualityStatusId: data.qualityStatusId,
      isContaminated: false, // New materials are not contaminated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRawMaterials.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: UpdateRawMaterialData): Promise<ApiResponse<RawMaterial>> => {
    await delay(700);
    const index = mockRawMaterials.findIndex(rm => rm.id === id);
    if (index === -1) {
      throw new Error('Raw material not found');
    }

    // Map frontend fields to backend fields
    const updateFields: Partial<RawMaterial> = {};

    if (data.name !== undefined) updateFields.name = data.name;
    if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId;
    if (data.supplierId !== undefined) updateFields.supplierId = data.supplierId;
    if (data.batchNumber !== undefined) updateFields.batchNumber = data.batchNumber;
    if (data.purchaseDate !== undefined) updateFields.purchaseDate = data.purchaseDate;
    if (data.expirationDate !== undefined) updateFields.expirationDate = data.expirationDate;
    if (data.quantity !== undefined) updateFields.quantity = data.quantity;
    if (data.unit !== undefined) updateFields.unit = data.unit;
    if (data.costPerUnit !== undefined) updateFields.unitPrice = data.costPerUnit; // Map costPerUnit to unitPrice
    if (data.reorderLevel !== undefined) updateFields.reorderLevel = data.reorderLevel;
    if (data.storageLocationId !== undefined) updateFields.storageLocationId = data.storageLocationId;
    if (data.qualityStatusId !== undefined) updateFields.qualityStatusId = data.qualityStatusId;
    if (data.contaminated !== undefined) updateFields.isContaminated = data.contaminated; // Map contaminated to isContaminated

    mockRawMaterials[index] = {
      ...mockRawMaterials[index],
      ...updateFields,
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

export const intermediateProductsApi = {
  getAll: async (): Promise<ApiResponse<IntermediateProduct[]>> => {
    await delay(300);
    return { success: true, data: mockIntermediateProducts };
  },

  getById: async (id: string): Promise<ApiResponse<IntermediateProduct>> => {
    await delay(300);
    const item = mockIntermediateProducts.find(p => p.id === id);
    if (!item) {
      throw new Error('Intermediate product not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<IntermediateProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<IntermediateProduct>> => {
    await delay(800);
    const newItem: IntermediateProduct = {
      ...data,
      id: (mockIntermediateProducts.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockIntermediateProducts.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<IntermediateProduct, 'id' | 'createdAt'>>): Promise<ApiResponse<IntermediateProduct>> => {
    await delay(700);
    const index = mockIntermediateProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Intermediate product not found');
    }

    mockIntermediateProducts[index] = {
      ...mockIntermediateProducts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockIntermediateProducts[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockIntermediateProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Intermediate product not found');
    }

    mockIntermediateProducts.splice(index, 1);
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

// Quality Status API
export const qualityStatusApi = {
  getAll: async (): Promise<ApiResponse<QualityStatus[]>> => {
    await delay(300);
    return { success: true, data: mockQualityStatuses };
  },

  getById: async (id: string): Promise<ApiResponse<QualityStatus>> => {
    await delay(200);
    const item = mockQualityStatuses.find(qs => qs.id === id);
    if (!item) {
      throw new Error('Quality status not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<QualityStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<QualityStatus>> => {
    await delay(800);

    // Check for duplicate name
    const existingStatus = mockQualityStatuses.find(qs =>
      qs.name.toLowerCase() === data.name.toLowerCase()
    );

    if (existingStatus) {
      throw new Error('Quality status name already exists');
    }

    const newItem: QualityStatus = {
      ...data,
      id: (mockQualityStatuses.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockQualityStatuses.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<QualityStatus, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<QualityStatus>> => {
    await delay(700);
    const index = mockQualityStatuses.findIndex(qs => qs.id === id);
    if (index === -1) {
      throw new Error('Quality status not found');
    }

    // Check for duplicate name (excluding current item)
    if (data.name) {
      const existingStatus = mockQualityStatuses.find(qs =>
        qs.id !== id && qs.name.toLowerCase() === data.name!.toLowerCase()
      );

      if (existingStatus) {
        throw new Error('Quality status name already exists');
      }
    }

    mockQualityStatuses[index] = {
      ...mockQualityStatuses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockQualityStatuses[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockQualityStatuses.findIndex(qs => qs.id === id);
    if (index === -1) {
      throw new Error('Quality status not found');
    }

    mockQualityStatuses.splice(index, 1);
    return { success: true, data: undefined };
  },
};

// Units API
export const unitsApi = {
  getAll: async (): Promise<ApiResponse<Unit[]>> => {
    await delay(300);
    return { success: true, data: mockUnits };
  },

  getById: async (id: string): Promise<ApiResponse<Unit>> => {
    await delay(200);
    const item = mockUnits.find(unit => unit.id === id);
    if (!item) {
      throw new Error('Unit not found');
    }
    return { success: true, data: item };
  },

  create: async (data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Unit>> => {
    await delay(800);

    // Check for duplicate name or symbol
    const existingUnit = mockUnits.find(unit =>
      unit.name.toLowerCase() === data.name.toLowerCase() ||
      unit.symbol.toLowerCase() === data.symbol.toLowerCase()
    );

    if (existingUnit) {
      throw new Error('Unit name or symbol already exists');
    }

    const newItem: Unit = {
      ...data,
      id: (mockUnits.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUnits.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: Partial<Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Unit>> => {
    await delay(700);
    const index = mockUnits.findIndex(unit => unit.id === id);
    if (index === -1) {
      throw new Error('Unit not found');
    }

    // Check for duplicate name or symbol (excluding current item)
    if (data.name || data.symbol) {
      const existingUnit = mockUnits.find(unit =>
        unit.id !== id && (
          (data.name && unit.name.toLowerCase() === data.name.toLowerCase()) ||
          (data.symbol && unit.symbol.toLowerCase() === data.symbol.toLowerCase())
        )
      );

      if (existingUnit) {
        throw new Error('Unit name or symbol already exists');
      }
    }

    mockUnits[index] = {
      ...mockUnits[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockUnits[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockUnits.findIndex(unit => unit.id === id);
    if (index === -1) {
      throw new Error('Unit not found');
    }

    mockUnits.splice(index, 1);
    return { success: true, data: undefined };
  },
};

// Finished Products API
export const finishedProductsApi = {
  getAll: async (): Promise<ApiResponse<FinishedProduct[]>> => {
    await delay(300);
    return { success: true, data: mockFinishedProducts };
  },

  getById: async (id: string): Promise<ApiResponse<FinishedProduct>> => {
    await delay(200);
    const item = mockFinishedProducts.find(fp => fp.id === id);
    if (!item) {
      throw new Error('Finished product not found');
    }
    return { success: true, data: item };
  },

  create: async (data: CreateFinishedProductData): Promise<ApiResponse<FinishedProduct>> => {
    await delay(800);

    // Check for duplicate SKU
    const existingProduct = mockFinishedProducts.find(fp =>
      fp.sku.toLowerCase() === data.sku.toLowerCase()
    );

    if (existingProduct) {
      throw new Error('SKU already exists');
    }

    const newItem: FinishedProduct = {
      id: (mockFinishedProducts.length + 1).toString(),
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      batchNumber: data.batchNumber,
      productionDate: data.productionDate,
      expirationDate: data.expirationDate,
      shelfLife: data.shelfLife,
      quantity: data.quantity,
      reservedQuantity: 0,
      unit: data.unit,
      salePrice: data.salePrice,
      costToProduce: data.costToProduce,
      packagingInfo: data.packagingInfo,
      storageLocationId: data.storageLocationId,
      qualityStatusId: 'pending', // Default to pending
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockFinishedProducts.push(newItem);
    return { success: true, data: newItem };
  },

  update: async (id: string, data: UpdateFinishedProductData): Promise<ApiResponse<FinishedProduct>> => {
    await delay(700);
    const index = mockFinishedProducts.findIndex(fp => fp.id === id);
    if (index === -1) {
      throw new Error('Finished product not found');
    }

    // Check for duplicate SKU (excluding current item)
    if (data.sku) {
      const existingProduct = mockFinishedProducts.find(fp =>
        fp.id !== id && fp.sku.toLowerCase() === data.sku!.toLowerCase()
      );

      if (existingProduct) {
        throw new Error('SKU already exists');
      }
    }

    mockFinishedProducts[index] = {
      ...mockFinishedProducts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockFinishedProducts[index] };
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    const index = mockFinishedProducts.findIndex(fp => fp.id === id);
    if (index === -1) {
      throw new Error('Finished product not found');
    }

    mockFinishedProducts.splice(index, 1);
    return { success: true, data: undefined };
  },

  reserveQuantity: async (id: string, quantity: number): Promise<ApiResponse<FinishedProduct>> => {
    await delay(400);
    const index = mockFinishedProducts.findIndex(fp => fp.id === id);
    if (index === -1) {
      throw new Error('Finished product not found');
    }

    const product = mockFinishedProducts[index];
    const availableQuantity = product.quantity - product.reservedQuantity;

    if (quantity > availableQuantity) {
      throw new Error('Insufficient quantity available for reservation');
    }

    mockFinishedProducts[index] = {
      ...product,
      reservedQuantity: product.reservedQuantity + quantity,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockFinishedProducts[index] };
  },

  releaseReservation: async (id: string, quantity: number): Promise<ApiResponse<FinishedProduct>> => {
    await delay(400);
    const index = mockFinishedProducts.findIndex(fp => fp.id === id);
    if (index === -1) {
      throw new Error('Finished product not found');
    }

    const product = mockFinishedProducts[index];

    if (quantity > product.reservedQuantity) {
      throw new Error('Cannot release more than reserved quantity');
    }

    mockFinishedProducts[index] = {
      ...product,
      reservedQuantity: product.reservedQuantity - quantity,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockFinishedProducts[index] };
  },

  getExpiring: async (days: number): Promise<ApiResponse<FinishedProduct[]>> => {
    await delay(300);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiring = mockFinishedProducts.filter(fp => {
      const expDate = new Date(fp.expirationDate);
      return expDate <= futureDate;
    });

    return { success: true, data: expiring };
  },

  getLowStock: async (threshold: number): Promise<ApiResponse<FinishedProduct[]>> => {
    await delay(300);
    const lowStock = mockFinishedProducts.filter(fp =>
      (fp.quantity - fp.reservedQuantity) <= threshold
    );

    return { success: true, data: lowStock };
  },
};
