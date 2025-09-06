# Database Migration Specification - Production Module

## 📋 Overview

This document specifies the exact database changes required to implement the production module, ensuring backwards compatibility while adding production workflow capabilities.

## 🎯 Migration Strategy

### Approach: Additive Enhancement (Project Guidelines Compliant)

- **No breaking changes** to existing schema
- **All new fields optional** with sensible defaults  
- **Follow existing Prisma patterns** in schema.prisma
- **Use project's standard migration process**: `npx prisma migrate dev --name add_production_module`
- **Update seed.ts** to include production data following existing patterns
- **Backwards compatible** API behavior

## 📊 Schema Changes

### 1. Recipe Table Enhancements

#### Add Production-Specific Fields

```sql
-- Migration: 20250906_add_recipe_production_fields
ALTER TABLE recipes ADD COLUMN emoji VARCHAR(10);
ALTER TABLE recipes ADD COLUMN difficulty VARCHAR(10) 
  CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'));
ALTER TABLE recipes ADD COLUMN estimated_total_time INTEGER;
ALTER TABLE recipes ADD COLUMN equipment_required TEXT[];
ALTER TABLE recipes ADD COLUMN shelf_life_days INTEGER;
ALTER TABLE recipes ADD COLUMN storage_instructions TEXT;
ALTER TABLE recipes ADD COLUMN quality_control_notes TEXT;

-- Cost and Batch Planning
ALTER TABLE recipes ADD COLUMN estimated_cost_per_batch DECIMAL(10,2);
ALTER TABLE recipes ADD COLUMN estimated_cost_per_unit DECIMAL(10,2);
ALTER TABLE recipes ADD COLUMN suggested_sale_price DECIMAL(10,2);
ALTER TABLE recipes ADD COLUMN profit_margin DECIMAL(5,2);
ALTER TABLE recipes ADD COLUMN minimum_batch_size INTEGER;
ALTER TABLE recipes ADD COLUMN maximum_batch_size INTEGER;
ALTER TABLE recipes ADD COLUMN popular_batch_sizes INTEGER[];

-- Visual and UI Enhancement
ALTER TABLE recipes ADD COLUMN color_hex VARCHAR(7);
ALTER TABLE recipes ADD COLUMN tags TEXT[];
ALTER TABLE recipes ADD COLUMN image_url TEXT;
ALTER TABLE recipes ADD COLUMN thumbnail_url TEXT;
ALTER TABLE recipes ADD COLUMN popularity_score INTEGER DEFAULT 0;
ALTER TABLE recipes ADD COLUMN last_made_date TIMESTAMP;
ALTER TABLE recipes ADD COLUMN average_rating DECIMAL(3,2);

-- Performance and History
ALTER TABLE recipes ADD COLUMN average_actual_time INTEGER;
ALTER TABLE recipes ADD COLUMN success_rate DECIMAL(5,2);
ALTER TABLE recipes ADD COLUMN notes_from_last_batch TEXT;

-- Inventory Integration
ALTER TABLE recipes ADD COLUMN lead_time_hours INTEGER;
ALTER TABLE recipes ADD COLUMN seasonal_availability TEXT[];

-- Add indexes for performance
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_popularity ON recipes(popularity_score DESC);
CREATE INDEX idx_recipes_last_made ON recipes(last_made_date DESC);
```

#### Default Values for Existing Recipes

```sql
-- Set intelligent defaults for existing recipes
UPDATE recipes SET 
  difficulty = 'MEDIUM',
  estimated_total_time = COALESCE(prep_time, 0) + COALESCE(cook_time, 0),
  minimum_batch_size = yield_quantity,
  maximum_batch_size = yield_quantity * 4,
  popular_batch_sizes = ARRAY[yield_quantity, yield_quantity * 2],
  popularity_score = 50,
  success_rate = 95.0,
  shelf_life_days = 3,
  lead_time_hours = 2
WHERE difficulty IS NULL;

-- Set emojis based on category
UPDATE recipes SET emoji = '🧁' WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%cupcake%' OR name ILIKE '%muffin%'
);
UPDATE recipes SET emoji = '🍞' WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%bread%'
);
UPDATE recipes SET emoji = '🥐' WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%pastry%' OR name ILIKE '%croissant%'
);
UPDATE recipes SET emoji = '🍪' WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%cookie%'
);
UPDATE recipes SET emoji = '🎂' WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%cake%'
);
-- Default for uncategorized
UPDATE recipes SET emoji = '🧑‍🍳' WHERE emoji IS NULL;
```

