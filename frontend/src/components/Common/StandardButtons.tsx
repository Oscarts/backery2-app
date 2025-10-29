import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface StandardButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Primary action button - Use for main actions like "Create", "Save", "Submit"
 * Position: Top-right of sections or bottom-right of dialogs
 */
export const PrimaryButton: React.FC<StandardButtonProps> = ({ 
  children, 
  loading = false, 
  disabled,
  icon,
  startIcon,
  ...props 
}) => {
  return (
    <Button
      variant="contained"
      color="primary"
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (icon || startIcon)}
      sx={{
        minWidth: '120px',
        fontWeight: 600,
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * Secondary action button - Use for alternative actions like "Cancel", "Back"
 */
export const SecondaryButton: React.FC<StandardButtonProps> = ({ 
  children, 
  loading = false, 
  disabled,
  icon,
  startIcon,
  ...props 
}) => {
  return (
    <Button
      variant="outlined"
      color="primary"
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (icon || startIcon)}
      sx={{
        minWidth: '100px',
        fontWeight: 500,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * Create button - Standardized for all list/table pages
 * Position: Always top-right of the page content
 */
export const CreateButton: React.FC<StandardButtonProps> = ({ 
  children = 'Create', 
  loading = false,
  icon = <AddIcon />,
  ...props 
}) => {
  return (
    <PrimaryButton
      loading={loading}
      icon={icon}
      sx={{
        whiteSpace: 'nowrap',
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </PrimaryButton>
  );
};

/**
 * Text button - Use for low-priority actions
 */
export const TextButton: React.FC<StandardButtonProps> = ({ 
  children, 
  loading = false, 
  disabled,
  icon,
  startIcon,
  ...props 
}) => {
  return (
    <Button
      variant="text"
      color="primary"
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (icon || startIcon)}
      sx={{
        fontWeight: 500,
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * Icon button wrapper for consistent styling
 */
export { IconButton, Tooltip } from '@mui/material';
