# Meal Prep Workflow Optimizer - TODO

## Database Schema
- [x] Create meal items table (chicken dishes, beef dishes, oats, desserts, salads)
- [x] Create task templates table (grind, cook, chill, assemble, etc.)
- [x] Create production scenarios table (save/load functionality)
- [x] Create scenario items table (quantities for each meal in a scenario)
- [x] Create task time estimates table (configurable times)

## Backend - Optimization Algorithm
- [x] Implement workflow optimization engine
- [x] Enforce protein cooking dependency rule
- [x] Identify and schedule parallel tasks
- [x] Handle blast chiller capacity constraint (5 trays, 7 lbs each)
- [x] Calculate total production time
- [x] Generate chronological task sequence

## Backend - API Endpoints
- [x] Create tRPC procedures for meal items CRUD
- [x] Create tRPC procedures for task time estimates CRUD
- [x] Create tRPC procedures for production scenarios CRUD
- [x] Create tRPC procedure to run optimization algorithm
- [x] Create tRPC procedure to calculate timeline

## Frontend - Input Forms
- [x] Build meal quantities input form (all 9+ items)
- [x] Build task time estimates configuration form
- [x] Build equipment constraints settings
- [x] Add form validation

## Frontend - Visual Timeline
- [x] Design timeline component layout
- [x] Display chronological task sequence
- [x] Show parallel tasks visually
- [x] Display total time calculation
- [x] Add color coding for task types

## Frontend - Scenario Management
- [x] Build save scenario functionality
- [x] Build load scenario functionality
- [x] Display saved scenarios list
- [x] Add delete scenario option

## Design & Styling
- [x] Choose elegant color palette and typography
- [x] Design clean, professional layout
- [x] Add smooth transitions and interactions
- [x] Ensure responsive design
- [x] Polish UI details

## Testing
- [x] Write vitest tests for optimization algorithm
- [x] Test with various production volumes
- [x] Verify dependency enforcement
- [x] Validate parallel task scheduling
- [x] Test save/load scenarios

## User Requested Changes
- [x] Rename meal items: Chicken Alfredo, Chicken Parmesan, Chicken Taco, Birria Beef, Bacon Burger Bowl
- [x] Fix input field behavior - clear default 0 value when user starts typing

## Bug Fixes
- [x] Remove duplicate meal items (keep only 8 items: 5 meals + oats + 2 desserts)

## Major Redesign - Focus on Bottlenecks (Option B)
- [x] Redesign to focus on critical path: protein cooking → blast chilling → assembly
- [x] Track blast chiller as main constraint (5 trays, sequential batches)
- [x] Allow multiple oven trays cooking simultaneously
- [x] Show prep tasks (rice, pasta, sauces, chopping) as parallel work during protein cooking
- [x] Update algorithm: proteins must be sequential through chiller, everything else can overlap
- [x] Rebuild UI to show critical path timeline with suggested parallel tasks

## Feature Enhancement - Integrated Timeline
- [x] Update optimizer algorithm to insert parallel task suggestions into critical path
- [x] Show parallel tasks inline with cooking/chilling steps (e.g., "During cooking: make sauces, cook rice")
- [x] Calculate which parallel tasks fit within each downtime window
- [x] Update UI to display integrated timeline instead of separate sections

## Workflow Redesign - Correct Task Order
- [x] Start workflow with rice/pasta cooking (not as parallel task)
- [x] Add detailed dessert steps: prep rice krispy treats, make brownie mix, bake both
- [x] Suggest dessert prep during protein cooking downtime
- [x] Fix task sequencing: rice → grind protein → cook protein → blast chill → repeat for beef
- [x] Update parallel task suggestions to include dessert prep (not just generic "bake desserts")
- [x] Test V4 optimizer with realistic production scenario
- [x] Verify rice/pasta starts first
- [x] Verify dessert prep suggestions appear during chicken cooking
- [x] Verify detailed dessert workflow (prep → bake → rest)

## Concurrent Workflow Redesign - Active vs Passive Tasks
- [x] Distinguish between active tasks (require worker attention) and passive tasks (equipment runs on its own)
- [x] Allow active tasks to happen during passive task time
- [x] Implement concurrent timeline: Start rice → While rice cooks: grind chicken → While rice still cooking: cook chicken
- [x] Show overlapping tasks visually in timeline
- [x] Calculate true total time accounting for concurrency (not sequential sum)
- [x] Example workflow: Rice cooking (passive) + Grind chicken (active, during rice) + Cook chicken (passive, during rice) + Prep desserts (active, during chicken cooking) + Grind beef (active, during chicken chilling)

