import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

interface RapidProLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon-only' | 'text-only';
  sx?: SxProps<Theme>;
}

const RapidProLogo: React.FC<RapidProLogoProps> = ({
  size = 'medium',
  variant = 'full',
  sx
}) => {
  const sizes = {
    small: {
      icon: '2rem',
      iconSize: 32,
      title: '1.25rem',
      subtitle: '0.7rem',
    },
    medium: {
      icon: '2.5rem',
      iconSize: 40,
      title: '1.75rem',
      subtitle: '0.8rem',
    },
    large: {
      icon: '3rem',
      iconSize: 48,
      title: '2rem',
      subtitle: '0.875rem',
    },
  };

  const currentSize = sizes[size];

  // SVG Logo Icon - Modern and Dynamic
  // Concept: Clock with ascending arrow representing "Productividad en tiempo real"
  const LogoIcon = ({ size: iconSize }: { size: number }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dynamic Hexagonal background with gradient */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1E4687', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2962B3', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF8A5C', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Hexagonal background - represents structure and organization */}
      <path
        d="M50 5L86.6 27.5V72.5L50 95L13.4 72.5V27.5L50 5Z"
        fill="url(#bgGradient)"
      />

      {/* Clock circle outline - subtle */}
      <circle
        cx="50"
        cy="50"
        r="22"
        stroke="#5A88C4"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />

      {/* Clock arc - representing time and speed */}
      <path
        d="M50 28C38.95 28 30 36.95 30 48C30 52.5 31.4 56.7 33.8 60.2"
        stroke="url(#accentGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clock hand forming ascending arrow - rapid production */}
      <path
        d="M50 50L65 33"
        stroke="url(#accentGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Arrow head - represents growth and forward movement */}
      <path
        d="M62 33L65 28L68 33"
        stroke="url(#accentGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Production graph bars - ascending for productivity */}
      <rect x="32" y="62" width="7" height="13" rx="1.5" fill="url(#accentGradient)" opacity="0.8" />
      <rect x="43" y="58" width="7" height="17" rx="1.5" fill="url(#accentGradient)" opacity="0.85" />
      <rect x="54" y="54" width="7" height="21" rx="1.5" fill="url(#accentGradient)" opacity="0.9" />
      <rect x="65" y="50" width="7" height="25" rx="1.5" fill="url(#accentGradient)" />

      {/* Subtle motion lines for dynamism */}
      <path d="M72 38L78 35" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M75 45L82 43" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );

  if (variant === 'icon-only') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <LogoIcon size={currentSize.iconSize} />
      </Box>
    );
  }

  if (variant === 'text-only') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: currentSize.title,
            background: 'linear-gradient(135deg, #1E4687 0%, #2962B3 50%, #FF6B35 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px',
            lineHeight: 1.2,
          }}
        >
          RapidPro
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: currentSize.subtitle,
            color: '#5A7184',
            fontWeight: 500,
            letterSpacing: '0.5px',
            mt: -0.5,
            fontStyle: 'italic',
          }}
        >
          Smart Production Hub
        </Typography>
      </Box>
    );
  }

  // Full variant (default)
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        ...sx,
      }}
    >
      <LogoIcon size={currentSize.iconSize} />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: currentSize.title,
            color: '#1E4687',
            letterSpacing: '0.5px',
            lineHeight: 1.2,
          }}
        >
          RapidPro
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: currentSize.subtitle,
            color: '#FF6B35',
            fontWeight: 500,
            letterSpacing: '0.5px',
            mt: -0.5,
          }}
        >
          Smart Production Hub
        </Typography>
      </Box>
    </Box>
  );
};

export default RapidProLogo;