### 2. Production Step Templates Table

```sql
-- Migration: 20250906_create_production_step_templates
CREATE TABLE production_step_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipe_id VARCHAR NOT NULL,
  step_order INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_minutes INTEGER,
  instructions TEXT,
  temperature_f INTEGER,
  equipment_needed TEXT[],
  quality_checkpoints TEXT[],
  safety_notes TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_step_templates_recipe 
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  CONSTRAINT check_step_order_positive 
    CHECK (step_order > 0),
  CONSTRAINT check_estimated_minutes_positive 
    CHECK (estimated_minutes IS NULL OR estimated_minutes > 0)
);

-- Indexes for performance
CREATE INDEX idx_step_templates_recipe_order ON production_step_templates(recipe_id, step_order);
CREATE INDEX idx_step_templates_recipe ON production_step_templates(recipe_id);

-- Unique constraint to prevent duplicate step orders per recipe
CREATE UNIQUE INDEX idx_step_templates_unique_order 
  ON production_step_templates(recipe_id, step_order);
```

#### Default Production Steps for Existing Recipes

```sql
-- Insert default production steps for existing recipes
INSERT INTO production_step_templates (recipe_id, step_order, name, estimated_minutes, instructions)
SELECT 
  id as recipe_id,
  1 as step_order,
  'Gather ingredients' as name,
  5 as estimated_minutes,
  'Collect all ingredients and verify quantities' as instructions
FROM recipes WHERE is_active = true;

INSERT INTO production_step_templates (recipe_id, step_order, name, estimated_minutes, instructions)
SELECT 
  id as recipe_id,
  2 as step_order,
  'Prep ingredients' as name,
  GREATEST(prep_time * 0.7, 10)::integer as estimated_minutes,
  'Measure, sift, and prepare all ingredients' as instructions
FROM recipes WHERE is_active = true AND prep_time IS NOT NULL;

INSERT INTO production_step_templates (recipe_id, step_order, name, estimated_minutes, instructions)
SELECT 
  id as recipe_id,
  3 as step_order,
  'Mix and prepare' as name,
  GREATEST(prep_time * 0.3, 5)::integer as estimated_minutes,
  'Follow recipe mixing instructions' as instructions
FROM recipes WHERE is_active = true AND prep_time IS NOT NULL;

-- Add baking step for recipes with cook time
INSERT INTO production_step_templates (recipe_id, step_order, name, estimated_minutes, instructions, temperature_f)
SELECT 
  id as recipe_id,
  4 as step_order,
  'Bake/Cook' as name,
  cook_time as estimated_minutes,
  'Bake according to recipe specifications' as instructions,
  350 as temperature_f
FROM recipes WHERE is_active = true AND cook_time IS NOT NULL AND cook_time > 0;

-- Add cooling/finishing step
INSERT INTO production_step_templates (recipe_id, step_order, name, estimated_minutes, instructions)
SELECT 
  id as recipe_id,
  CASE WHEN cook_time IS NOT NULL AND cook_time > 0 THEN 5 ELSE 4 END as step_order,
  'Cool and finish' as name,
  15 as estimated_minutes,
  'Cool completely and apply final touches' as instructions
FROM recipes WHERE is_active = true;
```

### 3. Production System Tables

