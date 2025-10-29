import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Restaurant as RestaurantIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as PriceTagIcon
} from '@mui/icons-material';
import { Recipe } from '../../types';

interface EnhancedRecipeCardProps {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onToggleFavorite?: (recipeId: string) => void;
  isFavorite?: boolean;
  showCostAnalysis?: boolean;
}

// Generate a beautiful gradient background based on recipe name
const generateGradient = (name: string, theme: any) => {
  const colors = [
    [theme.palette.primary.main, theme.palette.primary.light],
    [theme.palette.secondary.main, theme.palette.secondary.light],
    [theme.palette.success.main, theme.palette.success.light],
    [theme.palette.warning.main, theme.palette.warning.light],
    [theme.palette.info.main, theme.palette.info.light],
    ['#FF6B6B', '#FF8E8E'],
    ['#4ECDC4', '#7EDDD7'],
    ['#45B7D1', '#6BC5D2'],
    ['#96CEB4', '#B5D5C5'],
    ['#FECA57', '#FED67A']
  ];
  
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorPair = colors[Math.abs(hash) % colors.length];
  return `linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%)`;
};

// Generate initials from recipe name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export const EnhancedRecipeCard: React.FC<EnhancedRecipeCardProps> = ({
  recipe,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite = false,
  showCostAnalysis = true
}) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const difficulty = recipe.difficulty || 'MEDIUM';
  const difficultyColor = {
    EASY: theme.palette.success.main,
    MEDIUM: theme.palette.warning.main,
    HARD: theme.palette.error.main
  }[difficulty] || theme.palette.warning.main;

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const estimatedCost = recipe.estimatedCost || 0;
  const costPerUnit = recipe.yieldQuantity > 0 ? estimatedCost / recipe.yieldQuantity : 0;

  const profitabilityScore = estimatedCost > 0 ? Math.min(100, (estimatedCost / 10) * 100) : 0;

  return (
    <Card
      elevation={isHovered ? 8 : 2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          '& .recipe-actions': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
      onClick={() => onView(recipe)}
    >
      {/* Recipe Image/Avatar Header */}
      <Box
        sx={{
          height: 200,
          position: 'relative',
          background: recipe.imageUrl && !imageError 
            ? `url(${recipe.imageUrl})` 
            : generateGradient(recipe.name, theme),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)'
          }}
        />

        {/* Recipe Image or Initials */}
        {recipe.imageUrl && !imageError ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'transparent',
              border: '3px solid rgba(255,255,255,0.3)',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
          >
            {recipe.emoji || getInitials(recipe.name)}
          </Avatar>
        )}

        {/* Favorite Button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(recipe.id);
          }}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: theme.palette.background.paper,
              transform: 'scale(1.1)'
            }
          }}
        >
          {isFavorite ? (
            <StarIcon sx={{ color: theme.palette.warning.main }} />
          ) : (
            <StarBorderIcon />
          )}
        </IconButton>

        {/* Difficulty Badge */}
        <Chip
          label={difficulty}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: alpha(difficultyColor, 0.9),
            color: 'white',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)'
          }}
        />

        {/* Action Buttons */}
        <Fade in={isHovered}>
          <Box
            className="recipe-actions"
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              display: 'flex',
              gap: 1,
              opacity: 0,
              transform: 'translateY(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(recipe);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.9),
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.main,
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Recipe">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.9),
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.secondary.main,
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Recipe">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipe.id);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.9),
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.error.main,
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      </Box>

      {/* Recipe Content */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Recipe Title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
            minHeight: '2.6em'
          }}
        >
          {recipe.name}
        </Typography>

        {/* Category */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            fontWeight: 'medium'
          }}
        >
          {recipe.category?.name || 'Uncategorized'}
        </Typography>

        {/* Description */}
        {recipe.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4
            }}
          >
            {recipe.description}
          </Typography>
        )}

        {/* Recipe Stats */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {/* Yield */}
          <Chip
            icon={<RestaurantIcon />}
            label={`${recipe.yieldQuantity} ${recipe.yieldUnit}`}
            size="small"
            variant="outlined"
            color="primary"
          />

          {/* Time */}
          {totalTime > 0 && (
            <Chip
              icon={<ScheduleIcon />}
              label={`${totalTime} min`}
              size="small"
              variant="outlined"
              color="info"
            />
          )}

          {/* Ingredients Count */}
          <Chip
            label={`${(recipe.ingredients || []).length} ingredients`}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Cost Analysis Section */}
        {showCostAnalysis && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PriceTagIcon fontSize="small" color="primary" />
                Cost Analysis
              </Typography>
              {estimatedCost > 0 && (
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${Math.round(profitabilityScore)}% profitable`}
                  size="small"
                  color={profitabilityScore > 70 ? 'success' : profitabilityScore > 40 ? 'warning' : 'error'}
                  variant="filled"
                />
              )}
            </Box>

            {estimatedCost > 0 ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    ${estimatedCost.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cost per {recipe.yieldUnit}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${costPerUnit.toFixed(2)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(profitabilityScore, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: profitabilityScore > 70 
                        ? theme.palette.success.main
                        : profitabilityScore > 40 
                        ? theme.palette.warning.main 
                        : theme.palette.error.main
                    }
                  }}
                />
              </>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 1,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                borderRadius: 1,
                border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`
              }}>
                <Typography variant="body2" color="warning.main">
                  Cost not calculated
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedRecipeCard;