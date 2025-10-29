# Recipe Cost Calculation System

## Overview

The Recipe Cost Calculation System automatically calculates production costs for recipes based on ingredient prices, with a 20% overhead factor for labor and utilities. This system helps bakery managers understand the true cost of production and make informed pricing decisions.

## Features

### 1. Automatic Cost Calculation
- **Material Cost**: Sum of all ingredient costs based on current prices
- **Overhead Cost**: 20% of material cost for labor, utilities, and equipment
- **Total Production Cost**: Material cost + overhead cost
- **Cost Per Unit**: Total production cost divided by recipe yield

### 2. Real-time Cost Updates
- Costs are automatically recalculated when ingredient prices change
- Manual cost updates available for individual recipes or batch operations
- Cost information is cached in the database for performance

### 3. Detailed Cost Breakdown
- Ingredient-level cost analysis
- Type identification (Raw Material vs Finished Product)
- Unit cost and total cost per ingredient
- Integration with material breakdown system

## API Endpoints

### Get Recipe Cost Analysis
```
GET /api/recipes/:id/cost
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recipeId": "recipe-id",
    "recipeName": "Recipe Name",
    "yieldQuantity": 5,
    "yieldUnit": "kg",
    "ingredients": [
      {
        "type": "RAW_MATERIAL",
        "id": "ingredient-id",
        "name": "Flour",
        "quantity": 10,
        "unit": "kg",
        "unitCost": 0.5,
        "totalCost": 5
      }
    ],
    "totalMaterialCost": 5,
    "overheadCost": 1,
    "totalProductionCost": 6,
    "costPerUnit": 1.2,
    "lastUpdated": "2025-09-30T19:06:40.776Z"
  }
}
```

### Update Recipe Cost
```
PUT /api/recipes/:id/cost
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedCost": 6
  },
  "message": "Recipe cost updated successfully"
}
```

### Batch Update All Recipe Costs
```
PUT /api/recipes/costs/update-all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 13,
    "errors": []
  },
  "message": "Updated costs for 13 recipes"
}
```

## Database Schema

### Recipe Model Enhancement
The `Recipe` model includes a new field:
- `estimatedCost: Float?` - Cached production cost for performance

## Frontend Features

### 1. Cost Display in Recipe List
- New "Estimated Cost" column in the recipes table
- Shows calculated production cost per recipe
- "Not calculated" indicator for recipes without cost data

### 2. Enhanced Cost Analysis Dialog
- Updated to show the new cost breakdown structure
- Displays material cost, overhead, and total production cost
- Ingredient-level cost details with type identification

### 3. Cost Integration
- Cost information is automatically displayed when viewing recipes
- Real-time updates when costs are recalculated
- Material breakdown integration (planned for production tracking)

## Implementation Details

### Cost Calculation Logic
1. **Ingredient Cost Aggregation**: Sum costs of all recipe ingredients
2. **Unit Conversion**: Handle different units between ingredients and raw materials
3. **Overhead Application**: Add 20% overhead for operational costs
4. **Caching**: Store calculated costs in database for performance

### Error Handling
- Graceful handling of missing ingredient prices
- Fallback to zero cost for unavailable ingredients
- Comprehensive error logging and user feedback

### Performance Considerations
- Cached cost values in database
- Batch update capabilities for multiple recipes
- Efficient ingredient cost lookups

## Usage Examples

### Calculating Individual Recipe Cost
```javascript
// Get detailed cost breakdown
const costResponse = await recipesApi.getCost(recipeId);
const { totalProductionCost, costPerUnit, ingredients } = costResponse.data;

// Display cost information
console.log(`Production Cost: $${totalProductionCost.toFixed(2)}`);
console.log(`Cost Per Unit: $${costPerUnit.toFixed(2)}`);
```

### Batch Cost Updates
```javascript
// Update all recipe costs
const updateResponse = await axios.put('/api/recipes/costs/update-all');
console.log(`Updated ${updateResponse.data.data.updated} recipes`);
```

## Integration Points

### Material Breakdown System
The cost calculation system integrates with the material breakdown feature to provide:
- Cost-aware production planning
- Material cost tracking in production workflows
- Profitability analysis for finished products

### Production Workflow
- Recipe costs are considered in production completion
- Cost data flows through to finished product pricing
- Historical cost tracking for production batches

## Future Enhancements

1. **Cost History Tracking**: Track cost changes over time
2. **Cost Alerts**: Notify when ingredient costs cause significant recipe cost changes
3. **Profitability Analysis**: Compare recipe costs to selling prices
4. **Supplier Cost Comparison**: Integration with supplier pricing for cost optimization
5. **Custom Overhead Rates**: Allow different overhead percentages per recipe category

## Testing

The system includes comprehensive tests for:
- Cost calculation accuracy
- API endpoint functionality
- Database integration
- Frontend display and interaction
- Error handling scenarios

## Deployment Notes

- Database migration required for `estimatedCost` field
- Existing recipes will need cost calculation on first use
- Recommend running batch update after deployment
- Cost calculations are backward compatible with existing data