import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const FinishedProducts: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Finished Products
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Finished Products management interface will be implemented here.
        </Typography>
      </Paper>
    </Container>
  );
};

export default FinishedProducts;
