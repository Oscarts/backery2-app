import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MaterialBreakdownDialog from '../dialogs/MaterialBreakdownDialog';
import { MaterialBreakdown } from '../../types';

const theme = createTheme();

const mockMaterialBreakdown: MaterialBreakdown = {
  finishedProduct: {
    id: 'product-456',
    name: 'Chocolate Croissant (BATCH-001)',
    batchNumber: 'BATCH-001',
    productionDate: '2025-09-18T10:00:00Z',
    quantity: 12,
    unit: 'pieces',
    costToProduce: 5.25,
    sku: 'CHOCO-CROISSANT-BATCH-001',
  },
  productionRun: {
    id: 'prod-123',
    name: '12 Chocolate Croissants',
    recipe: {
      id: 'recipe-1',
      name: 'Chocolate Croissant',
      description: 'Delicious chocolate-filled croissants',
      categoryId: 'cat-1',
      yieldQuantity: 12,
      yieldUnit: 'pieces',
      prepTime: 180,
      cookTime: 25,
      instructions: ['Mix dough', 'Add chocolate', 'Bake'],
      version: 1,
      isActive: true,
      emoji: '🥐',
      difficulty: 'MEDIUM',
      estimatedTotalTime: 205,
      estimatedCost: 5.00,
      equipmentRequired: ['oven'],
      createdAt: '2025-09-18T09:00:00Z',
      updatedAt: '2025-09-18T09:00:00Z',
    },
    completedAt: '2025-09-18T10:30:00Z',
  },
  materials: [
    {
      id: 'alloc-1',
      materialType: 'RAW_MATERIAL',
      materialName: 'All-Purpose Flour',
      materialSku: 'FLOUR-001',
      materialBatchNumber: 'FLOUR-BATCH-001',
      quantityAllocated: 500,
      quantityConsumed: 475,
      unit: 'g',
      unitCost: 0.004,
      totalCost: 2.00,
      status: 'CONSUMED',
      notes: undefined,
      consumedAt: '2025-09-18T10:15:00Z',
    },
  ],
  costBreakdown: {
    materialCost: 5.50,
    totalCost: 6.60,
    materials: [
      {
        id: 'alloc-1',
        materialType: 'RAW_MATERIAL',
        materialName: 'All-Purpose Flour',
        materialSku: 'FLOUR-001',
        materialBatchNumber: 'FLOUR-BATCH-001',
        quantityAllocated: 500,
        quantityConsumed: 475,
        unit: 'g',
        unitCost: 0.004,
        totalCost: 2.00,
        status: 'CONSUMED',
        notes: undefined,
        consumedAt: '2025-09-18T10:15:00Z',
      },
    ],
  },
  summary: {
    totalMaterialsUsed: 1,
    totalMaterialCost: 5.50,
    totalProductionCost: 6.60,
    costPerUnit: 3.30,
  },
};

describe('MaterialBreakdownDialog', () => {
  it('renders without crashing', () => {
    render(
      <ThemeProvider theme={theme}>
        <MaterialBreakdownDialog
          open={true}
          onClose={() => {}}
          materialBreakdown={mockMaterialBreakdown}
          loading={false}
          error={undefined}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Material Breakdown')).toBeInTheDocument();
  });
});
