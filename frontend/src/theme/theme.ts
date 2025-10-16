import { createTheme } from '@mui/material/styles';
import { colors, typography as designTypography, borderRadius as designBorderRadius } from './designTokens';

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main, // RapidPro Navy Blue #0D3B66
      light: colors.primary.light,
      dark: colors.primary.dark,
    },
    secondary: {
      main: colors.secondary.main, // RapidPro Orange #FF8E53
      light: colors.secondary.light,
      dark: colors.secondary.dark,
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    error: {
      main: colors.semantic.error.main,
      light: colors.semantic.error.light,
      dark: colors.semantic.error.dark,
    },
    warning: {
      main: colors.semantic.warning.main,
      light: colors.semantic.warning.light,
      dark: colors.semantic.warning.dark,
    },
    info: {
      main: colors.semantic.info.main,
      light: colors.semantic.info.light,
      dark: colors.semantic.info.dark,
    },
    success: {
      main: colors.semantic.success.main,
      light: colors.semantic.success.light,
      dark: colors.semantic.success.dark,
    },
  },
  typography: {
    fontFamily: designTypography.fontFamily.primary,
    h1: {
      fontWeight: designTypography.fontWeight.semibold,
      fontSize: designTypography.fontSize['4xl'],
      lineHeight: designTypography.lineHeight.tight,
      letterSpacing: designTypography.letterSpacing.tight,
    },
    h2: {
      fontWeight: designTypography.fontWeight.semibold,
      fontSize: designTypography.fontSize['3xl'],
      lineHeight: designTypography.lineHeight.tight,
    },
    h3: {
      fontWeight: designTypography.fontWeight.semibold,
      fontSize: designTypography.fontSize['2xl'],
      lineHeight: designTypography.lineHeight.tight,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: designTypography.fontWeight.semibold, // Bolder for page titles
      fontSize: designTypography.fontSize['2xl'], // Larger - 24px instead of 20px
      lineHeight: designTypography.lineHeight.tight,
      letterSpacing: '-0.01em', // Tighter spacing for modern look
    },
    h5: {
      fontWeight: designTypography.fontWeight.semibold,
      fontSize: designTypography.fontSize.lg,
      lineHeight: designTypography.lineHeight.normal,
    },
    h6: {
      fontWeight: designTypography.fontWeight.medium,
      fontSize: designTypography.fontSize.base,
      lineHeight: designTypography.lineHeight.normal,
    },
    body1: {
      fontSize: designTypography.fontSize.base,
      lineHeight: designTypography.lineHeight.relaxed, // More breathing room
    },
    body2: {
      fontSize: designTypography.fontSize.sm,
      lineHeight: designTypography.lineHeight.normal,
      letterSpacing: '0.01em', // Slightly wider for readability
    },
    button: {
      fontSize: designTypography.fontSize.sm,
      fontWeight: designTypography.fontWeight.medium,
      textTransform: 'none',
      letterSpacing: designTypography.letterSpacing.wide,
    },
    caption: {
      fontSize: designTypography.fontSize.xs,
      lineHeight: designTypography.lineHeight.normal,
    },
  },
  shape: {
    borderRadius: parseInt(designBorderRadius.base),
  },
  spacing: 8, // Base spacing unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: designBorderRadius.md, // 16px - Modern rounded cards
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.base, // 12px - Rounded buttons
          textTransform: 'none',
          fontWeight: designTypography.fontWeight.medium,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 10px -3px rgba(0, 0, 0, 0.15)',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: designTypography.fontSize.sm,
          borderRadius: designBorderRadius.sm,
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: designTypography.fontSize.base,
          borderRadius: designBorderRadius.md,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designBorderRadius.base, // 12px - Rounded inputs
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.md, // 16px - Rounded paper
        },
        rounded: {
          borderRadius: designBorderRadius.md,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: designBorderRadius.lg, // 20px - Large rounded dialogs
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.base, // 12px - Rounded chips
          fontWeight: designTypography.fontWeight.medium,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.neutral[200]}`,
        },
        head: {
          fontWeight: designTypography.fontWeight.semibold,
          backgroundColor: colors.neutral[50],
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.base, // 12px - Rounded alerts
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.base, // 12px - Soft rounded avatars (can be overridden for circular)
        },
        rounded: {
          borderRadius: designBorderRadius.base,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.base, // 12px - Rounded accordions
          '&:before': {
            display: 'none', // Remove default divider
          },
          '&:first-of-type': {
            borderTopLeftRadius: designBorderRadius.base,
            borderTopRightRadius: designBorderRadius.base,
          },
          '&:last-of-type': {
            borderBottomLeftRadius: designBorderRadius.base,
            borderBottomRightRadius: designBorderRadius.base,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: designBorderRadius.sm, // 8px - Subtle rounded tooltips
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: designBorderRadius.base,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: designBorderRadius.base, // 12px - Rounded menus
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: designBorderRadius.base, // 12px - Rounded popovers
        },
      },
    },
  },
});