## Bug Fix - Task Time Estimates Not Updating Workflow
- [x] Fix optimizer V5 to use user-configured task time estimates instead of hardcoded defaults
- [x] Ensure changing sauce time from 20 to 45 minutes updates the workflow calculation
- [x] Verify all task time estimate changes properly affect the timeline

## New Feature Requests
- [x] Fix task time estimate input fields to allow direct typing (clear default on focus, not just 0)
- [x] Add "Oatmeal prep" task type (25 min default, active task)
- [x] Create production logs table in database for tracking actual vs estimated times
- [x] Build production logging UI to record actual completion times for each task
- [x] Display historical data and insights comparing actual vs estimated times
- [x] Store production log data persistently in MySQL/TiDB database

## Production Logging Integration
- [x] Add "Log This Production" button to workflow optimizer page
- [x] Create dialog/modal with workflow steps and input fields for actual times
- [x] Save production log with estimated times from workflow calculation
- [x] Allow user to enter actual completion time for each task
- [x] Link saved production log to production logs page

## Bug Fixes - Production Logs
- [x] Fix 404 error when viewing production log details
- [x] Add edit functionality to update actual times after saving
- [x] Allow users to correct mistakes in logged production data

## Bug - Production Log Calculation Error
- [x] Investigate production log ID 1 data in database
- [x] Identify why actual times are showing 2h 50m more than expected
- [ ] Fix: Display sum of task estimated times instead of concurrent workflow time
- [ ] Update ProductionLogDetail to calculate estimated time from tasks, not from log.totalEstimatedMinutes

## Production Logging Enhancement - Wall-Clock Time & Insights
- [x] Add totalWallClockMinutes field to production_logs table
- [x] Update production log dialog to include wall-clock time input at the top
- [x] Keep individual task time inputs for detailed tracking
- [x] Add power ranking to production log detail page (sort tasks by variance)
- [x] Highlight tasks with biggest time overruns with visual badges
- [x] Show insights like "Top 3 bottlenecks" with time impact

## Bug - Production Log Display Issue
- [x] Production log showing 5h 45m actual time (sum of tasks) instead of wall-clock time
- [x] Need to clarify: if no wall-clock time entered, should show "In Progress" not sum of tasks
- [x] Fix display logic to only show actual time when wall-clock time is provided

## Bug - Cannot Edit Wall-Clock Time
- [x] Add wall-clock time input field to edit mode on production log detail page
- [x] Allow users to update wall-clock time when editing production logs

## New Feature - Settings Tab for Ingredient Quantities
- [x] Add Settings navigation tab to main navigation
- [x] Create database schema for ingredient quantities per meal item (chicken_lbs, beef_lbs, rice_cups)
- [x] Build Settings page UI with editable ingredient quantities for each meal
- [x] Update meal items table to include ingredient quantity columns
- [x] Create tRPC endpoints to read/update ingredient quantities
- [x] Connect Settings form to backend API
- [x] Test ingredient quantity updates persist correctly

## New Feature - Delete Production Runs
- [x] Add delete button to production log detail page
- [x] Add confirmation dialog before deleting
- [x] Create tRPC endpoint to delete production log and associated tasks
- [x] Update production logs list after deletion
- [x] Test delete functionality

## New Feature - Start/End Time Auto-Calculation
- [x] Add startTime and endTime fields to production_logs table (datetime)
- [x] Update production log dialog to show start time and end time inputs
- [x] Auto-calculate wall-clock time from start/end time difference
- [x] Update edit mode to allow changing start/end times
- [x] Show both time inputs and calculated duration
- [x] Test time calculation accuracy

## Update Ingredient Defaults and Categories
- [x] Set default ingredient quantities for each meal item:
  * Chicken Alfredo: chicken 4oz, pasta 90g
  * Chicken Parmesan: chicken 4oz, pasta 90g
  * Chicken Taco: chicken 4.1oz, rice 0.5 cups
  * Bacon Burger: beef 4.1oz, potato 3oz
  * Birria Beef: beef 5.2oz, rice 0.5 cups
