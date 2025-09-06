# Simple Production Run MVP - For Small Bakeries

## Overview

This MVP transforms complex production scheduling into a simple, visual workflow that small bakery owners can use intuitively. The focus is on **immediate action** rather than complex planning - perfect for daily bakery operations.

## 🎯 Design Philosophy

- **Think Like a Baker**: Start with "I want to make something now"
- **Visual & Immediate**: Each step shows exactly what's happening
- **Flexible Process**: Add steps as you go, not rigid planning
- **Real-time Inventory**: Everything updates immediately
- **Mobile-First**: Perfect for use in the kitchen

## 🚀 The Simple Production Flow

### Step 1: "Make a Run" - Quick Start Production

**UI Design**: Big, colorful "Start Production" button on dashboard

```
┌─────────────────────────────────────┐
│  🧑‍🍳 Ready to Make Something?        │
│                                     │
│  [🚀 START PRODUCTION RUN]          │
│                                     │
│  Recent Recipes:                    │
│  🧁 Chocolate Cupcakes              │
│  🍞 Sourdough Bread                 │
│  🥖 Baguettes                       │
└─────────────────────────────────────┘
```

### Step 2: Recipe Selection with Smart Suggestions

**Visual Recipe Cards** with instant feasibility check:

```
Choose Your Recipe:

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🧁 Cupcakes     │  │ 🍞 Sourdough    │  │ 🥖 Baguettes    │
│                 │  │                 │  │                 │
│ ✅ Can Make 24  │  │ ⚠️  Missing Flour│  │ ✅ Can Make 12  │
│ Ready to go!    │  │ Need 2kg more   │  │ Ready to go!    │
│                 │  │                 │  │                 │
│ [SELECT]        │  │ [BUY INGREDIENTS│  │ [SELECT]        │
└─────────────────┘  │  FIRST]         │  └─────────────────┘
                     └─────────────────┘
```

### Step 3: Quantity & Smart Calculator

**Interactive quantity selector** with real-time calculations:

```
How many Chocolate Cupcakes?

┌─────────────────────────────────────────────────────────┐
│  Recipe makes: 12 cupcakes                             │
│                                                         │
│  I want to make: [🔽 24] cupcakes                      │
│                                                         │
│  📊 This means:                                         │
│  ├── 2x the recipe (double batch)                      │
│  ├── 🕐 About 45 minutes total time                    │
│  └── 💰 Estimated cost: $8.50                          │
│                                                         │
│  📦 You'll need:                                        │
│  ├── Flour: 400g (✅ have 2kg)                         │
│  ├── Sugar: 300g (✅ have 1kg)                         │
│  ├── Eggs: 4 (✅ have 12)                              │
│  └── Butter: 200g (⚠️ have 150g - need 50g more)      │
│                                                         │
│  [🛒 BUY MISSING]  [✅ LOOKS GOOD, START!]            │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Production Dashboard - Visual Workflow

**Kitchen-Friendly Production Interface**:

```
🧁 Making: 24 Chocolate Cupcakes
Batch #: CC-20250906-001
Started: 9:15 AM

┌─────────────────────────────────────────────────────────┐
│ Current Step: 📝 Prep Ingredients                      │
│ ⏱️  05:12 elapsed                                       │
│                                                         │
│ Steps:                                                  │
│ ✅ 1. Gather ingredients (3 min)                       │
│ 🔵 2. Prep ingredients (15 min) ← YOU ARE HERE         │
│ ⚪ 3. Mix batter (10 min)                              │
│ ⚪ 4. Bake (20 min)                                     │
│ ⚪ 5. Cool & finish (15 min)                           │
│                                                         │
│ [⏸️  PAUSE] [✅ COMPLETE STEP] [➕ ADD STEP]            │
│                                                         │
│ 💡 Notes for this step:                                │
│ "Bring eggs to room temperature, sift flour"           │
└─────────────────────────────────────────────────────────┘
```

### Step 5: Dynamic Step Management

**Add steps on-the-fly** for real bakery flexibility:

```
✅ Step 4: Bake completed!

Your cupcakes are ready for the next step.
What happens next?

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🎂 Frosting     │  │ 📦 Packaging    │  │ ✅ All Done     │
│                 │  │                 │  │                 │
│ Add frosting    │  │ Package for     │  │ Move to         │
│ decoration step │  │ sale/storage    │  │ finished goods  │
│                 │  │                 │  │                 │
│ [ADD STEP]      │  │ [ADD STEP]      │  │ [FINISH]        │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Or add a custom step:
[➕ Create Custom Step] 
```

**Custom Step Creator**:

```
➕ Add Custom Step

