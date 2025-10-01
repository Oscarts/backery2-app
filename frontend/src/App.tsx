import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Import pages
import Dashboard from './pages/Dashboard';
import RawMaterials from './pages/RawMaterials';
import FinishedProducts from './pages/FinishedProducts';
import Recipes from './pages/Recipes';
import EnhancedRecipes from './pages/EnhancedRecipes';
import Production from './pages/Production';
import Contamination from './pages/Contamination';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ApiTest from './pages/ApiTest';
import Login from './pages/Login';
import Customers from './pages/Customers';
import CustomerOrders from './pages/CustomerOrders';
import OrderForm from './pages/OrderForm';
import OrderDetails from './pages/OrderDetails';

// Import components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="raw-materials" element={<RawMaterials />} />
          <Route path="finished-products" element={<FinishedProducts />} />
          <Route path="recipes" element={<EnhancedRecipes />} />
          <Route path="recipes-old" element={<Recipes />} />
          <Route path="production" element={<Production />} />
          <Route path="contamination" element={<Contamination />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customer-orders" element={<CustomerOrders />} />
          <Route path="customer-orders/new" element={<OrderForm />} />
          <Route path="customer-orders/:id" element={<OrderDetails />} />
          <Route path="customer-orders/:id/edit" element={<OrderForm />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="api-test" element={<ApiTest />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
