import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';
import QualityStatusManagement from '../QualityStatusManagement';
import { qualityStatusApi } from '../../../services/realApi';

// Mock the API
jest.mock('../../../services/realApi', () => ({
  qualityStatusApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material/Add', () => () => <div>AddIcon</div>);
jest.mock('@mui/icons-material/Edit', () => () => <div>EditIcon</div>);
jest.mock('@mui/icons-material/Delete', () => () => <div>DeleteIcon</div>);
jest.mock('@mui/icons-material/Palette', () => () => <div>PaletteIcon</div>);

const mockQualityStatuses = [
  {
    id: '1',
    name: 'Good',
    description: 'Good quality product',
    color: '#4caf50',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Damaged',
    description: 'Damaged product',
    color: '#f44336',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('QualityStatusManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quality status management title', async () => {
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockResolvedValue({ data: mockQualityStatuses });

    render(<QualityStatusManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Quality Status Management')).toBeInTheDocument();
    expect(screen.getByText('Add Quality Status')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockImplementation(() => new Promise(() => { })); // Never resolves

    render(<QualityStatusManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading quality statuses...')).toBeInTheDocument();
  });

  test('displays quality statuses when loaded', async () => {
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockResolvedValue({ data: mockQualityStatuses });

    render(<QualityStatusManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Damaged')).toBeInTheDocument();
      expect(screen.getByText('Good quality product')).toBeInTheDocument();
      expect(screen.getByText('Damaged product')).toBeInTheDocument();
    });

    // Check that API was called
    expect(qualityStatusApi.getAll).toHaveBeenCalledTimes(1);
  });

  test('displays empty state when no quality statuses exist', async () => {
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockResolvedValue({ data: [] });

    render(<QualityStatusManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No quality statuses found. Add one to get started.')).toBeInTheDocument();
    });
  });

  test('displays error state when API call fails', async () => {
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockRejectedValue(new Error('API Error'));

    render(<QualityStatusManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Failed to load quality statuses')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  test('shows correct count of quality statuses', async () => {
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockResolvedValue({ data: mockQualityStatuses });

    render(<QualityStatusManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2 statuses configured')).toBeInTheDocument();
    });
  });

  test('component mounts and unmounts correctly', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const mockedApi = qualityStatusApi.getAll as jest.MockedFunction<typeof qualityStatusApi.getAll>;
    mockedApi.mockResolvedValue({ data: mockQualityStatuses });

    const { unmount } = render(<QualityStatusManagement />, { wrapper: createWrapper() });

    expect(consoleSpy).toHaveBeenCalledWith('QualityStatusManagement component mounted!');

    unmount();

    expect(consoleSpy).toHaveBeenCalledWith('QualityStatusManagement component unmounted!');

    consoleSpy.mockRestore();
  });
});
