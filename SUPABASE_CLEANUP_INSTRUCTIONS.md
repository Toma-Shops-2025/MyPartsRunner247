# 🗄️ SUPABASE DATABASE CLEANUP INSTRUCTIONS

## 🚨 CRITICAL: Run These SQL Commands in Supabase

### 1. **Run the Comprehensive Cleanup Script**
Execute the `COMPREHENSIVE_CLEANUP.sql` file in your Supabase SQL Editor:

```sql
-- This will:
-- ✅ Remove unused columns (is_online, date_of_birth, etc.)
-- ✅ Add essential columns (latitude, longitude, etc.)
-- ✅ Create optimized indexes
-- ✅ Fix RLS policies
-- ✅ Remove unused tables
```

### 2. **Verify Database Structure**

After running the cleanup, your `profiles` table should have:
- ✅ `id` (UUID, Primary Key)
- ✅ `email` (TEXT)
- ✅ `full_name` (TEXT)
- ✅ `phone` (TEXT)
- ✅ `user_type` (TEXT, DEFAULT 'customer')
- ✅ `status` (TEXT, DEFAULT 'inactive')
- ✅ `is_approved` (BOOLEAN, DEFAULT false)
- ✅ `vehicle_info` (JSONB)
- ✅ `latitude` (DECIMAL)
- ✅ `longitude` (DECIMAL)
- ✅ `last_location_update` (TIMESTAMP)

### 3. **Verify RLS Policies**

Your RLS policies should be:
- ✅ **Profiles**: Read/Insert/Update for authenticated users
- ✅ **Orders**: Read/Insert/Update for authenticated users
- ✅ **No 406 errors** when fetching profiles

### 4. **Test Database Connection**

After cleanup, test with:
```sql
-- Test profile creation
INSERT INTO profiles (id, email, full_name, user_type) 
VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'driver');

-- Test profile fetch
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Clean up test
DELETE FROM profiles WHERE email = 'test@example.com';
```

## 🎯 Expected Results

After running the cleanup:
- ✅ **No more 406 errors**
- ✅ **Profile fetch works correctly**
- ✅ **User type detection works**
- ✅ **Database is optimized**
- ✅ **No unused columns/tables**

## 🚀 Next Steps

1. **Run the SQL script** in Supabase
2. **Test profile creation** with a new user
3. **Verify no 406 errors** in browser console
4. **Test driver signup** to ensure it works

---

**⚠️ IMPORTANT**: Make sure to backup your database before running the cleanup script!
