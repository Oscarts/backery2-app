import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OrderDetails from '../pages/OrderDetails';
import { customerOrdersApi } from '../services/realApi';
import { OrderStatus } from '../types';

// Mock the API service
jest.mock('../services/realApi');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test data
const mockOrder = {
  id: 'order1',
  orderNumber: 'ORD-2025-001',
  customerId: 'cust1',
  customer: {
    id: 'cust1',
    name: 'Main Street Café',
    email: 'orders@mainstreet.com',
    phone: '+1-555-0101',
    address: '123 Main St, City, State 12345',
    isActive: true,
  },
  orderDate: '2025-10-01T10:00:00.000Z',
  expectedDeliveryDate: '2025-10-05T00:00:00.000Z',
  status: OrderStatus.DRAFT,
  priceMarkupPercentage: 50,
  notes: 'Handle with care - custom order for weekend event',
  totalPrice: 125.00,
  totalProductionCost: 83.33,
  subtotal: 100.00,
  markup: 25.00,
  createdAt: '2025-10-01T10:00:00.000Z',
  updatedAt: '2025-10-01T15:30:00.000Z',
  items: [
    {
      id: 'item1',
      orderId: 'order1',
      productId: 'prod1',
      productName: 'Sourdough Bread',
      productSku: 'BREAD-001',
      quantity: 10,
      unitPrice: 5.25,
      unitProductionCost: 3.50,
      linePrice: 52.50,
      lineProductionCost: 35.00,
      totalPrice: 52.50,
    },
    {
      id: 'item2',
      orderId: 'order1',
      productId: 'prod2',
      productName: 'French Baguette',
      productSku: 'BREAD-002',
      quantity: 15,
      unitPrice: 2.70,
      unitProductionCost: 1.80,
      linePrice: 40.50,
      lineProductionCost: 27.00,
      totalPrice: 40.50,
    },
  ],
};

const mockConfirmedOrder = {
  ...mockOrder,
  id: 'order2',
  orderNumber: 'ORD-2025-002',
  status: OrderStatus.CONFIRMED,
};

const mockFulfilledOrder = {
  ...mockOrder,
  id: 'order3',
  orderNumber: 'ORD-2025-003',
  status: OrderStatus.FULFILLED,
};

const mockInventoryCheckSuccess = {
  available: true,
  insufficientProducts: [],
};

const mockInventoryCheckFailed = {
  available: false,
  insufficientProducts: [
    {
      productId: 'prod1',
      productName: 'Sourdough Bread',
      requiredQuantity: 10,
      availableQuantity: 5,
      shortage: 5,
    },
  ],
};

