import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiPost } from '../utils/api';

// Types
export interface Permission {
  resource: string;
  action: string;
  description?: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // ADMIN, STAFF, CUSTOM
  client: Client;
  customRole: CustomRole | null;
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load auth data from localStorage on mount
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userStr = localStorage.getItem(USER_KEY);

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthData();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiPost<{ success: boolean; data: { token: string; user: User } }>(
        '/auth/login',
        { email, password }
      );

      const { token, user } = response.data;

      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Update state
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear state
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  // Check if user has specific permission
  const hasPermission = (resource: string, action: string): boolean => {
    if (!authState.user) return false;

    // Check in user's permissions
    return authState.user.permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (
    permissions: Array<{ resource: string; action: string }>
  ): boolean => {
    if (!authState.user) return false;

    // Check if user has at least one of the required permissions
    return permissions.some((perm) => hasPermission(perm.resource, perm.action));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
