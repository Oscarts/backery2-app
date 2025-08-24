import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Import pages
import Dashboard from './pages/Dashboard';
import RawMaterials from './pages/RawMaterials';
import IntermediateProducts from './pages/IntermediateProducts';
import FinishedProducts from './pages/FinishedProducts';
import Recipes from './pages/Recipes';
import Production from './pages/Production';
import Contamination from './pages/Contamination';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

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
          <Route path="intermediate-products" element={<IntermediateProducts />} />
          <Route path="finished-products" element={<FinishedProducts />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="production" element={<Production />} />
          <Route path="contamination" element={<Contamination />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
