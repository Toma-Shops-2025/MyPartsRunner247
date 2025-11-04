# How to Fix Driver Availability Sync Issue

## Problem
The `driver_availability` table is out of sync with `profiles.is_online`, causing drivers to appear in the `active_drivers` view even when they're logged out.

## Solution
Run the SQL script `fix_driver_availability_sync.sql` in Supabase to:
1. Fix existing mismatched data
2. Create automatic sync via database trigger

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to your Supabase Dashboard: https://supabase.com/dashboard
- Navigate to your project
- Click on **SQL Editor** in the left sidebar
- Click **New Query**

### 2. Copy and Paste the SQL Script
- Open the file `fix_driver_availability_sync.sql` from this repository
- Copy the entire contents
- Paste it into the SQL Editor

### 3. Run the Script
- Click the **Run** button (or press Ctrl+Enter / Cmd+Enter)
- Wait for it to complete (should take a few seconds)

### 4. Verify the Fix
- After running, scroll down to see the verification query results
- You should see all drivers with their sync status
- Look for "✅ Synced" status for all drivers

### 5. Check the Tables
- Go to **Table Editor** → `driver_availability`
- Verify that `is_online` values match `profiles.is_online`
- Go to **Table Editor** → `active_drivers` (view)
- Verify only online drivers appear

## What the Script Does

1. **Syncs existing data**: Updates all `driver_availability` records to match `profiles.is_online`
2. **Creates missing records**: Adds `driver_availability` entries for drivers who don't have one
3. **Creates automatic trigger**: Sets up a database trigger that automatically syncs `driver_availability.is_online` whenever `profiles.is_online` changes
4. **Shows verification**: Displays a report of all drivers and their sync status

## Result

After running this script:
- ✅ Current data will be fixed immediately
- ✅ Future changes will sync automatically
- ✅ Logged-out drivers will disappear from `active_drivers` view
- ✅ Logged-in drivers will appear in `active_drivers` view

## If You See Errors

If you encounter any errors:
1. Check that you're using the correct database role (should be `postgres` or service role)
2. Ensure you have the necessary permissions
3. The script uses `ON CONFLICT` so it's safe to run multiple times

## Testing

After running the script:
1. Log out as a driver
2. Check `active_drivers` view - driver should be gone
3. Log in as a driver and go online
4. Check `active_drivers` view - driver should appear
5. Both tables should stay in sync automatically

