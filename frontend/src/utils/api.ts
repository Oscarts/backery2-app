import axios, { AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiGet = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await api.get(url);
  return response.data;
};

export const apiPost = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await api.post(url, data);
  return response.data;
};

export const apiPut = async <T, D = any>(url: string, data?: D): Promise<T> => {
  const response: AxiosResponse<T> = await api.put(url, data);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await api.delete(url);
  return response.data;
};

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatQuantity = (quantity: number, unit: string): string => {
  return `${quantity.toLocaleString()} ${unit}`;
};

// Date utilities
export const isExpiringSoon = (expirationDate: string, daysThreshold: number = 7): boolean => {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays >= 0;
};

export const isExpired = (expirationDate: string): boolean => {
  const expDate = new Date(expirationDate);
  const today = new Date();
  return expDate < today;
};

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validatePositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Extract error message from various error types
 * Handles Error objects, API error responses, and strings
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    // Check for API error response format
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  
  return 'An unexpected error occurred';
};

export default api;
