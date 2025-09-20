/**
 * Frontend Component Test for Production Steps Customization
 * Simplified test following documentation strategy: render + basic behavior
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductionStepsDialog from '../components/Production/ProductionStepsDialog';

// Mock theme for Material-UI components
const theme = createTheme();

// Mock recipe data
const mockRecipe = {
    id: 'test-recipe-1',
    name: 'Test Recipe',
    yieldQuantity: 12,
    yieldUnit: 'pieces',
    prepTime: 30,
    cookTime: 45,
    estimatedCost: 25.50
};

// Wrapper component for theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
);

describe('Production Steps Customization - Frontend Integration', () => {
    describe('ProductionStepsDialog', () => {
        test('should render without crashing when open', () => {
            const mockOnConfirm = jest.fn();
            const mockOnClose = jest.fn();

            render(
                <TestWrapper>
                    <ProductionStepsDialog
                        open={true}
                        recipe={mockRecipe}
                        onClose={mockOnClose}
                        onConfirm={mockOnConfirm}
                    />
                </TestWrapper>
            );

            // Verify the dialog renders with title
            expect(screen.getByText('🛠️ Customize Production Steps')).toBeInTheDocument();
        });

        test('should not render when closed', () => {
            const mockOnConfirm = jest.fn();
            const mockOnClose = jest.fn();

            render(
                <TestWrapper>
                    <ProductionStepsDialog
                        open={false}
                        recipe={mockRecipe}
                        onClose={mockOnClose}
                        onConfirm={mockOnConfirm}
                    />
                </TestWrapper>
            );

            // Dialog should not be visible when closed
            expect(screen.queryByText('🛠️ Customize Production Steps')).not.toBeInTheDocument();
        });
    });
});
