import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { intermediateProductsApi, categoriesApi, storageLocationsApi, unitsApi, rawMaterialsApi, suppliersApi } from '../services/realApi';
import { IntermediateProductStatus, QualityStatus, CategoryType } from '../types';

interface TestResult {
  name: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  data?: any;
}

const ApiTestPage: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Categories API', status: 'idle' },
    { name: 'Storage Locations API', status: 'idle' },
    { name: 'Units API', status: 'idle' },
    { name: 'Suppliers API', status: 'idle' },
    { name: 'Intermediate Products API', status: 'idle' },
    { name: 'Create Intermediate Product', status: 'idle' },
    { name: 'Update Intermediate Product', status: 'idle' },
    { name: 'Delete Intermediate Product', status: 'idle' },
    { name: 'Raw Materials API', status: 'idle' },
    { name: 'Create Raw Material', status: 'idle' },
    { name: 'Update Raw Material', status: 'idle' },
    { name: 'Delete Raw Material', status: 'idle' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runAllTests = async () => {
    // Test 1: Categories API
    updateTest(0, { status: 'testing' });
    try {
      const categoriesResult = await categoriesApi.getAll();
      updateTest(0, { 
        status: 'success', 
        message: `Found ${categoriesResult.data?.length || 0} categories`,
        data: categoriesResult.data
      });
    } catch (error) {
      updateTest(0, { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 2: Storage Locations API
    updateTest(1, { status: 'testing' });
    try {
      const locationsResult = await storageLocationsApi.getAll();
      updateTest(1, { 
        status: 'success', 
        message: `Found ${locationsResult.data?.length || 0} storage locations`,
        data: locationsResult.data
      });
    } catch (error) {
      updateTest(1, { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 3: Units API
    updateTest(2, { status: 'testing' });
    try {
      const unitsResult = await unitsApi.getAll();
      updateTest(2, { 
        status: 'success', 
        message: `Found ${unitsResult.data?.length || 0} units`,
        data: unitsResult.data
      });
    } catch (error) {
      updateTest(2, { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 4: Suppliers API
    updateTest(3, { status: 'testing' });
    try {
      const suppliersResult = await suppliersApi.getAll();
      updateTest(3, { 
        status: 'success', 
        message: `Found ${suppliersResult.data?.length || 0} suppliers`,
        data: suppliersResult.data
      });
    } catch (error) {
      updateTest(3, { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 5: Intermediate Products API
    updateTest(4, { status: 'testing' });
    try {
      const productsResult = await intermediateProductsApi.getAll();
      updateTest(4, { 
        status: 'success', 
        message: `Found ${productsResult.data?.length || 0} intermediate products`,
        data: productsResult.data
      });
    } catch (error) {
      updateTest(4, { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 6: Create Intermediate Product
    updateTest(5, { status: 'testing' });
    try {
          // Ensure we have fresh data for the create test
          const [categoriesResult, locationsResult, unitsResult] = await Promise.all([
            categoriesApi.getAll(),
            storageLocationsApi.getAll(),
            unitsApi.getAll()
          ]);

          if (!categoriesResult.data?.[0]?.id) {
            throw new Error('No categories available for testing');
          }
          if (!locationsResult.data?.[0]?.id) {
            throw new Error('No storage locations available for testing');
          }
          if (!unitsResult.data?.[0]?.symbol) {
            throw new Error('No units available for testing');
          }

          const createData = {
            name: 'Test Intermediate Product',
            description: 'A test intermediate product for API testing',
            categoryId: categoriesResult.data[0].id,
            storageLocationId: locationsResult.data[0].id,
            batchNumber: `BATCH${Date.now()}`,
            productionDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
            expirationDate: '2025-12-31T00:00:00.000Z',
            quantity: 100,
            unit: unitsResult.data[0].symbol,
            status: IntermediateProductStatus.IN_PRODUCTION,
            contaminated: false,
            qualityStatus: QualityStatus.PENDING
          };      
          
          const createResult = await intermediateProductsApi.create(createData);
      updateTest(5, { 
        status: 'success', 
        message: `Created product with ID: ${createResult.data?.id}`,
        data: createResult.data
      });

      // Test 7: Update the created product
      if (createResult.data?.id) {
        updateTest(6, { status: 'testing' });
        try {
          const updateResult = await intermediateProductsApi.update(createResult.data.id, {
            quantity: 15,
            status: IntermediateProductStatus.COMPLETED
          });
          updateTest(6, { 
            status: 'success', 
            message: `Updated product quantity to ${updateResult.data?.quantity}`,
            data: updateResult.data
          });

          // Test 8: Delete the created product
          updateTest(7, { status: 'testing' });
          try {
            await intermediateProductsApi.delete(createResult.data.id);
            updateTest(7, { 
              status: 'success', 
              message: 'Product deleted successfully'
            });
          } catch (error) {
            updateTest(7, { 
              status: 'error', 
              message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        } catch (error) {
          updateTest(6, { 
            status: 'error', 
            message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (error) {
      updateTest(5, { 
        status: 'error', 
        message: `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 9: Raw Materials API
    updateTest(8, { status: 'testing' });
    try {
      const rawMaterialsResult = await rawMaterialsApi.getAll();
      updateTest(8, { 
        status: 'success', 
        message: `Found ${rawMaterialsResult.data?.length || 0} raw materials`,
        data: rawMaterialsResult.data
      });
    } catch (error) {
      updateTest(8, { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 10: Create Raw Material
    updateTest(9, { status: 'testing' });
    try {
      // Ensure we have fresh data for the raw material create test
      const [categoriesResult, locationsResult, unitsResult, suppliersResult] = await Promise.all([
        categoriesApi.getAll(),
        storageLocationsApi.getAll(),
        unitsApi.getAll(),
        suppliersApi.getAll()
      ]);

      // Find a raw material category
      const rawMaterialCategory = categoriesResult.data?.find(c => c.type === CategoryType.RAW_MATERIAL);
      if (!rawMaterialCategory?.id) {
        throw new Error('No raw material categories available for testing');
      }
      if (!locationsResult.data?.[0]?.id) {
        throw new Error('No storage locations available for testing');
      }
      if (!unitsResult.data?.[0]?.symbol) {
        throw new Error('No units available for testing');
      }
      if (!suppliersResult.data?.[0]?.id) {
        throw new Error('No suppliers available for testing');
      }

      const createRawMaterialData = {
        name: 'Test Raw Material',
        categoryId: rawMaterialCategory.id,
        supplierId: suppliersResult.data[0].id,
        batchNumber: `RAW-BATCH-${Date.now()}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        expirationDate: '2025-12-31',
        quantity: 50,
        unit: unitsResult.data[0].symbol,
        costPerUnit: 2.50,
        reorderLevel: 10,
        storageLocationId: locationsResult.data[0].id
      };

      const createRawResult = await rawMaterialsApi.create(createRawMaterialData);
      updateTest(9, { 
        status: 'success', 
        message: `Created raw material with ID: ${createRawResult.data?.id}`,
        data: createRawResult.data
      });

      // Test 11: Update the created raw material
      if (createRawResult.data?.id) {
        updateTest(10, { status: 'testing' });
        try {
          const updateRawResult = await rawMaterialsApi.update(createRawResult.data.id, {
            quantity: 75,
            costPerUnit: 3.00,
            contaminated: false
          });
          updateTest(10, { 
            status: 'success', 
            message: `Updated raw material quantity to ${updateRawResult.data?.quantity}`,
            data: updateRawResult.data
          });

          // Test 12: Delete the created raw material
          updateTest(11, { status: 'testing' });
          try {
            await rawMaterialsApi.delete(createRawResult.data.id);
            updateTest(11, { 
              status: 'success', 
              message: 'Raw material deleted successfully'
            });
          } catch (error) {
            updateTest(11, { 
              status: 'error', 
              message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        } catch (error) {
          updateTest(10, { 
            status: 'error', 
            message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (error) {
      updateTest(9, { 
        status: 'error', 
        message: `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'idle' as const, message: undefined, data: undefined })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'testing': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      case 'testing': return <CircularProgress size={20} />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Testing Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test the database connectivity and CRUD operations for the bakery inventory system.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={runAllTests}
          sx={{ mr: 2 }}
          disabled={tests.some(test => test.status === 'testing')}
        >
          Run All Tests
        </Button>
        <Button
          variant="outlined"
          onClick={resetTests}
          startIcon={<RefreshIcon />}
        >
          Reset
        </Button>
      </Box>

      <Grid container spacing={3}>
        {tests.map((test) => (
          <Grid item xs={12} md={6} key={test.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {test.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(test.status) || undefined}
                    label={test.status.toUpperCase()}
                    color={getStatusColor(test.status) as any}
                    size="small"
                  />
                </Box>
                
                {test.message && (
                  <Alert 
                    severity={test.status === 'error' ? 'error' : 'info'} 
                    sx={{ mb: 2 }}
                  >
                    {test.message}
                  </Alert>
                )}

                {test.data && Array.isArray(test.data) && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Data Preview ({test.data.length} items):
                    </Typography>
                    <List dense>
                      {test.data.slice(0, 3).map((item: any, idx: number) => (
                        <ListItem key={idx} divider>
                          <ListItemText
                            primary={item.name || item.id}
                            secondary={item.description || item.type}
                          />
                        </ListItem>
                      ))}
                      {test.data.length > 3 && (
                        <ListItem>
                          <ListItemText secondary={`... and ${test.data.length - 3} more`} />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}

                {test.data && !Array.isArray(test.data) && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Created Item:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                      {JSON.stringify(test.data, null, 2)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Architecture Overview
        </Typography>
        <Typography variant="body2" paragraph>
          This test page verifies the complete data flow:
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Frontend (React)</strong> → <strong>Real API Service</strong> → <strong>Backend Express Server</strong> → <strong>Prisma ORM</strong> → <strong>PostgreSQL Database</strong>
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2">
          All data is now persistent in the PostgreSQL database. Updates will be saved permanently and survive page refreshes.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ApiTestPage;