// Helper to render with providers and router
const renderWithProviders = (orderId = 'order1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  window.history.pushState({}, 'Test page', `/customer-orders/${orderId}`);

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/customer-orders/:id" element={<OrderDetails />} />
          <Route path="/customer-orders/:id/edit" element={<div>Edit Order Mock</div>} />
          <Route path="/customer-orders" element={<div>Orders List Mock</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('OrderDetails Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Default mock implementation
    (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrder,
    });
    
    (customerOrdersApi.checkInventory as jest.Mock).mockResolvedValue({
      success: true,
      data: mockInventoryCheckSuccess,
    });
  });

  describe('Page Rendering and Loading', () => {
    test('renders loading state', () => {
      (customerOrdersApi.getById as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      renderWithProviders();
      
      expect(screen.getByText(/loading order details/i)).toBeInTheDocument();
    });

    test('renders error state when order not found', async () => {
      (customerOrdersApi.getById as jest.Mock).mockRejectedValue(
        new Error('Order not found')
      );
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText(/error loading order/i)).toBeInTheDocument();
        expect(screen.getByText(/order not found/i)).toBeInTheDocument();
      });
    });

    test('renders order details successfully', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order ORD-2025-001')).toBeInTheDocument();
      });
    });

    test('displays order status badge', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText(OrderStatus.DRAFT)).toBeInTheDocument();
      });
    });

    test('renders back button', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to orders/i })).toBeInTheDocument();
      });
    });
  });

  describe('Order Information Display', () => {
    test('displays customer name', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Main Street Café')).toBeInTheDocument();
      });
    });

    test('displays expected delivery date', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order Information')).toBeInTheDocument();
      });
      
      // Check for Expected Delivery label
      expect(screen.getByText(/expected delivery/i)).toBeInTheDocument();
    });

    test('displays customer contact information', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText(/orders@mainstreet\.com/)).toBeInTheDocument();
        expect(screen.getByText(/\+1-555-0101/)).toBeInTheDocument();
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      });
    });

    test('displays order notes', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText(/handle with care/i)).toBeInTheDocument();
      });
    });

    test('hides notes section when no notes', async () => {
      (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOrder, notes: null },
      });
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order Information')).toBeInTheDocument();
      });
      
      // Notes section should not exist
      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Order Items Table', () => {
    test('renders items table with headers', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order Items')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Unit Cost')).toBeInTheDocument();
      expect(screen.getByText('Unit Price')).toBeInTheDocument();
    });

    test('displays all order items', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Sourdough Bread')).toBeInTheDocument();
        expect(screen.getByText('French Baguette')).toBeInTheDocument();
      });
    });

    test('displays item quantities and prices', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('BREAD-001')).toBeInTheDocument();
        expect(screen.getByText('BREAD-002')).toBeInTheDocument();
      });
      
      // Check for prices
      expect(screen.getByText('$3.50')).toBeInTheDocument(); // Unit cost
      expect(screen.getByText('$5.25')).toBeInTheDocument(); // Unit price
    });
  });

  describe('Order Summary', () => {
    test('renders order summary section', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      });
    });

    test('displays total items count', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Total Items')).toBeInTheDocument();
      });
    });

    test('displays total production cost', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Total Production Cost')).toBeInTheDocument();
        expect(screen.getByText('$83.33')).toBeInTheDocument();
      });
    });

    test('displays markup percentage', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Markup Percentage')).toBeInTheDocument();
        expect(screen.getByText('50.0%')).toBeInTheDocument();
      });
    });

    test('displays total price', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Total Price')).toBeInTheDocument();
        expect(screen.getByText('$125.00')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    test('renders export PDF button', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
      });
    });

    test('renders export Excel button', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
      });
    });

    test('handles PDF export', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      (customerOrdersApi.exportPDF as jest.Mock).mockResolvedValue(mockBlob);
      
      // Mock URL.createObjectURL
      const mockUrl = 'blob:mock-url';
      global.URL.createObjectURL = jest.fn(() => mockUrl);
      global.URL.revokeObjectURL = jest.fn();
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
      });
      
      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.exportPDF).toHaveBeenCalledWith('order1');
      });
    });

    test('handles Excel export', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['Excel content'], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      (customerOrdersApi.exportExcel as jest.Mock).mockResolvedValue(mockBlob);
      
      const mockUrl = 'blob:mock-url';
      global.URL.createObjectURL = jest.fn(() => mockUrl);
      global.URL.revokeObjectURL = jest.fn();
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
      });
      
      const exportButton = screen.getByRole('button', { name: /export excel/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.exportExcel).toHaveBeenCalledWith('order1');
      });
    });
  });

  describe('Status-Based Actions - DRAFT Status', () => {
    test('shows check inventory button for draft orders', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check inventory/i })).toBeInTheDocument();
      });
    });

    test('shows edit button for draft orders', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit order/i })).toBeInTheDocument();
      });
    });

    test('shows confirm button for draft orders', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm order/i })).toBeInTheDocument();
      });
    });

    test('does not show revert or fulfill buttons for draft orders', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order Actions')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /revert to draft/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /fulfill order/i })).not.toBeInTheDocument();
    });
  });

  describe('Status-Based Actions - CONFIRMED Status', () => {
    beforeEach(() => {
      (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConfirmedOrder,
      });
    });

    test('shows check inventory button for confirmed orders', async () => {
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check inventory/i })).toBeInTheDocument();
      });
    });

    test('shows revert button for confirmed orders', async () => {
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /revert to draft/i })).toBeInTheDocument();
      });
    });

    test('shows fulfill button for confirmed orders', async () => {
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fulfill order/i })).toBeInTheDocument();
      });
    });

    test('does not show edit or confirm buttons for confirmed orders', async () => {
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByText('Order Actions')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /edit order/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^confirm order$/i })).not.toBeInTheDocument();
    });
  });

  describe('Status-Based Actions - FULFILLED Status', () => {
    beforeEach(() => {
      (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockFulfilledOrder,
      });
    });

    test('shows fulfilled message for fulfilled orders', async () => {
      renderWithProviders('order3');
      
      await waitFor(() => {
        expect(screen.getByText(/this order has been fulfilled/i)).toBeInTheDocument();
        expect(screen.getByText(/no further actions available/i)).toBeInTheDocument();
      });
    });

    test('does not show any action buttons for fulfilled orders', async () => {
      renderWithProviders('order3');
      
      await waitFor(() => {
        expect(screen.getByText('Order Actions')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /check inventory/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit order/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /confirm order/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /revert to draft/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /fulfill order/i })).not.toBeInTheDocument();
    });
  });

  describe('Inventory Check Dialog', () => {
    test('opens inventory check dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check inventory/i })).toBeInTheDocument();
      });
      
      const checkButton = screen.getByRole('button', { name: /check inventory/i });
      await user.click(checkButton);
      
      await waitFor(() => {
        expect(screen.getByText('Inventory Availability Check')).toBeInTheDocument();
      });
    });

    test('shows success message when inventory available', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check inventory/i })).toBeInTheDocument();
      });
      
      const checkButton = screen.getByRole('button', { name: /check inventory/i });
      await user.click(checkButton);
      
      await waitFor(() => {
        expect(screen.getByText(/all items are available in inventory/i)).toBeInTheDocument();
        expect(screen.getByText(/you can proceed to confirm this order/i)).toBeInTheDocument();
      });
    });

    test('shows shortage details when inventory insufficient', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.checkInventory as jest.Mock).mockResolvedValue({
        success: true,
        data: mockInventoryCheckFailed,
      });
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check inventory/i })).toBeInTheDocument();
      });
      
      const checkButton = screen.getByRole('button', { name: /check inventory/i });
      await user.click(checkButton);
      
      await waitFor(() => {
        expect(screen.getByText(/insufficient inventory for some items/i)).toBeInTheDocument();
        expect(screen.getByText('Shortage')).toBeInTheDocument();
      });
    });

    test('closes inventory check dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /check inventory/i })).toBeInTheDocument();
      });
      
      const checkButton = screen.getByRole('button', { name: /check inventory/i });
      await user.click(checkButton);
      
      await waitFor(() => {
        expect(screen.getByText('Inventory Availability Check')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Inventory Availability Check')).not.toBeInTheDocument();
      });
    });
  });

  describe('Confirm Order Action', () => {
    test('opens confirm dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm order/i })).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /confirm order/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Confirm Order')[0]).toBeInTheDocument();
        expect(screen.getByText(/change the order status from DRAFT to CONFIRMED/i)).toBeInTheDocument();
      });
    });

    test('shows warning messages in confirm dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm order/i })).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /confirm order/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Confirm Order')[0]).toBeInTheDocument();
        expect(screen.getByText(/reserve the required inventory/i)).toBeInTheDocument();
      });
    });
  });

  describe('Revert to Draft Action', () => {
    beforeEach(() => {
      (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConfirmedOrder,
      });
    });

    test('opens revert dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /revert to draft/i })).toBeInTheDocument();
      });
      
      const revertButton = screen.getByRole('button', { name: /revert to draft/i });
      await user.click(revertButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Revert to Draft')[0]).toBeInTheDocument();
        expect(screen.getByText(/change the order status from CONFIRMED to DRAFT/i)).toBeInTheDocument();
      });
    });

    test('shows warning messages in revert dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /revert to draft/i })).toBeInTheDocument();
      });
      
      const revertButton = screen.getByRole('button', { name: /revert to draft/i });
      await user.click(revertButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Revert to Draft')[0]).toBeInTheDocument();
        expect(screen.getByText(/release the reserved inventory/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fulfill Order Action', () => {
    beforeEach(() => {
      (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConfirmedOrder,
      });
    });

    test('opens fulfill dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fulfill order/i })).toBeInTheDocument();
      });
      
      const fulfillButton = screen.getByRole('button', { name: /fulfill order/i });
      await user.click(fulfillButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Fulfill Order')[0]).toBeInTheDocument();
        expect(screen.getByText(/change the order status from CONFIRMED to FULFILLED/i)).toBeInTheDocument();
      });
    });

    test('shows warning messages in fulfill dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders('order2');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fulfill order/i })).toBeInTheDocument();
      });
      
      const fulfillButton = screen.getByRole('button', { name: /fulfill order/i });
      await user.click(fulfillButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Fulfill Order')[0]).toBeInTheDocument();
        expect(screen.getByText(/consume the inventory/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('back button navigates to orders list', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to orders/i })).toBeInTheDocument();
      });
      
      const backButton = screen.getByRole('button', { name: /back to orders/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders');
    });

    test('edit button navigates to edit form', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit order/i })).toBeInTheDocument();
      });
      
      const editButton = screen.getByRole('button', { name: /edit order/i });
      await user.click(editButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders/order1/edit');
    });
  });
});