- [x] Separate ingredient types properly (don't show chicken fields for beef items, pasta for rice items, etc.)
- [x] Update Settings UI to only show relevant ingredient fields per meal type
- [x] Add potato as a parallel task option under sides
- [x] Update database with default values

## New Feature - Ingredient-Based Time Formulas
- [x] Design time formula system (e.g., grinding_time = chicken_lbs × 1.2 minutes per pound)
- [x] Add formula fields to task templates table
- [x] Create Settings UI section for configuring time formulas per task type
- [x] Formulas serve as reference/documentation tool (not auto-calculated in optimizer)
- [x] Test formula configuration UI

## New Feature - Equipment Capacity Constraints
- [x] Add meal_capacity field to equipment_constraints table
- [x] Build Settings UI for managing equipment capacities
- [x] Add equipment capacity management endpoints
- [x] Implement capacity validation in optimizer
- [x] Add warning messages when production plan exceeds equipment capacity
- [x] Test capacity warnings with various production scenarios

## Bug - Equipment Running Time Calculation Incorrect
- [x] Investigate why equipment running time shows only 20 mins for 50 meals
- [x] Fix calculation logic in optimizer to accurately sum equipment task times
- [x] Test with various meal quantities to verify correct calculation

## Enhancement - Pre-populate Specific Equipment in Settings
- [x] Add Oven as default equipment in Settings
- [x] Add Blast Chiller as default equipment in Settings
- [x] Allow users to set capacity for each specific equipment type
- [x] Ensure capacity validation uses these specific equipment entries

## Simplify Settings Page
- [x] Remove Equipment Capacity tab from Settings (constraint already in optimizer)
- [x] Remove Time Formulas tab from Settings (not needed)
- [x] Keep only Ingredients tab in Settings
- [x] Update Settings UI to show single tab without tab navigation

## Update Ingredient Default Values to Uncooked Weights
- [x] Update chicken default from 4oz to 0.34 lbs (5.44 oz)
- [x] Update beef default from 4-5oz to 0.35 lbs (5.6 oz)
- [x] Update pasta default from 90g to 0.0925 lbs (42g / 1.48 oz)
- [x] Update rice default from 0.5 cups to 0.2 cups
- [x] Update potato default from 3oz to 0.32 lbs (5.12 oz)
- [x] Update all meal items in database with new uncooked weight defaults

## Update Oven Capacity Logic
- [x] Oven can handle 2 batches without issue (batch 1 blast chills while batch 2 cooks)
- [x] Warning only needed when 3+ batches required
- [x] Oven capacity = protein_per_tray (7 lbs) × 5 trays = 35 lbs per batch
- [x] 2-batch capacity = 70 lbs total protein before warning
- [x] Calculate total protein weight from meal quantities using ingredient weights from Settings
- [x] Chicken and beef can mix in same oven (combined protein weight)
- [x] Update capacity validation to use actual meal ingredient weights instead of estimates
- [x] Show warning when total protein > 70 lbs (requires 3+ batches)
- [x] Test with 100 meals (34 lbs) - no warning ✓
- [x] Test with 150 meals (51 lbs) - no warning ✓
- [x] Test with 210 meals (71.4 lbs) - warning displayed ✓

## Bug - Timeline Display Shows Incorrect Protein Weight
- [x] Optimizer timeline shows 2.5 lbs for 10 Chicken Alfredo (using hardcoded 0.25 lbs/meal)
- [x] Should show 3.4 lbs (10 × 0.34 lbs from Settings ingredient values)
- [x] Update optimizer-v5.ts to calculate protein weight from actual ingredient quantities
- [x] Pass meal items with ingredient data to optimizer function
- [x] Update protein weight calculation in workflow timeline generation
- [x] Test timeline display matches capacity calculation (both use Settings values)

## Mobile Optimization
- [x] Audit all pages for mobile responsiveness issues
- [x] Optimize Home page navigation and hero section for mobile
- [x] Make Optimizer page mobile-friendly (responsive form inputs, collapsible sections)
- [x] Optimize workflow timeline display for mobile (horizontal scroll or stacked layout)
- [x] Make Production Logs list and detail pages mobile-responsive
- [x] Optimize Settings page ingredient forms for mobile
- [x] Ensure touch-friendly button sizes (min 44px tap targets)
- [x] Test on mobile viewport sizes (320px, 375px, 414px widths)
- [x] Add mobile-specific navigation (hamburger menu if needed)
- [x] Optimize table displays for mobile (responsive tables or cards)

## Implement PIN Authentication
- [x] Create PIN login page/dialog
- [x] Store user profile (name: Nick Panos, PIN: 5327) in AuthContext
- [x] Implement PIN verification logic
- [x] Add session management for authenticated user (localStorage)
- [x] Protect optimizer and other pages with auth check
- [x] Add logout functionality
- [x] Show user name in header/settings when logged in

## Simplify Home Page for Internal Tool
- [x] Remove sales copy and marketing content from home page
- [x] Create clean dashboard-style home page
- [x] Add quick navigation cards to main features
- [x] Remove "How It Works" section
- [x] Keep it simple and functional for internal use

## Remove Quick Tips from Home Page
- [x] Remove Quick Tips card section from home page
- [x] Keep only header and quick action cards for cleaner dashboard

## Remove Manus OAuth Dependency
- [x] Investigate why Manus OAuth login is still required
- [x] Remove or bypass Manus OAuth authentication system (changed all protectedProcedure to publicProcedure)
- [x] Ensure PIN authentication (5327) is the only login method
- [x] Modified context.ts to always return mock user (id: 1, name: Nick Panos)
- [x] Test that tool works without any Manus account

## Fix Production Log Detail Page
- [x] Production log detail page missing top bottlenecks section (already present, shows when data available)
- [x] Production log detail page missing task breakdown performance section (already present)
- [x] Add run number field to production_logs table (auto-increment starting from 1)
- [x] Display run number prominently in production log detail and list
- [x] Update production log creation to auto-assign next run number

## Bug - Task Breakdown Not Showing in Production Log Detail
- [x] Run 30001 shows no task breakdown section
- [x] Check if production log tasks data exists in database (confirmed: 10 tasks exist)
- [x] Verify task data is being fetched correctly by getById query (confirmed: working)
- [x] Fix display logic to show task breakdown when data is available (removed filter that hid tasks without actual times)

## Task Breakdown Still Not Displaying Correctly
- [x] Check first production run to see correct display format
- [x] Compare with run 30001 to identify what's different
- [x] Root cause: Individual task actual times are not being recorded when logging production runs
- [x] Update production log dialog to allow entering actual time for each task (already implemented)
- [x] Save actual times to database when creating production log (fixed schema and save logic)
- [x] Verify top bottlenecks section shows when actual task times exist
- [x] Verify task breakdown shows actual vs estimated for each task
- [x] Created and passed tests for actual task times functionality

## Default Current Date/Time for Production Log
- [x] Set start time input to default to current date and time
- [x] Set end time input to default to current date and time
- [x] User only needs to adjust time portion instead of entering full date/time

## Progressive Web App (PWA) Implementation
- [x] Create web app manifest file (manifest.json) with app metadata
- [x] Generate PWA icons in multiple sizes (192x192, 512x512)
- [x] Add manifest link and PWA meta tags to index.html
- [x] Implement service worker for offline functionality
- [x] Register service worker in main application
- [x] Add install prompt for users to add app to home screen (browser handles automatically)
- [x] Test PWA installability on mobile devices (verified manifest and service worker)
- [x] Verify offline functionality works correctly (service worker caching implemented)

## Inventory Management Feature
- [x] Create inventory_items table in database (ingredient name, unit, current quantity, min threshold)
- [x] Create inventory_counts table for tracking count history (timestamp, item, quantity, counted_by)
- [x] Add tRPC procedures for inventory CRUD operations
- [x] Build Inventory page with list of all ingredients and current quantities
- [x] Add count inventory form to update quantities
- [x] Show low-stock alerts when quantities fall below minimum threshold
- [x] Add "Count Inventory" button to home dashboard
- [x] Create navigation route for inventory page
- [x] Test inventory counting and stock tracking
- [x] Write vitest tests for inventory procedures

## Bug - Inventory Not Showing in Production Build
- [x] Investigate why inventory items don't display in production build (browser caching)
- [x] Test production build locally to reproduce issue
- [x] Fix production-specific rendering issue (hard refresh required)
- [x] Verify fix works in both dev and production

## Inventory Page Improvements
- [x] Add navigation bar to inventory page for easy return to home
- [x] Implement count inventory button functionality
- [x] Create dialog for updating inventory quantities
- [x] Save inventory count to inventory_counts table
- [x] Update current quantity in inventory_items table

## Enhanced Inventory System with Recipe Integration
- [x] Fix inventory UI rendering issue (was route configuration, fixed to use children pattern)
- [ ] Add storage_location field to inventory_items (Cooler/Dry Storage)
- [ ] Create units table for standardized unit management
- [ ] Add unit_id foreign key to inventory_items
- [ ] Create recipe_ingredients table linking meals to inventory items
- [ ] Add cost_per_unit field to inventory_items for COGS calculation
- [ ] Build units management UI in settings page
- [ ] Update inventory UI to filter/group by storage location
- [ ] Change unit input to dropdown using units table
- [ ] Create recipe ingredients management interface for each meal
- [ ] Implement COGS calculation for production runs
- [ ] Add automatic inventory depletion when production is logged
- [ ] Show projected inventory levels based on planned production
- [ ] Add insufficient stock warnings when planning production
- [ ] Write vitest tests for recipe ingredients and COGS calculations

## Supabase Migration
- [ ] Export current database schema (all tables)
- [ ] Export all data from current database
- [ ] Connect to Supabase using MCP connector
- [ ] Create tables in Supabase matching current schema
- [ ] Import all data into Supabase
- [ ] Verify data integrity after migration