```sql
-- Migration: 20250906_create_production_system

-- Production Run Status Enum
CREATE TYPE production_run_status AS ENUM (
  'IN_PROGRESS',
  'PAUSED', 
  'COMPLETED',
  'CANCELLED'
);

-- Production Step Status Enum  
CREATE TYPE production_step_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED'
);

-- Main Production Runs Table
CREATE TABLE production_runs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  recipe_id VARCHAR NOT NULL,
  target_quantity INTEGER NOT NULL,
  target_unit VARCHAR(50) NOT NULL,
  status production_run_status DEFAULT 'IN_PROGRESS',
  current_step_index INTEGER DEFAULT 0,
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  estimated_finish_at TIMESTAMP,
  actual_cost DECIMAL(10,2),
  final_quantity INTEGER,
  notes TEXT,
  created_by VARCHAR, -- Optional user tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_production_runs_recipe 
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  CONSTRAINT check_target_quantity_positive 
    CHECK (target_quantity > 0),
  CONSTRAINT check_final_quantity_positive 
    CHECK (final_quantity IS NULL OR final_quantity >= 0),
  CONSTRAINT check_current_step_index_non_negative 
    CHECK (current_step_index >= 0)
);

-- Production Steps Table (instances for each production run)
CREATE TABLE production_steps (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  production_run_id VARCHAR NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_minutes INTEGER,
  step_order INTEGER NOT NULL,
  status production_step_status DEFAULT 'PENDING',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_minutes INTEGER,
  notes TEXT,
  temperature_f INTEGER,
  equipment_used TEXT[],
  quality_check_passed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_production_steps_run 
    FOREIGN KEY (production_run_id) REFERENCES production_runs(id) ON DELETE CASCADE,
  CONSTRAINT check_step_order_positive 
    CHECK (step_order > 0),
  CONSTRAINT check_estimated_minutes_positive 
    CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
  CONSTRAINT check_actual_minutes_positive 
    CHECK (actual_minutes IS NULL OR actual_minutes > 0)
);

-- Production Allocations Table (inventory reservations)
CREATE TABLE production_allocations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  production_run_id VARCHAR NOT NULL,
  material_type VARCHAR(50) NOT NULL, -- 'raw_material' or 'intermediate_product'
  material_id VARCHAR NOT NULL,
  material_name VARCHAR(255) NOT NULL, -- Store name for history
  quantity_allocated DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  allocated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_production_allocations_run 
    FOREIGN KEY (production_run_id) REFERENCES production_runs(id) ON DELETE CASCADE,
  CONSTRAINT check_material_type 
    CHECK (material_type IN ('raw_material', 'intermediate_product')),
  CONSTRAINT check_quantity_positive 
    CHECK (quantity_allocated > 0)
);

-- Indexes for Performance
CREATE INDEX idx_production_runs_status ON production_runs(status);
CREATE INDEX idx_production_runs_started_at ON production_runs(started_at DESC);
CREATE INDEX idx_production_runs_recipe ON production_runs(recipe_id);
CREATE INDEX idx_production_runs_batch_number ON production_runs(batch_number);

CREATE INDEX idx_production_steps_run_order ON production_steps(production_run_id, step_order);
CREATE INDEX idx_production_steps_status ON production_steps(status);

CREATE INDEX idx_production_allocations_run ON production_allocations(production_run_id);
CREATE INDEX idx_production_allocations_material ON production_allocations(material_type, material_id);

-- Unique constraint for step order per production run
CREATE UNIQUE INDEX idx_production_steps_unique_order 
  ON production_steps(production_run_id, step_order);
```

### 4. Update Existing Tables

#### Add Recipe Relationship to Production

```sql
-- Add foreign key relationship to recipes table for production runs
ALTER TABLE recipes ADD COLUMN production_runs_count INTEGER DEFAULT 0;

-- Create function to update production count
CREATE OR REPLACE FUNCTION update_recipe_production_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes 
    SET production_runs_count = production_runs_count + 1,
        last_made_date = NEW.started_at,
        updated_at = NOW()
    WHERE id = NEW.recipe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes 
    SET production_runs_count = production_runs_count - 1,
        updated_at = NOW()
    WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain production count
CREATE TRIGGER trigger_update_recipe_production_count
  AFTER INSERT OR DELETE ON production_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_production_count();
```

## 🔄 Migration Execution Order

### Step 1: Recipe Enhancements

```bash
npx prisma migrate dev --name add_recipe_production_fields
```

### Step 2: Production Step Templates

