import React from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import RapidProLogo from '../components/Brand/RapidProLogo';
import { borderRadius } from '../theme/designTokens';

const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        py: 4,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 3, sm: 5 },
            borderRadius: borderRadius.lg, // 20px - Modern rounded dialog
            background: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <RapidProLogo size={isMobile ? 'medium' : 'large'} variant="full" sx={{ mb: 3 }} />

            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600, color: '#1E4687' }}>
              Bienvenido
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Accede a tu sistema de gestión de producción
            </Typography>

            <Alert severity="info" sx={{ mb: 3, width: '100%' }}>
              Login functionality will be implemented with authentication system.
            </Alert>

            <Box component="form" sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                disabled
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Sign In
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
              © 2025 RapidPro - Gestión de Producción. Todos los derechos reservados.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
