import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OrderForm from '../pages/OrderForm';
import { customersApi, customerOrdersApi, finishedProductsApi } from '../services/realApi';
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
  {
    id: '3',
    name: 'Inactive Customer',
    email: 'inactive@test.com',
    phone: '+1-555-0303',
    address: '789 Elm St',
    isActive: false, // Should not appear in dropdown
  },
];

const mockProducts = [
  {
    id: 'prod1',
    name: 'Sourdough Bread',
    sku: 'BREAD-001',
    categoryId: 'cat1',
    batchNumber: 'BATCH-001',
    productionDate: '2025-10-01T00:00:00.000Z',
    expirationDate: '2025-10-08T00:00:00.000Z',
    shelfLife: 7,
    quantity: 50,
    unit: 'pcs',
    salePrice: 6.99,
    costToProduce: 3.50,
    status: OrderStatus.DRAFT,
    isContaminated: false,
  },
  {
    id: 'prod2',
    name: 'French Baguette',
    sku: 'BREAD-002',
    categoryId: 'cat1',
    batchNumber: 'BATCH-002',
    productionDate: '2025-10-02T00:00:00.000Z',
    expirationDate: '2025-10-04T00:00:00.000Z',
    shelfLife: 2,
    quantity: 30,
    unit: 'pcs',
    salePrice: 3.99,
    costToProduce: 1.80,
    status: OrderStatus.DRAFT,
    isContaminated: false,
  },
  {
    id: 'prod3',
    name: 'Contaminated Bread',
    sku: 'BREAD-CONT',
    categoryId: 'cat1',
    batchNumber: 'BATCH-003',
    productionDate: '2025-09-25T00:00:00.000Z',
    expirationDate: '2025-10-02T00:00:00.000Z',
    shelfLife: 7,
    quantity: 10,
    unit: 'pcs',
    salePrice: 5.99,
    costToProduce: 2.50,
    status: OrderStatus.DRAFT,
    isContaminated: true, // Should not appear in dropdown
  },
];

const mockExistingOrder = {
  id: 'order1',
  orderNumber: 'ORD-2025-001',
  customerId: '1',
  customer: mockCustomers[0],
  orderDate: '2025-10-01T10:00:00.000Z',
  expectedDeliveryDate: '2025-10-05T00:00:00.000Z',
  status: OrderStatus.DRAFT,
  priceMarkupPercentage: 50,
  notes: 'Test order notes',
  totalPrice: 125.00,
  subtotal: 100.00,
  markup: 25.00,
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
      totalPrice: 40.50,
    },
  ],
};

