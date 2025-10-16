/**
 * RapidPro Design System Tokens
 * 
 * This file contains all the design tokens used across the application
 * to ensure consistency in colors, typography, spacing, and other design elements.
 */

// Brand Colors - RapidPro
// Slogan: "Productividad en tiempo real"
// Target: Small food businesses, artisan production, microenterprises
export const colors = {
  // Primary - Professional Navy Blue
  primary: {
    main: '#1E4687', // Navy Blue - Professionalism
    light: '#2962B3',
    dark: '#163562',
    50: '#E8EEF7',
    100: '#C5D5EA',
    200: '#9EB9DC',
    300: '#779DCE',
    400: '#5A88C4',
    500: '#1E4687',
    600: '#1A3F7A',
    700: '#16376B',
    800: '#122F5C',
    900: '#0C2040',
  },
  
  // Secondary - Vibrant Orange (Energy & Agility)
  secondary: {
    main: '#FF6B35', // Vibrant Orange - Energy and Agility
    light: '#FF8A5C',
    dark: '#E65528',
    50: '#FFF4EF',
    100: '#FFE3D7',
    200: '#FFD0BC',
    300: '#FFBDA1',
    400: '#FFAE8D',
    500: '#FF6B35',
    600: '#F76230',
    700: '#E55629',
    800: '#D44A22',
    900: '#B73516',
  },
  
  // Neutral/Grayscale
  neutral: {
    white: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    black: '#000000',
  },
  
  // Semantic Colors
  semantic: {
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#29B6F6',
      light: '#4FC3F7',
      dark: '#0288D1',
    },
  },
  
  // Background
  background: {
    default: '#F8F9FA',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9E9E9E',
    hint: '#BDBDBD',
  },
};

// Typography Scale
export const typography = {
  fontFamily: {
    primary: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    secondary: '"Roboto", "Helvetica", "Arial", sans-serif',
    monospace: '"Roboto Mono", "Courier New", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  letterSpacing: {
    tight: '-0.05em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing Scale (based on 8px grid)
export const spacing = {
  0: '0',
  0.5: '0.25rem',   // 4px
  1: '0.5rem',      // 8px
  1.5: '0.75rem',   // 12px
  2: '1rem',        // 16px
  2.5: '1.25rem',   // 20px
  3: '1.5rem',      // 24px
  4: '2rem',        // 32px
  5: '2.5rem',      // 40px
  6: '3rem',        // 48px
  8: '4rem',        // 64px
  10: '5rem',       // 80px
  12: '6rem',       // 96px
  16: '8rem',       // 128px
  20: '10rem',      // 160px
};

// Border Radius - Enhanced for modern rounded design
export const borderRadius = {
  none: '0',
  sm: '0.5rem',     // 8px - Small elements
  base: '0.75rem',  // 12px - Default (buttons, inputs)
  md: '1rem',       // 16px - Cards, panels
  lg: '1.25rem',    // 20px - Large cards
  xl: '1.5rem',     // 24px - Prominent elements
  '2xl': '2rem',    // 32px - Hero sections
  full: '9999px',   // Fully rounded (pills, avatars)
};

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// Z-Index Scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

// Transitions
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: '8px 16px',
      md: '10px 20px',
      lg: '12px 24px',
    },
  },
  
  input: {
    height: {
      sm: '36px',
      md: '44px',
      lg: '52px',
    },
  },
  
  card: {
    padding: {
      sm: '16px',
      md: '24px',
      lg: '32px',
    },
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  components,
};
