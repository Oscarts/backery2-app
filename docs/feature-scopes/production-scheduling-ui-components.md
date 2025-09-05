# Production Scheduling UI Components

## Overview

The Production Scheduling UI provides users with tools to plan, schedule, and track production runs. This document outlines the key UI components and their interactions.

## Key Components

### 1. Production Calendar

The Production Calendar offers multiple views (month, week, day) to visualize scheduled production runs. It allows drag-and-drop scheduling and provides color-coding based on production status.

![Production Calendar](https://placeholder.com/production-calendar)

```tsx
// ProductionCalendar.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  ButtonGroup,
  Button,
  useTheme,
} from '@mui/material';
import {
  CalendarMonth as CalendarMonthIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
} from '@mui/icons-material';
import { FullCalendar } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { productionSchedulesApi } from '../services/realApi';
import { ProductionSchedule, ProductionStatus } from '../types';

interface ProductionCalendarProps {
  onEventClick: (scheduleId: string) => void;
  onDateClick: (date: Date) => void;
  onEventDrop: (scheduleId: string, newStartDate: Date, newEndDate: Date) => void;
}

const ProductionCalendar: React.FC<ProductionCalendarProps> = ({
  onEventClick,
  onDateClick,
  onEventDrop,
}) => {
  const theme = useTheme();
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  
  // Fetch production schedules
  const { data: schedulesResponse } = useQuery(['productionSchedules'], productionSchedulesApi.getAll);
  
  const schedules = schedulesResponse?.data || [];
  
  // Map schedules to calendar events
  const events = schedules.map((schedule: ProductionSchedule) => ({
    id: schedule.id,
    title: schedule.name,
    start: schedule.startDate,
    end: schedule.endDate || undefined,
    backgroundColor: getColorForStatus(schedule.status),
    borderColor: theme.palette.divider,
    extendedProps: {
      description: schedule.description,
      recipe: schedule.recipe?.name,
      status: schedule.status,
    },
  }));
  
  // Get color based on production status
  const getColorForStatus = (status: ProductionStatus): string => {
    switch (status) {
      case ProductionStatus.PLANNED:
        return theme.palette.info.main;
      case ProductionStatus.IN_PROGRESS:
        return theme.palette.primary.main;
      case ProductionStatus.COMPLETED:
        return theme.palette.success.main;
      case ProductionStatus.CANCELLED:
        return theme.palette.error.light;
      case ProductionStatus.ON_HOLD:
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Production Schedule</Typography>
        <ButtonGroup size="small">
          <Button 
            variant={view === 'dayGridMonth' ? 'contained' : 'outlined'}
            onClick={() => setView('dayGridMonth')}
            startIcon={<CalendarMonthIcon />}
          >
            Month
          </Button>
          <Button 
            variant={view === 'timeGridWeek' ? 'contained' : 'outlined'}
            onClick={() => setView('timeGridWeek')}
            startIcon={<ViewWeekIcon />}
          >
            Week
          </Button>
          <Button 
            variant={view === 'timeGridDay' ? 'contained' : 'outlined'}
            onClick={() => setView('timeGridDay')}
            startIcon={<ViewDayIcon />}
          >
            Day
          </Button>
        </ButtonGroup>
      </Box>
      
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '07:00',
            endTime: '18:00',
          }}
          height="100%"
          eventClick={(info) => {
            onEventClick(info.event.id);
          }}
          dateClick={(info) => {
            onDateClick(info.date);
          }}
          eventDrop={(info) => {
            onEventDrop(
              info.event.id,
              info.event.start || new Date(),
              info.event.end || undefined
            );
          }}
        />
      </Box>
    </Paper>
  );
};

export default ProductionCalendar;
```

### 2. Production Schedule Wizard

The Production Schedule Wizard guides users through the process of creating a new production schedule, from selecting a recipe to allocating resources.

![Production Schedule Wizard](https://placeholder.com/production-wizard)

```tsx
// ProductionWizard.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi, productionSchedulesApi } from '../services/realApi';
import { CreateProductionScheduleData } from '../types';

interface ProductionWizardProps {
  open: boolean;
  onClose: () => void;
}

const ProductionWizard: React.FC<ProductionWizardProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CreateProductionScheduleData>({
    name: '',
    startDate: new Date().toISOString(),
    recipeId: '',
    outputQuantity: 0,
    outputUnit: '',
  });
  
  const queryClient = useQueryClient();
  
  const { data: recipesResponse } = useQuery(['recipes'], recipesApi.getAll);
  const recipes = recipesResponse?.data || [];
  
  const createMutation = useMutation(productionSchedulesApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['productionSchedules']);
      onClose();
    },
  });
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleChange = (field: keyof CreateProductionScheduleData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
    if (date) {
      setFormData((prev) => ({ ...prev, [field]: date.toISOString() }));
    }
  };
  
  const handleSubmit = () => {
    createMutation.mutate(formData);
  };
  
  const steps = ['Select Recipe', 'Set Schedule', 'Resource Allocation', 'Review'];
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Production Schedule</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Recipe and Output
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Production Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Recipe</InputLabel>
                  <Select
                    value={formData.recipeId}
                    onChange={(e) => handleChange('recipeId', e.target.value)}
                    label="Recipe"
                  >
                    {recipes.map((recipe: any) => (
                      <MenuItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Output Quantity"
                  type="number"
                  fullWidth
                  value={formData.outputQuantity}
                  onChange={(e) => handleChange('outputQuantity', parseFloat(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Output Unit"
                  fullWidth
                  value={formData.outputUnit}
                  onChange={(e) => handleChange('outputUnit', e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Set Schedule
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Date/Time"
                    value={new Date(formData.startDate)}
                    onChange={(date) => handleDateChange(date, 'startDate')}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="End Date/Time (Optional)"
                    value={formData.endDate ? new Date(formData.endDate) : null}
                    onChange={(date) => handleDateChange(date, 'endDate')}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Assigned To (Optional)"
                  fullWidth
                  value={formData.assignedTo || ''}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes (Optional)"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Resource allocation and review steps would be implemented similarly */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={createMutation.isLoading}
          >
            Create Schedule
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProductionWizard;
```

### 3. Production Detail View

The Production Detail View displays comprehensive information about a production schedule, including its steps, resources, and status.

![Production Detail View](https://placeholder.com/production-detail)

```tsx
// ProductionDetail.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Button,
  IconButton,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  FormatListBulleted as StepIcon,
  Inventory as MaterialIcon,
  Kitchen as EquipmentIcon,
  Person as PersonnelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionSchedulesApi, productionStepsApi } from '../services/realApi';
import { format } from 'date-fns';
import {
  ProductionSchedule,
  ProductionStatus,
  ProductionStep,
  StepStatus,
  ResourceAllocation,
  ResourceType,
} from '../types';

interface ProductionDetailProps {
  scheduleId: string;
  onEdit: () => void;
  onDelete: () => void;
}

const ProductionDetail: React.FC<ProductionDetailProps> = ({
  scheduleId,
  onEdit,
  onDelete,
}) => {
  const queryClient = useQueryClient();
  
  const { data: scheduleResponse, isLoading } = useQuery(
    ['productionSchedules', scheduleId],
    () => productionSchedulesApi.getById(scheduleId)
  );
  
  const schedule = scheduleResponse?.data;
  
  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: ProductionStatus }) =>
      productionSchedulesApi.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['productionSchedules', scheduleId]);
      },
    }
  );
  
  const updateStepStatusMutation = useMutation(
    ({ id, status }: { id: string; status: StepStatus }) =>
      productionStepsApi.updateStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['productionSchedules', scheduleId]);
      },
    }
  );
  
  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case ProductionStatus.PLANNED:
        return 'info';
      case ProductionStatus.IN_PROGRESS:
        return 'primary';
      case ProductionStatus.COMPLETED:
        return 'success';
      case ProductionStatus.CANCELLED:
        return 'error';
      case ProductionStatus.ON_HOLD:
        return 'warning';
      default:
        return 'default';
    }
  };
  
  const getStepStatusColor = (status: StepStatus) => {
    switch (status) {
      case StepStatus.PENDING:
        return 'default';
      case StepStatus.IN_PROGRESS:
        return 'primary';
      case StepStatus.COMPLETED:
        return 'success';
      case StepStatus.SKIPPED:
        return 'info';
      case StepStatus.FAILED:
        return 'error';
      default:
        return 'default';
    }
  };
  
  const handleStatusChange = (newStatus: ProductionStatus) => {
    if (schedule) {
      updateStatusMutation.mutate({ id: schedule.id, status: newStatus });
    }
  };
  
  const handleStepStatusChange = (stepId: string, newStatus: StepStatus) => {
    updateStepStatusMutation.mutate({ id: stepId, status: newStatus });
  };
  
  if (isLoading || !schedule) {
    return <Typography>Loading...</Typography>;
  }
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5">{schedule.name}</Typography>
              <Chip
                label={schedule.status}
                color={getStatusColor(schedule.status)}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {schedule.description}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {schedule.status === ProductionStatus.PLANNED && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayIcon />}
                  onClick={() => handleStatusChange(ProductionStatus.IN_PROGRESS)}
                >
                  Start
                </Button>
              )}
              {schedule.status === ProductionStatus.IN_PROGRESS && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleStatusChange(ProductionStatus.COMPLETED)}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PauseIcon />}
                    onClick={() => handleStatusChange(ProductionStatus.ON_HOLD)}
                  >
                    Pause
                  </Button>
                </>
              )}
              {schedule.status === ProductionStatus.ON_HOLD && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayIcon />}
                  onClick={() => handleStatusChange(ProductionStatus.IN_PROGRESS)}
                >
                  Resume
                </Button>
              )}
              <IconButton onClick={onEdit} size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={onDelete} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Recipe
            </Typography>
            <Typography variant="body1">
              {schedule.recipe?.name || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Output
            </Typography>
            <Typography variant="body1">
              {`${schedule.outputQuantity} ${schedule.outputUnit}`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body1">
              {format(new Date(schedule.startDate), 'MMM d, yyyy h:mm a')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Typography variant="subtitle2" color="text.secondary">
              End Date
            </Typography>
            <Typography variant="body1">
              {schedule.endDate
                ? format(new Date(schedule.endDate), 'MMM d, yyyy h:mm a')
                : 'Not specified'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Production Steps
            </Typography>
            <Timeline position="right" sx={{ p: 0 }}>
              {schedule.productionSteps?.map((step: ProductionStep) => (
                <TimelineItem key={step.id}>
                  <TimelineOppositeContent sx={{ flex: 0.2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {step.durationMinutes ? `${step.durationMinutes} min` : ''}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={getStepStatusColor(step.status)} />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardHeader
                        title={step.name}
                        subheader={
                          <Chip
                            label={step.status}
                            size="small"
                            color={getStepStatusColor(step.status)}
                            sx={{ mt: 0.5 }}
                          />
                        }
                        action={
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {step.status === StepStatus.PENDING && (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleStepStatusChange(step.id, StepStatus.IN_PROGRESS)
                                }
                              >
                                <PlayIcon fontSize="small" />
                              </IconButton>
                            )}
                            {step.status === StepStatus.IN_PROGRESS && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                  handleStepStatusChange(step.id, StepStatus.COMPLETED)
                                }
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        }
                      />
                      {step.description && (
                        <CardContent sx={{ pt: 0 }}>
                          <Typography variant="body2">{step.description}</Typography>
                        </CardContent>
                      )}
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resource Allocation
            </Typography>
            <List dense disablePadding>
              {schedule.resourceAllocations?.map((allocation: ResourceAllocation) => {
                const getIcon = () => {
                  switch (allocation.resourceType) {
                    case ResourceType.RAW_MATERIAL:
                      return <MaterialIcon />;
                    case ResourceType.EQUIPMENT:
                      return <EquipmentIcon />;
                    case ResourceType.PERSONNEL:
                      return <PersonnelIcon />;
                    default:
                      return <MaterialIcon />;
                  }
                };
                
                return (
                  <ListItem key={allocation.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getIcon()}
                    </ListItemIcon>
                    <ListItemText
                      primary={allocation.resourceName}
                      secondary={
                        allocation.quantityRequired
                          ? `${allocation.quantityRequired} ${allocation.unit || ''}`
                          : undefined
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductionDetail;
```

### 4. Resource Allocation Component

The Resource Allocation component allows users to manage resources for production schedules, view availability, and resolve conflicts.

![Resource Allocation](https://placeholder.com/resource-allocation)

```tsx
// ResourceAllocation.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceAvailabilityApi, productionSchedulesApi } from '../services/realApi';
import { ResourceType } from '../types';

interface ResourceAllocationProps {
  scheduleId: string;
}

const ResourceAllocation: React.FC<ResourceAllocationProps> = ({ scheduleId }) => {
  const [newAllocation, setNewAllocation] = useState({
    resourceType: ResourceType.RAW_MATERIAL,
    resourceId: '',
    quantityRequired: '',
    unit: '',
  });
  
  const queryClient = useQueryClient();
  
  const { data: availabilityResponse } = useQuery(
    ['resourceAvailability', scheduleId],
    () => resourceAvailabilityApi.getForSchedule(scheduleId)
  );
  
  const { data: scheduleResponse } = useQuery(
    ['productionSchedules', scheduleId],
    () => productionSchedulesApi.getById(scheduleId)
  );
  
  const allocateResourceMutation = useMutation(
    (allocation: any) => productionSchedulesApi.allocateResources(scheduleId, { allocations: [allocation] }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['resourceAvailability', scheduleId]);
        queryClient.invalidateQueries(['productionSchedules', scheduleId]);
        setNewAllocation({
          resourceType: ResourceType.RAW_MATERIAL,
          resourceId: '',
          quantityRequired: '',
          unit: '',
        });
      },
    }
  );
  
  const removeAllocationMutation = useMutation(
    (allocationId: string) => productionSchedulesApi.removeAllocation(scheduleId, allocationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['resourceAvailability', scheduleId]);
        queryClient.invalidateQueries(['productionSchedules', scheduleId]);
      },
    }
  );
  
  const availableResources = availabilityResponse?.data || [];
  const schedule = scheduleResponse?.data;
  const allocations = schedule?.resourceAllocations || [];
  
  const handleAddResource = () => {
    if (newAllocation.resourceId) {
      allocateResourceMutation.mutate(newAllocation);
    }
  };
  
  const handleRemoveAllocation = (allocationId: string) => {
    removeAllocationMutation.mutate(allocationId);
  };
  
  const getResourceTypeName = (type: ResourceType) => {
    switch (type) {
      case ResourceType.RAW_MATERIAL:
        return 'Raw Material';
      case ResourceType.INTERMEDIATE_PRODUCT:
        return 'Intermediate Product';
      case ResourceType.EQUIPMENT:
        return 'Equipment';
      case ResourceType.PERSONNEL:
        return 'Personnel';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Allocated Resources
        </Typography>
        
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.map((allocation) => (
              <TableRow key={allocation.id}>
                <TableCell>{getResourceTypeName(allocation.resourceType)}</TableCell>
                <TableCell>{allocation.resourceName || allocation.resourceId}</TableCell>
                <TableCell>
                  {allocation.quantityRequired 
                    ? `${allocation.quantityRequired} ${allocation.unit || ''}` 
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {allocation.isConfirmed ? (
                    <Chip
                      size="small"
                      color="success"
                      icon={<CheckIcon />}
                      label="Confirmed"
                    />
                  ) : (
                    <Chip
                      size="small"
                      color="warning"
                      icon={<WarningIcon />}
                      label="Pending"
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveAllocation(allocation.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {allocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No resources allocated yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add Resource
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Resource Type</InputLabel>
            <Select
              value={newAllocation.resourceType}
              onChange={(e) =>
                setNewAllocation({
                  ...newAllocation,
                  resourceType: e.target.value as ResourceType,
                })
              }
              label="Resource Type"
            >
              {Object.values(ResourceType).map((type) => (
                <MenuItem key={type} value={type}>
                  {getResourceTypeName(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ flexGrow: 1 }}>
            <InputLabel>Resource</InputLabel>
            <Select
              value={newAllocation.resourceId}
              onChange={(e) =>
                setNewAllocation({
                  ...newAllocation,
                  resourceId: e.target.value as string,
                })
              }
              label="Resource"
            >
              {availableResources
                .filter((r) => r.resourceType === newAllocation.resourceType)
                .map((resource) => (
                  <MenuItem key={resource.resourceId} value={resource.resourceId}>
                    {resource.resourceName} 
                    {resource.availableQuantity !== undefined && 
                      ` (${resource.availableQuantity} ${resource.unit || ''} available)`}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Quantity"
            type="number"
            value={newAllocation.quantityRequired}
            onChange={(e) =>
              setNewAllocation({
                ...newAllocation,
                quantityRequired: e.target.value,
              })
            }
            sx={{ width: 120 }}
          />
          
          <TextField
            label="Unit"
            value={newAllocation.unit}
            onChange={(e) =>
              setNewAllocation({
                ...newAllocation,
                unit: e.target.value,
              })
            }
            sx={{ width: 120 }}
          />
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddResource}
            disabled={!newAllocation.resourceId}
          >
            Add
          </Button>
        </Box>
        
        {allocateResourceMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to allocate resource. The resource may be unavailable in the requested quantity.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default ResourceAllocation;
```

## UI Navigation Flow

1. **Dashboard** - Shows overview of scheduled production runs and resource utilization
2. **Production Schedules Page** - Lists all production schedules with filtering options
3. **Calendar View** - Visual representation of scheduled production runs
4. **Production Detail** - Comprehensive view of a single production schedule
5. **Resource Management** - Resource allocation and availability tracking

## Material-UI Theme Integration

All components follow the existing Material-UI theme with consistent use of:

- Color coding for status indicators
- Typography hierarchy
- Spacing system
- Card and paper components
- Form controls

## Mobile Responsive Design

All components are designed to be responsive, with special considerations for mobile:

- Calendar view switches to agenda layout on small screens
- Forms use full width on mobile
- Timeline components adapt to smaller screens
- Tables become scrollable horizontally when needed

## Accessibility Considerations

- All icons have proper aria-labels
- Color is not the only means of conveying status
- Keyboard navigation is supported
- Proper heading hierarchy is maintained
- Forms have appropriate labels and error messaging

## Next Steps

1. Implement the components as described
2. Connect to backend APIs
3. Add comprehensive error handling
4. Implement unit and integration tests
5. Conduct usability testing
