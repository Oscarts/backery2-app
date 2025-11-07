import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface SkuMapping {
  name: string;
  sku: string;
  source: string;
}

const SkuReference: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch SKU mappings
  const { data, isLoading, refetch } = useQuery<SkuMapping[]>(
    ['skuMappings'],
    async () => {
      const response = await axios.get('http://localhost:8000/api/raw-materials/sku-mappings');
      return response.data.data;
    }
  );

  const mappings = data || [];

  // Filter mappings based on search
  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Name', 'SKU', 'Source'];
    const rows = filteredMappings.map((m) => [m.name, m.sku, m.source]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sku-mappings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'mapping':
        return { label: 'Manual', color: 'primary' as const };
      case 'finished_product':
        return { label: 'Finished Product', color: 'success' as const };
      case 'raw_material':
        return { label: 'Raw Material', color: 'info' as const };
      default:
        return { label: source, color: 'default' as const };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <LabelIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            SKU Reference
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton color="primary" onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredMappings.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        This page shows all name-to-SKU mappings across the system. SKUs are automatically generated from product/material
        names and remain consistent to prevent inventory conflicts.
      </Alert>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box p={2} pb={0}>
          <TextField
            fullWidth
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={8}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMappings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((mapping, index) => {
                      const sourceInfo = getSourceLabel(mapping.source);
                      return (
                        <TableRow key={`${mapping.sku}-${index}`} hover>
                          <TableCell>{mapping.name}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              sx={{
                                backgroundColor: '#f5f5f5',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'inline-block',
                              }}
                            >
                              {mapping.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={sourceInfo.label} color={sourceInfo.color} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit SKU (Manual mappings only)">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={mapping.source !== 'mapping'}
                                  onClick={() => {
                                    // TODO: Implement edit functionality
                                    alert('Edit functionality coming soon!');
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {filteredMappings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          {searchTerm ? 'No matching SKU mappings found' : 'No SKU mappings available'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredMappings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Alert severity="warning" icon={false}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Important Notes:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>Automatic Generation:</strong> SKUs are automatically generated from names (uppercase, hyphen-separated)
          </li>
          <li>
            <strong>Consistency:</strong> Materials and products with the same name share the same SKU
          </li>
          <li>
            <strong>Manual Mappings:</strong> Can be edited if needed (marked with "Manual" badge)
          </li>
          <li>
            <strong>Derived Mappings:</strong> From existing raw materials or finished products (read-only)
          </li>
        </ul>
      </Alert>
    </Container>
  );
};

export default SkuReference;
