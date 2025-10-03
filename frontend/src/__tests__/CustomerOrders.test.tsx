import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CustomerOrders from '../pages/CustomerOrders';
import { customerOrdersApi, customersApi } from '../services/realApi';
import { OrderStatus } from '../types';

// Mock the API services
jest.mock('../services/realApi');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test data
const mockCustomers = [
  {
    id: '1',
    name: 'Main Street Café',
    email: 'orders@mainstreet.com',
    phone: '+1-555-0101',
    address: '123 Main St',
    isActive: true,
  },
  {
    id: '2',
    name: 'Downtown Bakery',
    email: 'contact@downtown.com',
    phone: '+1-555-0202',
    address: '456 Oak Ave',
    isActive: true,
  },
];

const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerId: '1',
    customer: mockCustomers[0],
    orderDate: '2025-10-01T10:00:00.000Z',
    expectedDeliveryDate: '2025-10-05T00:00:00.000Z',
    status: OrderStatus.DRAFT,
    totalPrice: 150.50,
    subtotal: 125.00,
    markup: 25.50,
    notes: 'Rush order',
    items: [
      {
        id: 'item1',
        orderId: '1',
        productName: 'Sourdough Bread',
        productSku: 'BREAD-001',
        quantity: 10,
        unitPrice: 6.99,
        totalPrice: 69.90,
      },
      {
        id: 'item2',
        orderId: '1',
        productName: 'Baguette',
        productSku: 'BREAD-002',
        quantity: 15,
        unitPrice: 3.67,
        totalPrice: 55.10,
      },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerId: '2',
    customer: mockCustomers[1],
    orderDate: '2025-10-02T14:00:00.000Z',
    expectedDeliveryDate: '2025-10-06T00:00:00.000Z',
    status: OrderStatus.CONFIRMED,
    totalPrice: 280.00,
    subtotal: 250.00,
    markup: 30.00,
    notes: null,
    items: [
      {
        id: 'item3',
        orderId: '2',
        productName: 'Croissant',
        productSku: 'PASTRY-001',
        quantity: 50,
        unitPrice: 5.00,
        totalPrice: 250.00,
      },
    ],
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerId: '1',
    customer: mockCustomers[0],
    orderDate: '2025-09-28T09:00:00.000Z',
    expectedDeliveryDate: '2025-10-01T00:00:00.000Z',
    status: OrderStatus.FULFILLED,
    totalPrice: 99.99,
    subtotal: 85.00,
    markup: 14.99,
    notes: 'Completed',
    items: [
      {
        id: 'item4',
        orderId: '3',
        productName: 'Sourdough Bread',
        productSku: 'BREAD-001',
        quantity: 12,
        unitPrice: 7.08,
        totalPrice: 85.00,
      },
    ],
  },
];

