import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // For now, we'll just render the children
  // Authentication logic will be implemented later
  return <>{children}</>;
};

export default ProtectedRoute;
