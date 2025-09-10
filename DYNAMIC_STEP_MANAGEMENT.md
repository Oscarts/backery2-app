# Dynamic Production Step Management

## 🎯 Overview

The Dynamic Production Step Management feature allows users to modify production steps even after production has started. This provides flexibility to adapt to changing requirements, add quality checkpoints, or remove unnecessary steps during active production.

## ✨ New Capabilities

### What You Can Do

1. **Add New Steps During Production**: Insert custom steps at any point in the production workflow
2. **Remove Pending Steps**: Delete steps that haven't been started yet
3. **Insert Steps Between Existing Steps**: Add steps after specific existing steps
4. **Real-time Step Management**: All changes are immediately reflected in the production tracker

### Smart Restrictions

- ✅ Can only remove **PENDING** steps (not started/completed ones)
- ✅ Cannot modify **COMPLETED** or **CANCELLED** production runs
- ✅ Must keep at least one step in the production run
- ✅ Automatic step reordering maintains sequential flow

## 🚀 How to Use

### Accessing Step Management

1. **Navigate to Production Dashboard**
2. **Click on any active production run** to open the Production Tracker
3. **Look for the new step management buttons** on each step card:
   - **"Add After"** button - Adds a new step after the current one
   - **"Remove"** button - Removes pending steps (only visible for PENDING steps)
4. **"Add New Step"** card at the bottom to add steps at the end

### Adding Steps

#### Method 1: Add After Specific Step

1. Click **"Add After"** button on any step card
2. Fill in the step details:
   - **Step Name** (required)
   - **Description** (optional)
   - **Estimated Minutes** (default: 30)
3. Click **"Add Step"**
4. The new step will be inserted after the selected step

#### Method 2: Add at End

1. Click the **"Add New Step"** card at the bottom
2. Fill in the step details
3. Click **"Add Step"**
4. The new step will be added at the end of the workflow

### Removing Steps

1. Find a step with **PENDING** status
2. Click the **"Remove"** button (red, with delete icon)
3. The step will be immediately removed
4. Remaining steps will be automatically reordered

## 🔧 Technical Implementation

### Backend API Endpoints

#### Add Production Step

```
POST /api/production/runs/:productionRunId/steps
```

**Request Body:**

```json
{
  "name": "Custom Quality Check",
  "description": "Additional quality validation step",
  "estimatedMinutes": 15,
  "insertAfterStepId": "step-123" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "newStep": { /* newly created step */ },
    "allSteps": [ /* all steps with updated order */ ]
  }
}
```

#### Remove Production Step

```
DELETE /api/production/steps/:stepId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "removedStepId": "step-123",
    "allSteps": [ /* remaining steps with updated order */ ]
  }
}
```

### Frontend Integration

#### New API Methods

```typescript
// Add step
productionApi.addStep(productionRunId, {
  name: string,
  description?: string,
  estimatedMinutes: number,
  insertAfterStepId?: string
});

// Remove step
productionApi.removeStep(stepId);
```

#### Enhanced UI Components

1. **Enhanced Production Tracker**:
   - Step management buttons on each card
   - Add step dialog
   - Real-time updates

2. **Smart Button Visibility**:
   - Add buttons only shown for active productions
   - Remove buttons only for pending steps
   - Disabled states during loading

## 🎨 User Experience

### Visual Indicators

- **Add After Button**: Primary blue outline button with + icon
- **Remove Button**: Red outline button with delete icon (only for pending steps)
- **Add New Step Card**: Dashed border card with large + icon at bottom
- **Loading States**: Spinner icons during API operations

### User Feedback

- **Success Messages**: Immediate visual feedback when steps are added/removed
- **Error Handling**: Clear error messages for invalid operations
- **Real-time Updates**: Production tracker refreshes automatically

## 🔒 Business Rules

### When You Can Add Steps

- ✅ Production status is PLANNED, IN_PROGRESS, or ON_HOLD
- ✅ User has appropriate permissions
- ✅ Step name is provided and valid

### When You Can Remove Steps

- ✅ Step status is PENDING (not started)
- ✅ Production is not COMPLETED or CANCELLED
- ✅ At least one step will remain after removal

### Automatic Behaviors

- **Step Reordering**: All steps maintain sequential integer order (1, 2, 3...)
- **Real-time Sync**: All connected clients see changes immediately
- **Data Validation**: Invalid requests are rejected with clear error messages

## 📋 Use Cases

### Quality Control Scenarios

```
Scenario: Quality issue detected during production
Action: Add "Additional Quality Check" step after current step
Result: Production pauses for extra validation before continuing
```

### Process Optimization

```
Scenario: Realize a step is unnecessary during production
Action: Remove pending "Extra Packaging Check" step
Result: Production continues without the removed step
```

### Emergency Procedures

```
Scenario: Equipment issue requires additional step
Action: Add "Equipment Validation" step before next critical step
Result: Production safety is maintained with additional verification
```

## 🧪 Testing

### Manual Testing Steps

1. **Start a production run** with default steps
2. **Navigate to production tracker**
3. **Add a step** after the first step
4. **Verify** the new step appears in correct order
5. **Remove a pending step**
6. **Verify** the step is removed and order is maintained
7. **Try to remove a started step** - should be prevented
8. **Add a step at the end** using the bottom card

### API Testing

Use the provided test endpoints to verify:

- Step addition with proper ordering
- Step removal with validation
- Error handling for invalid operations
- Real-time updates across clients

## 🎉 Benefits

### For Production Managers

- **Flexibility**: Adapt to changing requirements in real-time
- **Quality Control**: Add validation steps when needed
- **Efficiency**: Remove unnecessary steps to speed up production

### For Operators

- **Clear Workflow**: Always see current, up-to-date step sequence
- **Intuitive Interface**: Simple buttons for step management
- **Real-time Updates**: No confusion about current production state

### For the Business

- **Agility**: Respond quickly to production issues or opportunities
- **Quality Assurance**: Dynamic quality checkpoints
- **Process Improvement**: Learn and adapt workflows in real-time

---

**Note**: This feature maintains backward compatibility. Existing production runs continue to work normally, and the new step management capabilities are additive enhancements to the existing workflow.