// Helper to render component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CustomerOrders Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Default mock implementations
    (customerOrdersApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrders,
    });
    
    (customersApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockCustomers,
    });
  });

  describe('Rendering', () => {
    test('renders page title and description', async () => {
      renderWithProviders(<CustomerOrders />);
      
      expect(screen.getByText('Customer Orders')).toBeInTheDocument();
      expect(screen.getByText('Manage customer orders and track their status')).toBeInTheDocument();
    });

    test('renders search and filter controls', async () => {
      renderWithProviders(<CustomerOrders />);
      
      expect(screen.getByPlaceholderText('Search orders...')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Customer')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new order/i })).toBeInTheDocument();
    });

    test('renders orders table with correct headers', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('Order Number')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Delivery Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Total Price')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('displays loading state initially', () => {
      renderWithProviders(<CustomerOrders />);
      
      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });

    test('displays orders after loading', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-2025-003')).toBeInTheDocument();
    });

    test('displays "No orders found" when no data', async () => {
      (customerOrdersApi.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
      });
    });

    test('displays error message on API failure', async () => {
      (customerOrdersApi.getAll as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch orders')
      );
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error loading orders/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed to fetch orders/i)).toBeInTheDocument();
      });
    });
  });

  describe('Order Status Badges', () => {
    test('displays DRAFT status badge', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        const statusBadges = screen.getAllByText('DRAFT');
        expect(statusBadges).toHaveLength(1);
      });
    });

    test('displays CONFIRMED status badge', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        const statusBadges = screen.getAllByText('CONFIRMED');
        expect(statusBadges).toHaveLength(1);
      });
    });

    test('displays FULFILLED status badge', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        const statusBadges = screen.getAllByText('FULFILLED');
        expect(statusBadges).toHaveLength(1);
      });
    });
  });

  describe('Filtering', () => {
    test('filters by status - DRAFT', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Draft' }));
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: OrderStatus.DRAFT })
        );
      });
    });

    test('filters by status - CONFIRMED', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Confirmed' }));
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: OrderStatus.CONFIRMED })
        );
      });
    });

    test('filters by status - FULFILLED', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Fulfilled' }));
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: OrderStatus.FULFILLED })
        );
      });
    });

    test('filters by customer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const customerSelect = screen.getByLabelText('Customer');
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: 'Main Street Café' }));
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ customerId: '1' })
        );
      });
    });

    test('filters by date range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');
      
      await user.type(startDateInput, '2025-10-01');
      await user.type(endDateInput, '2025-10-31');
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2025-10-01',
            endDate: '2025-10-31',
          })
        );
      });
    });

    test('search by text', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search orders...');
      await user.type(searchInput, 'ORD-2025-001');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'ORD-2025-001' })
        );
      });
    });

    test('search by pressing Enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search orders...');
      await user.type(searchInput, 'Main Street{Enter}');
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Main Street' })
        );
      });
    });

    test('clears filters by selecting "All Statuses"', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'All Statuses' }));
      
      await waitFor(() => {
        expect(customerOrdersApi.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: undefined })
        );
      });
    });
  });

  describe('Status-based Action Buttons', () => {
    test('DRAFT orders show Edit, Confirm, and Delete buttons', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      // Find the row for DRAFT order
      const rows = screen.getAllByRole('row');
      const draftRow = rows.find(row => row.textContent?.includes('ORD-2025-001'));
      expect(draftRow).toBeDefined();
      
      if (draftRow) {
        within(draftRow).getByLabelText('Edit');
        within(draftRow).getByLabelText('Confirm Order');
        within(draftRow).getByLabelText('Delete');
      }
    });

    test('CONFIRMED orders show Revert and Fulfill buttons', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
      });
      
      // Find the row for CONFIRMED order
      const rows = screen.getAllByRole('row');
      const confirmedRow = rows.find(row => row.textContent?.includes('ORD-2025-002'));
      expect(confirmedRow).toBeDefined();
      
      if (confirmedRow) {
        within(confirmedRow).getByLabelText('Revert to Draft');
        within(confirmedRow).getByLabelText('Fulfill Order');
      }
    });

    test('FULFILLED orders show only View button', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-003')).toBeInTheDocument();
      });
      
      // Find the row for FULFILLED order
      const rows = screen.getAllByRole('row');
      const fulfilledRow = rows.find(row => row.textContent?.includes('ORD-2025-003'));
      expect(fulfilledRow).toBeDefined();
      
      if (fulfilledRow) {
        within(fulfilledRow).getByLabelText('View Details');
        // Should not have Edit, Confirm, Delete, Revert, or Fulfill buttons
        expect(within(fulfilledRow).queryByLabelText('Edit')).not.toBeInTheDocument();
        expect(within(fulfilledRow).queryByLabelText('Confirm Order')).not.toBeInTheDocument();
        expect(within(fulfilledRow).queryByLabelText('Delete')).not.toBeInTheDocument();
      }
    });
  });

  describe('Navigation', () => {
    test('clicking "New Order" navigates to order creation page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      const newOrderButton = screen.getByRole('button', { name: /new order/i });
      await user.click(newOrderButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders/new');
    });

    test('clicking View Details navigates to order details page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByLabelText('View Details');
      await user.click(viewButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders/1');
    });

    test('clicking Edit navigates to order edit page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const editButton = screen.getByLabelText('Edit');
      await user.click(editButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders/1/edit');
    });
  });

  describe('Order Actions', () => {
    test('confirm order action', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.confirmOrder as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOrders[0], status: OrderStatus.CONFIRMED },
      });
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByLabelText('Confirm Order');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.confirmOrder).toHaveBeenCalledWith('1');
        expect(screen.getByText('Order confirmed successfully')).toBeInTheDocument();
      });
    });

    test('revert order action', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.revertToDraft as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOrders[1], status: OrderStatus.DRAFT },
      });
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
      });
      
      const revertButton = screen.getByLabelText('Revert to Draft');
      await user.click(revertButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.revertToDraft).toHaveBeenCalledWith('2');
        expect(screen.getByText('Order reverted to draft')).toBeInTheDocument();
      });
    });

    test('fulfill order action', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.fulfillOrder as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockOrders[1], status: OrderStatus.FULFILLED },
      });
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
      });
      
      const fulfillButton = screen.getByLabelText('Fulfill Order');
      await user.click(fulfillButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.fulfillOrder).toHaveBeenCalledWith('2');
        expect(screen.getByText('Order fulfilled successfully')).toBeInTheDocument();
      });
    });

    test('delete order - shows confirmation dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete order "ORD-2025-001"/i)).toBeInTheDocument();
      });
    });

    test('delete order - confirms deletion', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.delete as jest.Mock).mockResolvedValue({ success: true });
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmDeleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmDeleteButton);
      
      await waitFor(() => {
        expect(customerOrdersApi.delete).toHaveBeenCalledWith('1');
        expect(screen.getByText('Order deleted successfully')).toBeInTheDocument();
      });
    });

    test('delete order - cancels deletion', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByLabelText('Delete');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
      
      expect(customerOrdersApi.delete).not.toHaveBeenCalled();
    });

    test('shows error message on action failure', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.confirmOrder as jest.Mock).mockRejectedValue(
        new Error('Insufficient inventory')
      );
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByLabelText('Confirm Order');
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: Insufficient inventory/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    test('displays pagination controls', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /rows per page/i })).toBeInTheDocument();
    });

    test('changes rows per page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      });
      
      const rowsPerPageSelect = screen.getByRole('combobox', { name: /rows per page/i });
      await user.click(rowsPerPageSelect);
      await user.click(screen.getByRole('option', { name: '25' }));
      
      // All 3 orders should still be visible (less than 25)
      expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-2025-003')).toBeInTheDocument();
    });
  });

  describe('Order Information Display', () => {
    test('displays order numbers correctly', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
        expect(screen.getByText('ORD-2025-003')).toBeInTheDocument();
      });
    });

    test('displays customer names correctly', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        const customerNames = screen.getAllByText('Main Street Café');
        expect(customerNames.length).toBeGreaterThan(0);
        expect(screen.getByText('Downtown Bakery')).toBeInTheDocument();
      });
    });

    test('displays total prices correctly', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('$150.50')).toBeInTheDocument();
        expect(screen.getByText('$280.00')).toBeInTheDocument();
        expect(screen.getByText('$99.99')).toBeInTheDocument();
      });
    });

    test('displays item counts correctly', async () => {
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        // Order 1 has 2 items, Order 2 has 1 item, Order 3 has 1 item
        const itemCounts = screen.getAllByText('2');
        expect(itemCounts.length).toBeGreaterThan(0);
      });
    });

    test('displays "Unknown Customer" when customer is null', async () => {
      const ordersWithoutCustomer = [
        { ...mockOrders[0], customer: null },
      ];
      
      (customerOrdersApi.getAll as jest.Mock).mockResolvedValue({
        success: true,
        data: ordersWithoutCustomer,
      });
      
      renderWithProviders(<CustomerOrders />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Customer')).toBeInTheDocument();
      });
    });
  });
});
