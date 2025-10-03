import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Customers from '../Customers';
import { customersApi } from '../../services/realApi';
import { Customer } from '../../types';

// Mock the API
jest.mock('../../services/realApi', () => ({
  customersApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockCustomersApi = customersApi as jest.Mocked<typeof customersApi>;

// Helper to create a test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const theme = createTheme();

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'La Petite Boulangerie',
    email: 'contact@petiteboulangerie.com',
    phone: '+1 (555) 123-4567',
    address: '123 Rue de Paris, Montreal, QC H2X 1Y8',
    isActive: true,
    orderCount: 5,
    createdAt: '2025-09-01T10:00:00Z',
    updatedAt: '2025-09-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Sweet Treats Café',
    email: 'info@sweettreats.com',
    phone: '+1 (555) 234-5678',
    address: '456 Main St, Toronto, ON M5H 2N2',
    isActive: true,
    orderCount: 3,
    createdAt: '2025-09-02T10:00:00Z',
    updatedAt: '2025-09-02T10:00:00Z',
  },
  {
    id: '3',
    name: 'Inactive Customer',
    email: 'inactive@example.com',
    phone: '+1 (555) 999-0000',
    address: '789 Old Street',
    isActive: false,
    orderCount: 0,
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: '2025-09-01T10:00:00Z',
  },
];

describe('Customers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCustomersApi.getAll.mockResolvedValue({ success: true, data: mockCustomers });
  });

  describe('Initial Rendering', () => {
    it('should render the page title and description', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      expect(screen.getByText('Customer Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your customer database and track orders')).toBeInTheDocument();
    });

    it('should render search input and buttons', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
    });

    it('should render table headers', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Customer List Display', () => {
    it('should display loading state initially', () => {
      render(<Customers />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Loading customers...')).toBeInTheDocument();
    });

    it('should display customers after loading', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
        expect(screen.getByText('Sweet Treats Café')).toBeInTheDocument();
        expect(screen.getByText('Inactive Customer')).toBeInTheDocument();
      });

      expect(mockCustomersApi.getAll).toHaveBeenCalledWith('');
    });

    it('should display customer details correctly', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('contact@petiteboulangerie.com')).toBeInTheDocument();
        expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
        expect(screen.getByText('123 Rue de Paris, Montreal, QC H2X 1Y8')).toBeInTheDocument();
      });
    });

    it('should display order count for each customer', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Check that order counts are displayed
        expect(screen.getByText('5')).toBeInTheDocument(); // La Petite Boulangerie
        expect(screen.getByText('3')).toBeInTheDocument(); // Sweet Treats Café
      });
    });

    it('should display active status badge', async () => {
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        const activeChips = screen.getAllByText('Active');
        expect(activeChips).toHaveLength(2);
        
        const inactiveChip = screen.getByText('Inactive');
        expect(inactiveChip).toBeInTheDocument();
      });
    });

    it('should display empty state when no customers found', async () => {
      mockCustomersApi.getAll.mockResolvedValueOnce({ success: true, data: [] });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No customers found')).toBeInTheDocument();
      });
    });

    it('should display error state when API fails', async () => {
      mockCustomersApi.getAll.mockRejectedValueOnce(new Error('Network error'));
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Error loading customers/i)).toBeInTheDocument();
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search input value', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search customers/i);
      await user.type(searchInput, 'Boulangerie');

      expect(searchInput).toHaveValue('Boulangerie');
    });

    it('should call API with search term when search button clicked', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockCustomersApi.getAll).toHaveBeenCalledWith('');
      });

      const searchInput = screen.getByPlaceholderText(/search customers/i);
      await user.type(searchInput, 'Boulangerie');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockCustomersApi.getAll).toHaveBeenCalledWith('Boulangerie');
      });
    });

    it('should trigger search when Enter key pressed', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockCustomersApi.getAll).toHaveBeenCalledWith('');
      });

      const searchInput = screen.getByPlaceholderText(/search customers/i);
      await user.type(searchInput, 'Sweet{Enter}');

      await waitFor(() => {
        expect(mockCustomersApi.getAll).toHaveBeenCalledWith('Sweet');
      });
    });

    it('should reset to first page when searching', async () => {
      const user = userEvent.setup();
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `customer-${i}`,
        name: `Customer ${i}`,
      }));
      
      mockCustomersApi.getAll.mockResolvedValue({ success: true, data: manyCustomers });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Customer 10')).toBeInTheDocument();
      });

      // Search should reset to page 1
      const searchInput = screen.getByPlaceholderText(/search customers/i);
      await user.type(searchInput, 'test{Enter}');

      await waitFor(() => {
        expect(mockCustomersApi.getAll).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Add Customer Dialog', () => {
    it('should open add customer dialog when button clicked', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });
    });

    it('should render all form fields in add dialog', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
      });
    });

    it('should create customer with valid data', async () => {
      const user = userEvent.setup();
      const newCustomer: Customer = {
        id: '4',
        name: 'New Bakery',
        email: 'new@bakery.com',
        phone: '+1 (555) 111-2222',
        address: '999 New Street',
        isActive: true,
        orderCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCustomersApi.create.mockResolvedValueOnce({ success: true, data: newCustomer });
      
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/customer name/i), 'New Bakery');
      await user.type(screen.getByLabelText(/email/i), 'new@bakery.com');
      await user.type(screen.getByLabelText(/phone/i), '+1 (555) 111-2222');
      await user.type(screen.getByLabelText(/address/i), '999 New Street');

      // Submit
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCustomersApi.create).toHaveBeenCalledWith({
          name: 'New Bakery',
          email: 'new@bakery.com',
          phone: '+1 (555) 111-2222',
          address: '999 New Street',
          isActive: true,
        });
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/customer created successfully/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for empty name', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      // Try to submit without name
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
      });

      expect(mockCustomersApi.create).not.toHaveBeenCalled();
    });

    it('should show error message when API fails', async () => {
      const user = userEvent.setup();
      mockCustomersApi.create.mockRejectedValueOnce(new Error('Duplicate email'));
      
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/customer name/i), 'Test Customer');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/duplicate email/i)).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Customer Dialog', () => {
    it('should open edit dialog with customer data', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      // Find and click edit button for first customer (using testid from EditIcon)
      const editIcons = screen.getAllByTestId('EditIcon');
      const editButton = editIcons[0].parentElement as HTMLElement;
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
        expect(screen.getByLabelText(/customer name/i)).toHaveValue('La Petite Boulangerie');
        expect(screen.getByLabelText(/email/i)).toHaveValue('contact@petiteboulangerie.com');
        expect(screen.getByLabelText(/phone/i)).toHaveValue('+1 (555) 123-4567');
      });
    });

    it('should update customer with modified data', async () => {
      const user = userEvent.setup();
      const updatedCustomer = { ...mockCustomers[0], name: 'Updated Bakery Name' };
      mockCustomersApi.update.mockResolvedValueOnce({ success: true, data: updatedCustomer });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      const editIcons = screen.getAllByTestId('EditIcon');
      const editButton = editIcons[0].parentElement as HTMLElement;
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/customer name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Bakery Name');

      const saveButton = screen.getByRole('button', { name: /update/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCustomersApi.update).toHaveBeenCalledWith('1', {
          name: 'Updated Bakery Name',
          email: 'contact@petiteboulangerie.com',
          phone: '+1 (555) 123-4567',
          address: '123 Rue de Paris, Montreal, QC H2X 1Y8',
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/customer updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should toggle active status', async () => {
      const user = userEvent.setup();
      const updatedCustomer = { ...mockCustomers[0], isActive: false };
      mockCustomersApi.update.mockResolvedValueOnce({ success: true, data: updatedCustomer });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      const editIcons = screen.getAllByTestId('EditIcon');
      const editButton = editIcons[0].parentElement as HTMLElement;
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      });

      const activeCheckbox = screen.getByRole('button', { name: /active/i });
      await user.click(activeCheckbox);

      const saveButton = screen.getByRole('button', { name: /update/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCustomersApi.update).toHaveBeenCalledWith('1', expect.objectContaining({
          isActive: false,
        }));
      });
    });
  });

  describe('Delete Customer', () => {
    it('should open delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0].parentElement as HTMLElement;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
        expect(screen.getByText(/delete customer.*La Petite Boulangerie/i)).toBeInTheDocument();
      });
    });

    it('should delete customer when confirmed', async () => {
      const user = userEvent.setup();
      mockCustomersApi.delete.mockResolvedValueOnce({ success: true });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0].parentElement as HTMLElement;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockCustomersApi.delete).toHaveBeenCalledWith('1');
      });

      await waitFor(() => {
        expect(screen.getByText(/customer deleted successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error when delete fails due to existing orders', async () => {
      const user = userEvent.setup();
      mockCustomersApi.delete.mockRejectedValueOnce(
        new Error('Cannot delete customer with existing orders')
      );
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0].parentElement as HTMLElement;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/cannot delete customer with existing orders/i)).toBeInTheDocument();
      });
    });

    it('should cancel delete when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('La Petite Boulangerie')).toBeInTheDocument();
      });

      const deleteIcons = screen.getAllByTestId('DeleteIcon');
      const deleteButton = deleteIcons[0].parentElement as HTMLElement;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
      });

      expect(mockCustomersApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should paginate customers correctly', async () => {
      const user = userEvent.setup();
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `customer-${i}`,
        name: `Customer ${i}`,
      }));
      
      mockCustomersApi.getAll.mockResolvedValue({ success: true, data: manyCustomers });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
        expect(screen.getByText('Customer 9')).toBeInTheDocument();
        expect(screen.queryByText('Customer 10')).not.toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Customer 10')).toBeInTheDocument();
        expect(screen.queryByText('Customer 0')).not.toBeInTheDocument();
      });
    });

    it('should change rows per page', async () => {
      const user = userEvent.setup();
      const manyCustomers = Array.from({ length: 25 }, (_, i) => ({
        ...mockCustomers[0],
        id: `customer-${i}`,
        name: `Customer ${i}`,
      }));
      
      mockCustomersApi.getAll.mockResolvedValue({ success: true, data: manyCustomers });
      
      render(<Customers />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
      });

      // Change to 25 per page
      const rowsPerPageSelect = screen.getByRole('combobox', { name: /rows per page/i });
      await user.click(rowsPerPageSelect);
      
      const option25 = screen.getByRole('option', { name: '25' });
      await user.click(option25);

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
        expect(screen.getByText('Customer 24')).toBeInTheDocument();
      });
    });
  });

  describe('Snackbar Notifications', () => {
    it('should close snackbar when close button clicked', async () => {
      const user = userEvent.setup();
      const newCustomer: Customer = {
        ...mockCustomers[0],
        id: '99',
        name: 'Snackbar Test',
      };
      mockCustomersApi.create.mockResolvedValueOnce({ success: true, data: newCustomer });
      
      render(<Customers />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add customer/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/customer name/i), 'Snackbar Test');
      
      const saveButton = screen.getByRole('button', { name: /create/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/customer created successfully/i)).toBeInTheDocument();
      });

      // Close snackbar
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/customer created successfully/i)).not.toBeInTheDocument();
      });
    });
  });
});
