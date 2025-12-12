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
      iconSize: 40,
      title: '1.15rem',
      subtitle: '0.65rem',
    },
    medium: {
      icon: '2.5rem',
      iconSize: 48,
      title: '1.5rem',
      subtitle: '0.75rem',
    },
    large: {
      icon: '3rem',
      iconSize: 56,
      title: '2rem',
      subtitle: '0.875rem',
    },
  };

  const currentSize = sizes[size];

  // SVG Logo Icon - Designed for blue background
  // White hexagon with orange accents for visibility
  const LogoIcon = ({ size: iconSize }: { size: number }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="whiteBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F0F4F8', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="orangeAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF8A5C', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="blueAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1E4687', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2962B3', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* White hexagonal background with subtle shadow */}
      <path
        d="M50 5L86.6 27.5V72.5L50 95L13.4 72.5V27.5L50 5Z"
        fill="url(#whiteBg)"
        filter="url(#shadow)"
      />

      {/* Inner hexagon border - blue accent */}
      <path
        d="M50 12L80 31V69L50 88L20 69V31L50 12Z"
        fill="none"
        stroke="url(#blueAccent)"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Speedometer arc - orange */}
      <path
        d="M50 25C36 25 25 36 25 50C25 57 27.5 63.5 31.5 68.5"
        stroke="url(#orangeAccent)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Speed needle pointing up-right */}
      <path
        d="M50 50L68 30"
        stroke="url(#blueAccent)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Arrow tip */}
      <path
        d="M64 32L68 25L72 32"
        stroke="url(#orangeAccent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="5" fill="url(#blueAccent)" />

      {/* Growth bars - ascending */}
      <rect x="30" y="62" width="8" height="14" rx="2" fill="url(#blueAccent)" opacity="0.5" />
      <rect x="42" y="56" width="8" height="20" rx="2" fill="url(#blueAccent)" opacity="0.7" />
      <rect x="54" y="50" width="8" height="26" rx="2" fill="url(#orangeAccent)" opacity="0.9" />
      <rect x="66" y="44" width="8" height="32" rx="2" fill="url(#orangeAccent)" />
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