Step Name: [Packaging in display boxes        ]
Estimated Time: [10] minutes
Description: [Place cupcakes in clear display boxes
             with bakery labels              ]

Current position: After "Cool & finish"
Move to: [🔽 End of process]

[CANCEL] [ADD STEP]
```

### Step 6: Real-Time Inventory Updates

**Behind the scenes magic** - inventory updates at each step:

```
🔄 Inventory Updates (Live):

Raw Materials Used:
├── Flour: 400g → Available: 1.6kg (was 2kg)
├── Sugar: 300g → Available: 700g (was 1kg)  
├── Eggs: 4 → Available: 8 (was 12)
└── Butter: 200g → Available: 800g (was 1kg)

🏭 In Production:
└── 24 Chocolate Cupcakes (Step 3/5) - Est. finish: 10:30 AM

📦 Will be added to finished goods when complete:
└── 24 Chocolate Cupcakes ready for sale
```

### Step 7: Production Completion & Success

**Celebration & inventory update**:

```
🎉 Production Complete!

┌─────────────────────────────────────────────────────────┐
│  ✅ 24 Chocolate Cupcakes                               │
│  📅 Completed: Sep 6, 2025 at 10:28 AM                 │
│  ⏱️  Total time: 1h 13min                              │
│  💰 Actual cost: $8.75                                 │
│                                                         │
│  📦 Added to inventory:                                 │
│  ├── Product: Chocolate Cupcakes                       │
│  ├── Batch: CC-20250906-001                            │
│  ├── Quantity: 24 units                                │
│  ├── Expiry: Sep 9, 2025                               │
│  └── Status: ✅ Ready for Sale                         │
│                                                         │
│  [📊 VIEW ANALYTICS] [🚀 START ANOTHER] [📦 VIEW INV]  │
└─────────────────────────────────────────────────────────┘
```

## 📱 Mobile-First UI Components

### 1. Production Card Component

```tsx
// ProductionRunCard.tsx - Mobile-optimized production tracking
<Card className="production-card">
  <CardHeader 
    title="🧁 Chocolate Cupcakes"
    subtitle="Batch CC-001 • Started 9:15 AM"
    action={<StatusChip status="IN_PROGRESS" />}
  />
  
  <LinearProgress 
    value={60} 
    variant="determinate"
    className="progress-bar"
  />
  
  <CardContent>
    <Typography variant="h6">Step 3 of 5: Mix Batter</Typography>
    <Typography variant="body2">⏱️ 05:12 elapsed</Typography>
    
    <Box className="step-actions">
      <Button variant="outlined" startIcon={<PauseIcon />}>
        Pause
      </Button>
      <Button variant="contained" startIcon={<CheckIcon />}>
        Complete Step
      </Button>
    </Box>
  </CardContent>
</Card>
```

### 2. Quick Action Floating Button

```tsx
// QuickProductionFAB.tsx - Always accessible production start
<Fab 
  color="primary" 
  className="production-fab"
  onClick={() => setShowProductionWizard(true)}
>
  <KitchenIcon />
</Fab>

// Shows overlay: "Start Production"
```

### 3. Smart Recipe Selector

```tsx
// SmartRecipeSelector.tsx - Intelligent recipe suggestions
<Grid container spacing={2}>
  {recipes.map(recipe => (
    <Grid item xs={12} sm={6} md={4} key={recipe.id}>
      <Card className={`recipe-card ${getAvailabilityClass(recipe)}`}>
        <CardMedia 
          component="img"
          height="140"
          image={recipe.image || defaultRecipeImage}
        />
        <CardContent>
          <Typography variant="h6">{recipe.name}</Typography>
          <AvailabilityChip recipe={recipe} inventory={inventory} />
          <Typography variant="body2">
            Makes {recipe.yieldQuantity} {recipe.yieldUnit}
          </Typography>
        </CardContent>
        <CardActions>
          <Button 
            variant="contained" 
            disabled={!canMake(recipe)}
            onClick={() => startProduction(recipe)}
          >
            {canMake(recipe) ? 'Start Making' : 'Missing Ingredients'}
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ))}
</Grid>
```

## 🛠 Technical Implementation

### Database Schema Changes (Minimal)

```sql
-- Simple production runs table
CREATE TABLE production_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  recipe_id UUID REFERENCES recipes(id),
  target_quantity INTEGER NOT NULL,
  target_unit VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
  current_step_index INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  estimated_finish_at TIMESTAMP,
  actual_cost DECIMAL(10,2),
  batch_number VARCHAR(100) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Flexible production steps
