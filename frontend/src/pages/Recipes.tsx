import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Recipes: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Recipes
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Recipe management interface will be implemented here.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Recipes;
