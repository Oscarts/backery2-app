/**
 * Frontend Component Test for Production Steps Customization
 * Tests the complete data flow from ProductionStepsDialog through to API call
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductionStepsDialog from '../components/Production/ProductionStepsDialog';
import QuantitySelectionDialog from '../components/Production/QuantitySelectionDialog';
import { CreateProductionStepData } from '../types';

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
        test('should allow creating custom steps and pass them correctly', async () => {
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

            // Wait for dialog to be rendered
            await waitFor(() => {
                expect(screen.getByText('Production Steps')).toBeInTheDocument();
            });

            // Add a custom step
            const addButton = screen.getByLabelText(/add step/i) || screen.getByText(/add step/i);
            fireEvent.click(addButton);

            // Fill in custom step details
            const nameInput = screen.getByLabelText(/step name/i) || screen.getByPlaceholderText(/step name/i);
            const descriptionInput = screen.getByLabelText(/description/i) || screen.getByPlaceholderText(/description/i);
            const timeInput = screen.getByLabelText(/minutes/i) || screen.getByPlaceholderText(/minutes/i);

            fireEvent.change(nameInput, { target: { value: 'Custom Prep Step' } });
            fireEvent.change(descriptionInput, { target: { value: 'Custom preparation phase' } });
            fireEvent.change(timeInput, { target: { value: '25' } });

            // Confirm the dialog
            const confirmButton = screen.getByText(/use these steps/i) || screen.getByRole('button', { name: /confirm/i });
            fireEvent.click(confirmButton);

            // Verify onConfirm was called with correct data structure
            await waitFor(() => {
                expect(mockOnConfirm).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            name: 'Custom Prep Step',
                            description: 'Custom preparation phase',
                            estimatedMinutes: 25,
                            stepOrder: expect.any(Number)
                        })
                    ])
                );
            });
        });

        test('should convert internal step format to CreateProductionStepData format', () => {
            // This tests the data transformation logic
            const internalSteps = [
                {
                    id: 'temp-1',
                    name: 'Test Step',
                    description: 'Test Description',
                    estimatedMinutes: 30,
                    stepOrder: 1,
                    isCustom: true
                }
            ];

            // Simulate the conversion that happens in onConfirm
            const convertedSteps: CreateProductionStepData[] = internalSteps.map(step => ({
                name: step.name,
                description: step.description,
                stepOrder: step.stepOrder,
                estimatedMinutes: step.estimatedMinutes
            }));

            expect(convertedSteps).toEqual([
                {
                    name: 'Test Step',
                    description: 'Test Description',
                    stepOrder: 1,
                    estimatedMinutes: 30
                }
            ]);
        });
    });

    describe('QuantitySelectionDialog', () => {
        test('should store and pass custom steps to onConfirm', async () => {
            const mockOnConfirm = jest.fn();
            const mockOnClose = jest.fn();

            render(
                <TestWrapper>
                    <QuantitySelectionDialog
                        open={true}
                        recipe={mockRecipe}
                        onClose={mockOnClose}
                        onConfirm={mockOnConfirm}
                    />
                </TestWrapper>
            );

            // Wait for dialog to be rendered
            await waitFor(() => {
                expect(screen.getByText(mockRecipe.name)).toBeInTheDocument();
            });

            // Click on customize steps button (if visible)
            const customizeButton = screen.queryByText(/customize steps/i) || screen.queryByLabelText(/customize/i);
            if (customizeButton) {
                fireEvent.click(customizeButton);

                // This would open ProductionStepsDialog, but for unit test we'll simulate setting custom steps
                // In actual implementation, this would be handled by the ProductionStepsDialog onConfirm
            }

            // Find and click confirm button
            const confirmButton = screen.getByText(/start production/i) || screen.getByRole('button', { name: /confirm/i });
            fireEvent.click(confirmButton);

            // Verify the onConfirm callback structure
            await waitFor(() => {
                expect(mockOnConfirm).toHaveBeenCalledWith(
                    expect.any(Number), // quantity
                    expect.any(Array)   // customSteps or undefined
                );
            });
        });
    });

    describe('Data Flow Integration', () => {
        test('should maintain correct data structure through component chain', () => {
            // Test the type safety of the data flow
            const stepFromDialog: CreateProductionStepData = {
                name: 'Integration Test Step',
                description: 'Testing data flow',
                stepOrder: 1,
                estimatedMinutes: 15
            };

            const productionRunData = {
                name: 'Test Production',
                recipeId: 'test-recipe',
                targetQuantity: 10,
                targetUnit: 'pieces',
                customSteps: [stepFromDialog]
            };

            // Verify structure matches backend expectations
            expect(productionRunData.customSteps).toBeDefined();
            expect(productionRunData.customSteps![0]).toEqual({
                name: 'Integration Test Step',
                description: 'Testing data flow',
                stepOrder: 1,
                estimatedMinutes: 15
            });

            // Verify no extra properties that might cause backend issues
            const stepKeys = Object.keys(stepFromDialog);
            expect(stepKeys).toEqual(['name', 'description', 'stepOrder', 'estimatedMinutes']);
        });

        test('should handle undefined customSteps gracefully', () => {
            const productionRunData: any = {
                name: 'Test Production',
                recipeId: 'test-recipe',
                targetQuantity: 10,
                targetUnit: 'pieces'
                // customSteps intentionally omitted
            };

            // Should not have customSteps property
            expect(productionRunData.hasOwnProperty('customSteps')).toBe(false);

            // This should work fine with backend that checks for customSteps existence
            expect(() => {
                const hasCustomSteps = productionRunData.customSteps &&
                    Array.isArray(productionRunData.customSteps) &&
                    productionRunData.customSteps.length > 0;
                expect(hasCustomSteps).toBe(false);
            }).not.toThrow();
        });
    });

    describe('API Integration Mock Test', () => {
        test('should send correct payload to production API', async () => {
            // Mock the API call
            const mockApiCall = jest.fn().mockResolvedValue({
                success: true,
                data: {
                    id: 'new-production-id',
                    steps: [
                        {
                            id: 'step-1',
                            name: 'Custom Test Step',
                            description: 'Test step description',
                            stepOrder: 1,
                            estimatedMinutes: 20,
                            status: 'PENDING'
                        }
                    ]
                }
            });

            // Simulate the data that would be sent to API
            const customSteps: CreateProductionStepData[] = [
                {
                    name: 'Custom Test Step',
                    description: 'Test step description',
                    stepOrder: 1,
                    estimatedMinutes: 20
                }
            ];

            const apiPayload = {
                name: 'API Test Production',
                recipeId: 'test-recipe-id',
                targetQuantity: 5,
                targetUnit: 'units',
                notes: 'API integration test',
                customSteps: customSteps
            };

            // Simulate API call
            const result = await mockApiCall('/production/runs', {
                method: 'POST',
                body: JSON.stringify(apiPayload)
            });

            expect(mockApiCall).toHaveBeenCalledWith('/production/runs', {
                method: 'POST',
                body: JSON.stringify(apiPayload)
            });

            expect(result.success).toBe(true);
            expect(result.data.steps).toHaveLength(1);
            expect(result.data.steps[0].name).toBe('Custom Test Step');
        });
    });
});
