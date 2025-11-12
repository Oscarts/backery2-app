import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGateProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGate component
 * Conditionally renders children based on user permissions
 * 
 * @param resource - The resource to check (e.g., 'raw-materials', 'recipes')
 * @param action - The action to check (e.g., 'view', 'create', 'edit', 'delete')
 * @param children - Content to render if user has permission
 * @param fallback - Optional content to render if user lacks permission
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useAuth();

  if (hasPermission(resource, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;
