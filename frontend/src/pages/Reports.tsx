import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Reports: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Reports & Analytics
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Reports and analytics dashboard will be implemented here.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Reports;
