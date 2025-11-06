# Update Admin Email Address

This guide will help you update the admin email from `infomypartsrunner@gmail.com` to `toma@mypartsrunner.com`.

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to Authentication > Users

2. **Find the Admin User**
   - Search for `infomypartsrunner@gmail.com`
   - Click on the user

3. **Update Email**
   - Click "Edit User"
   - Change email to `toma@mypartsrunner.com`
   - Click "Save"

4. **Update Profile Table**
   - Go to Table Editor > profiles
   - Find the row with email `infomypartsrunner@gmail.com`
   - Update email to `toma@mypartsrunner.com`

## Method 2: Using SQL Scripts

### Step 1: Update Profiles Table

Run the SQL script in Supabase SQL Editor:

```sql
-- Update the profiles table
UPDATE profiles 
SET email = 'toma@mypartsrunner.com',
    updated_at = NOW()
WHERE email = 'infomypartsrunner@gmail.com';
```

### Step 2: Update Auth Email

You need to update the auth.users table. This can be done via:

**Option A: Supabase Dashboard**
- Go to Authentication > Users
- Find and edit the user
- Change email to `toma@mypartsrunner.com`

**Option B: Supabase Admin API**
- Use the Supabase Admin API with service role key
- Call `admin.updateUserById()` with new email

**Option C: Netlify Function**
- Use the provided `netlify/functions/update-admin-email.js` function
- Make a POST request to `/.netlify/functions/update-admin-email` with:
  ```json
  {
    "oldEmail": "infomypartsrunner@gmail.com",
    "newEmail": "toma@mypartsrunner.com"
  }
  ```

## Method 3: Using the Netlify Function

If you have the Netlify function deployed, you can call it:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/update-admin-email \
  -H "Content-Type: application/json" \
  -d '{
    "oldEmail": "infomypartsrunner@gmail.com",
    "newEmail": "toma@mypartsrunner.com"
  }'
```

## Verification

After updating, verify the changes:

```sql
-- Check profiles table
SELECT id, email, full_name, user_type 
FROM profiles 
WHERE email = 'toma@mypartsrunner.com';

-- Check auth.users (requires admin access)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'toma@mypartsrunner.com';
```

## Password

The password remains `Custom.247` - no changes needed unless you want to update it.

## Important Notes

- The email change in `auth.users` requires admin privileges
- Make sure to update both `auth.users` and `profiles` tables
- After updating, the user will need to log in with the new email
- Any email verification status may need to be reset