```bash
npx prisma migrate dev --name create_production_step_templates
```

### Step 3: Production System Core

```bash
npx prisma migrate dev --name create_production_system
```

### Step 4: Data Population

```bash
# Run seed scripts to populate default data
npx prisma db seed
```

## 🧪 Migration Testing

### Pre-Migration Validation

```sql
-- Verify current recipe structure
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM recipe_ingredients;

-- Check for any data inconsistencies
SELECT id, name FROM recipes WHERE yield_quantity <= 0;
```

### Post-Migration Validation

```sql
-- Verify new fields exist and have defaults
SELECT COUNT(*) FROM recipes WHERE difficulty IS NOT NULL;
SELECT COUNT(*) FROM recipes WHERE emoji IS NOT NULL;

-- Verify production step templates created
SELECT recipe_id, COUNT(*) as step_count 
FROM production_step_templates 
GROUP BY recipe_id 
ORDER BY step_count;

-- Test production run creation
INSERT INTO production_runs (name, recipe_id, target_quantity, target_unit, batch_number)
SELECT 
  'Test ' || name,
  id,
  yield_quantity,
  yield_unit,
  'TEST-' || EXTRACT(epoch FROM NOW())::text
FROM recipes 
WHERE is_active = true 
LIMIT 1;
```

## 🔒 Data Integrity

### Constraints Added

- Foreign key relationships maintain referential integrity
- Check constraints ensure positive quantities and valid ranges
- Unique constraints prevent duplicate step orders
- Enum types ensure valid status values

### Backup Strategy

```sql
-- Create backup before migration
pg_dump bakery_inventory > backup_pre_production_$(date +%Y%m%d).sql
```

### Rollback Plan

```sql
-- Emergency rollback scripts (if needed)
DROP TABLE IF EXISTS production_allocations CASCADE;
DROP TABLE IF EXISTS production_steps CASCADE;  
DROP TABLE IF EXISTS production_runs CASCADE;
DROP TABLE IF EXISTS production_step_templates CASCADE;
DROP TYPE IF EXISTS production_run_status CASCADE;
DROP TYPE IF EXISTS production_step_status CASCADE;

-- Remove added columns from recipes (if needed)
-- ALTER TABLE recipes DROP COLUMN IF EXISTS emoji;
-- ... (other added columns)
```

## 📊 Performance Considerations

### Expected Data Volume

- **Recipes:** ~100-500 recipes
- **Production Runs:** ~50-200 per day
- **Production Steps:** ~5-10 per production run
- **Production Allocations:** ~3-15 per production run

### Query Optimization

- Indexes on frequently queried fields (status, dates, recipe_id)
- Composite indexes for common query patterns
- Partial indexes for active productions

### Monitoring Queries

```sql
-- Check production performance
SELECT 
  recipe_id,
  COUNT(*) as total_runs,
  AVG(actual_cost) as avg_cost,
  AVG(EXTRACT(epoch FROM (completed_at - started_at))/60) as avg_duration_minutes
FROM production_runs 
WHERE status = 'COMPLETED'
GROUP BY recipe_id;

-- Find slow-running productions
SELECT id, name, started_at, 
  EXTRACT(epoch FROM (NOW() - started_at))/60 as minutes_running
FROM production_runs 
WHERE status = 'IN_PROGRESS' 
  AND started_at < NOW() - INTERVAL '4 hours';
```

## ✅ Migration Checklist

### Pre-Migration

- [ ] Database backup created
- [ ] Migration scripts reviewed and tested on staging
- [ ] All team members notified of planned downtime
- [ ] Rollback plan prepared and tested

### During Migration

- [ ] Execute migrations in correct order
- [ ] Verify each step completes successfully
- [ ] Run validation queries after each major step
- [ ] Monitor for any errors or warnings

### Post-Migration

- [ ] Run full validation test suite
- [ ] Test production workflow end-to-end
- [ ] Verify API endpoints work with new schema
- [ ] Update API documentation
- [ ] Inform team that migration is complete

---

This migration specification ensures a smooth transition to the production-enabled system while maintaining data integrity and backwards compatibility.