CREATE TABLE production_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_run_id UUID REFERENCES production_runs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_minutes INTEGER,
  step_order INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, SKIPPED
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track what ingredients are allocated to productions
CREATE TABLE production_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_run_id UUID REFERENCES production_runs(id) ON DELETE CASCADE,
  material_type VARCHAR(50) NOT NULL, -- 'raw_material', 'intermediate_product'
  material_id UUID NOT NULL,
  quantity_allocated DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  allocated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints (RESTful & Simple)

```typescript
// Production API endpoints
POST /api/production-runs/start
{
  "recipeId": "uuid",
  "targetQuantity": 24,
  "targetUnit": "cupcakes"
}

GET /api/production-runs/active
// Returns all active productions for the dashboard

PUT /api/production-runs/:id/step/:stepId/complete
{
  "actualMinutes": 12,
  "notes": "Took longer than expected"
}

POST /api/production-runs/:id/add-step
{
  "name": "Packaging",
  "description": "Place in display boxes",
  "estimatedMinutes": 10,
  "insertAfter": 4
}

PUT /api/production-runs/:id/complete
{
  "finalQuantity": 22, // if some were damaged
  "qualityNotes": "2 cupcakes fell, rest perfect"
}
```

### Smart Inventory Integration

```typescript
// Auto-calculate ingredient needs
const calculateIngredientNeeds = (recipe: Recipe, targetQuantity: number) => {
  const multiplier = targetQuantity / recipe.yieldQuantity;
  
  return recipe.ingredients.map(ingredient => ({
    ...ingredient,
    neededQuantity: ingredient.quantity * multiplier,
    available: getAvailableQuantity(ingredient.materialId),
    canMake: getAvailableQuantity(ingredient.materialId) >= (ingredient.quantity * multiplier)
  }));
};

// Reserve ingredients when production starts
const reserveIngredients = async (productionId: string, ingredients: Ingredient[]) => {
  for (const ingredient of ingredients) {
    await updateMaterialQuantity(
      ingredient.materialId, 
      -ingredient.neededQuantity,
      `Reserved for production ${productionId}`
    );
  }
};

// Release ingredients if production cancelled
const releaseIngredients = async (productionId: string) => {
  const allocations = await getProductionAllocations(productionId);
  for (const allocation of allocations) {
    await updateMaterialQuantity(
      allocation.materialId,
      allocation.quantityAllocated,
      `Released from cancelled production ${productionId}`
    );
  }
};
```

## 🎨 Visual Design System

### Color-Coded Status System

```css
.production-status {
  /* In Progress - Energetic blue */
  --in-progress: #2196F3;
  --in-progress-bg: #E3F2FD;
  
  /* Paused - Cautious orange */
  --paused: #FF9800;
  --paused-bg: #FFF3E0;
  
  /* Completed - Success green */
  --completed: #4CAF50;
  --completed-bg: #E8F5E8;
  
  /* Error/Problem - Alert red */
  --error: #F44336;
  --error-bg: #FFEBEE;
}

.step-card {
  border-left: 4px solid var(--step-status-color);
  transition: all 0.3s ease;
}

.step-card.active {
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3);
}
```

### Responsive Mobile Layout

```css
.production-dashboard {
  padding: 16px;
  max-width: 100vw;
  overflow-x: hidden;
}

.production-card {
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.step-progress {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--completed) 60%, var(--pending) 60%);
}

@media (max-width: 768px) {
  .production-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
  }
  
  .recipe-grid {
    grid-template-columns: 1fr;
  }
  
  .step-actions {
    flex-direction: column;
    gap: 8px;
  }
}
```

## 🚀 Implementation Phases

### Phase 1: Core Production Flow (1 week)

- Basic production run creation
- Recipe selection with availability check
- Simple step tracking
- Inventory allocation/deallocation

### Phase 2: Enhanced UX (1 week)

- Mobile-optimized interface
- Real-time progress tracking
- Custom step addition
- Production dashboard

### Phase 3: Smart Features (1 week)

- Intelligent recipe suggestions
- Cost tracking and analytics
- Batch number generation
- Production history

## 🎯 Success Metrics

- **Ease of Use**: Baker can start production in < 30 seconds
- **Real-time Accuracy**: Inventory always reflects current state
- **Flexibility**: Can adapt to unexpected changes during production
- **Mobile Friendly**: Works perfectly on kitchen tablets/phones
- **No Training Needed**: Intuitive enough for any bakery staff

This MVP transforms complex production scheduling into something that feels as natural as following a recipe - because that's exactly what bakers are already doing! 🧑‍🍳✨