// Helper to render component with providers and router
const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/customer-orders/new" element={<OrderForm />} />
          <Route path="/customer-orders/:id/edit" element={<OrderForm />} />
          <Route path="/customer-orders/:id" element={<div>Order Details Mock</div>} />
          <Route path="/customer-orders" element={<div>Orders List Mock</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('OrderForm Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Default mock implementations
    (customersApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockCustomers,
    });
    
    (finishedProductsApi.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProducts,
    });
    
    (customerOrdersApi.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockExistingOrder,
    });
    
    window.history.pushState({}, 'Test page', '/customer-orders/new');
  });

  describe('Form Rendering - Create Mode', () => {
    test('renders form title for new order', async () => {
      renderWithProviders();
      
      expect(screen.getByText('Create New Order')).toBeInTheDocument();
      expect(screen.getByText('Fill in the order information and add items')).toBeInTheDocument();
    });

    test('renders back button', async () => {
      renderWithProviders();
      
      expect(screen.getByRole('button', { name: /back to orders/i })).toBeInTheDocument();
    });

    test('renders order information section', async () => {
      renderWithProviders();
      
      expect(screen.getByText('Order Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expected delivery date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/markup percentage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    test('renders order items section', async () => {
      renderWithProviders();
      
      expect(screen.getByText('Order Items')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    test('renders create button', async () => {
      renderWithProviders();
      
      expect(screen.getByRole('button', { name: /create order/i })).toBeInTheDocument();
    });

    test('renders cancel button', async () => {
      renderWithProviders();
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('shows "no items" message initially', async () => {
      renderWithProviders();
      
      expect(screen.getByText(/no items added yet/i)).toBeInTheDocument();
    });

    test('markup percentage defaults to 50', async () => {
      renderWithProviders();
      
      const markupInput = screen.getByLabelText(/markup percentage/i) as HTMLInputElement;
      expect(markupInput.value).toBe('50');
    });
  });

  describe('Customer Selection', () => {
    test('loads and displays active customers', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
      });
      
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      
      expect(screen.getByRole('option', { name: /main street café/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /downtown bakery/i })).toBeInTheDocument();
      // Inactive customer should not appear
      expect(screen.queryByRole('option', { name: /inactive customer/i })).not.toBeInTheDocument();
    });

    test('selects a customer', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
      });
      
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      expect((customerSelect as HTMLInputElement).value).toBe('1');
    });
  });

  describe('Dynamic Order Items Array', () => {
    test('adds a new item row', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      // Table should now be visible
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Check for table headers
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Unit Price')).toBeInTheDocument();
    });

    test('adds multiple items', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 3 item rows
        expect(rows.length).toBe(4);
      });
    });

    test('removes an item', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      await user.click(addButton);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBe(3); // 1 header + 2 items
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: '' });
      const deleteButton = deleteButtons.find(btn => btn.querySelector('[data-testid="DeleteIcon"]'));
      if (deleteButton) {
        await user.click(deleteButton);
      }
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBe(2); // 1 header + 1 item
      });
    });

    test('removes all items shows "no items" message', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: '' });
      const deleteButton = deleteButtons.find(btn => btn.querySelector('[data-testid="DeleteIcon"]'));
      if (deleteButton) {
        await user.click(deleteButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/no items added yet/i)).toBeInTheDocument();
      });
    });

    test('product dropdown filters contaminated products', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      await waitFor(() => {
        const productSelects = screen.getAllByDisplayValue('');
        expect(productSelects.length).toBeGreaterThan(0);
      });
      
      // Click on the first product select that's a combobox
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        
        // Should show non-contaminated products
        await waitFor(() => {
          expect(screen.getByRole('option', { name: /sourdough bread/i })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: /french baguette/i })).toBeInTheDocument();
          // Should NOT show contaminated product
          expect(screen.queryByRole('option', { name: /contaminated bread/i })).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Price Calculations', () => {
    test('calculates unit price with markup when product selected', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Select a product
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        // Unit cost should be 3.50, with 50% markup unit price should be 5.25
        await waitFor(() => {
          expect(screen.getByText('$3.50')).toBeInTheDocument();
          // Unit price field should contain 5.25
          const unitPriceInputs = screen.getAllByRole('spinbutton');
          const unitPriceInput = unitPriceInputs.find(input => 
            (input as HTMLInputElement).value === '5.25'
          );
          expect(unitPriceInput).toBeInTheDocument();
        });
      }
    });

    test('calculates line total correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Select product
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        await waitFor(() => {
          expect(screen.getByText('$3.50')).toBeInTheDocument();
        });
        
        // Change quantity to 10
        const quantityInputs = screen.getAllByRole('spinbutton');
        const quantityInput = quantityInputs.find(input => 
          (input as HTMLInputElement).value === '1'
        );
        if (quantityInput) {
          await user.clear(quantityInput);
          await user.type(quantityInput, '10');
          
          // Line total should be 5.25 * 10 = 52.50
          await waitFor(() => {
            expect(screen.getByText('$52.50')).toBeInTheDocument();
          });
        }
      }
    });

    test('recalculates all prices when markup changes', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Change markup to 100%
      const markupInput = screen.getByLabelText(/markup percentage/i);
      await user.clear(markupInput);
      await user.type(markupInput, '100');
      
      // Add item
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      // Select product
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        // With 100% markup, unit price should be 3.50 * 2 = 7.00
        await waitFor(() => {
          const unitPriceInputs = screen.getAllByRole('spinbutton');
          const unitPriceInput = unitPriceInputs.find(input => 
            (input as HTMLInputElement).value === '7'
          );
          expect(unitPriceInput).toBeInTheDocument();
        });
      }
    });

    test('recalculate prices button updates all items', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Add item with 50% markup
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        await waitFor(() => {
          expect(screen.getByText('$3.50')).toBeInTheDocument();
        });
        
        // Change markup to 100%
        const markupInput = screen.getByLabelText(/markup percentage/i);
        await user.clear(markupInput);
        await user.type(markupInput, '100');
        
        // Click recalculate
        const recalcButton = screen.getByRole('button', { name: /recalculate prices/i });
        await user.click(recalcButton);
        
        // Unit price should now be 7.00
        await waitFor(() => {
          const unitPriceInputs = screen.getAllByRole('spinbutton');
          const unitPriceInput = unitPriceInputs.find(input => 
            (input as HTMLInputElement).value === '7'
          );
          expect(unitPriceInput).toBeInTheDocument();
        });
      }
    });

    test('displays order summary with correct totals', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Add item
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        await waitFor(() => {
          // Check summary section
          expect(screen.getByText('Order Summary')).toBeInTheDocument();
          expect(screen.getByText('Total Items')).toBeInTheDocument();
          expect(screen.getByText('Total Production Cost')).toBeInTheDocument();
          expect(screen.getByText('Actual Markup')).toBeInTheDocument();
          expect(screen.getByText('Total Price')).toBeInTheDocument();
        });
        
        // Change quantity to 10
        const quantityInputs = screen.getAllByRole('spinbutton');
        const quantityInput = quantityInputs.find(input => 
          (input as HTMLInputElement).value === '1'
        );
        if (quantityInput) {
          await user.clear(quantityInput);
          await user.type(quantityInput, '10');
          
          await waitFor(() => {
            // Total cost: 3.50 * 10 = 35.00
            expect(screen.getByText('$35.00')).toBeInTheDocument();
            // Total price: 5.25 * 10 = 52.50
            expect(screen.getByText('$52.50')).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Form Validation', () => {
    test('shows error when customer not selected', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const submitButton = screen.getByRole('button', { name: /create order/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please select a customer/i)).toBeInTheDocument();
      });
    });

    test('shows error when delivery date not set', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      // Select customer
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
      });
      
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      const submitButton = screen.getByRole('button', { name: /create order/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please select a delivery date/i)).toBeInTheDocument();
      });
    });

    test('shows error when no items added', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
      });
      
      // Select customer
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      // Set delivery date
      const deliveryDateInput = screen.getByLabelText(/expected delivery date/i);
      await user.type(deliveryDateInput, '2025-10-10');
      
      const submitButton = screen.getByRole('button', { name: /create order/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please add at least one item/i)).toBeInTheDocument();
      });
    });

    test('shows error when item incomplete', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
      });
      
      // Select customer
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      // Set delivery date
      const deliveryDateInput = screen.getByLabelText(/expected delivery date/i);
      await user.type(deliveryDateInput, '2025-10-10');
      
      // Add item but don't select product
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const submitButton = screen.getByRole('button', { name: /create order/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please complete all item details/i)).toBeInTheDocument();
      });
    });

    test('validates quantity is greater than 0', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Select customer
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      // Set delivery date
      const deliveryDateInput = screen.getByLabelText(/expected delivery date/i);
      await user.type(deliveryDateInput, '2025-10-10');
      
      // Add item and select product
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        // Set quantity to 0
        const quantityInputs = screen.getAllByRole('spinbutton');
        const quantityInput = quantityInputs.find(input => 
          (input as HTMLInputElement).value === '1'
        );
        if (quantityInput) {
          await user.clear(quantityInput);
          await user.type(quantityInput, '0');
          
          const submitButton = screen.getByRole('button', { name: /create order/i });
          await user.click(submitButton);
          
          await waitFor(() => {
            expect(screen.getByText(/please complete all item details/i)).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Form Submission', () => {
    test('submits create order successfully', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.create as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'new-order-id' },
      });
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Fill form
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      const deliveryDateInput = screen.getByLabelText(/expected delivery date/i);
      await user.type(deliveryDateInput, '2025-10-10');
      
      // Add item
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        await waitFor(() => {
          expect(screen.getByText('$3.50')).toBeInTheDocument();
        });
        
        // Submit
        const submitButton = screen.getByRole('button', { name: /create order/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(customerOrdersApi.create).toHaveBeenCalledWith(
            expect.objectContaining({
              customerId: '1',
              expectedDeliveryDate: '2025-10-10',
              priceMarkupPercentage: 50,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 'prod1',
                  quantity: 1,
                })
              ])
            })
          );
          expect(screen.getByText(/order created successfully/i)).toBeInTheDocument();
        });
      }
    });

    test('handles submission error', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.create as jest.Mock).mockRejectedValue(
        new Error('Insufficient inventory')
      );
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Fill form
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      const deliveryDateInput = screen.getByLabelText(/expected delivery date/i);
      await user.type(deliveryDateInput, '2025-10-10');
      
      // Add item
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        await waitFor(() => {
          expect(screen.getByText('$3.50')).toBeInTheDocument();
        });
        
        // Submit
        const submitButton = screen.getByRole('button', { name: /create order/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/error: insufficient inventory/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Navigation', () => {
    test('back button navigates to orders list', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const backButton = screen.getByRole('button', { name: /back to orders/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders');
    });

    test('cancel button navigates to orders list', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/customer-orders');
    });

    test('navigates to orders list after successful submission', async () => {
      const user = userEvent.setup();
      (customerOrdersApi.create as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'new-order-id' },
      });
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(customersApi.getAll).toHaveBeenCalled();
        expect(finishedProductsApi.getAll).toHaveBeenCalled();
      });
      
      // Fill and submit form (abbreviated)
      const customerSelect = screen.getByLabelText(/customer/i);
      await user.click(customerSelect);
      await user.click(screen.getByRole('option', { name: /main street café/i }));
      
      const deliveryDateInput = screen.getByLabelText(/expected delivery date/i);
      await user.type(deliveryDateInput, '2025-10-10');
      
      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);
      
      const selects = screen.getAllByRole('combobox');
      const productSelect = selects.find(s => s.getAttribute('aria-labelledby') === null);
      if (productSelect) {
        await user.click(productSelect);
        await user.click(screen.getByRole('option', { name: /sourdough bread/i }));
        
        await waitFor(() => {
          expect(screen.getByText('$3.50')).toBeInTheDocument();
        });
        
        const submitButton = screen.getByRole('button', { name: /create order/i });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/order created successfully/i)).toBeInTheDocument();
        });
        
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 1600));
        
        expect(mockNavigate).toHaveBeenCalledWith('/customer-orders');
      }
    });
  });
});
