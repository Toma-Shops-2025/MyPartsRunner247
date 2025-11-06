// Netlify function to update admin email in Supabase Auth
// This requires SUPABASE_SERVICE_ROLE_KEY to update auth.users table

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { oldEmail, newEmail, password } = JSON.parse(event.body || '{}');

    if (!oldEmail || !newEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'oldEmail and newEmail are required' })
      };
    }

    console.log(`📧 Updating admin email from ${oldEmail} to ${newEmail}`);

    // Step 1: Find the user in auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to list users', details: listError.message })
      };
    }

    const user = authUsers.users.find(u => u.email === oldEmail);
    
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `User with email ${oldEmail} not found` })
      };
    }

    console.log(`✅ Found user: ${user.id}`);

    // Step 2: Update the email in auth.users
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email: newEmail }
    );

    if (updateError) {
      console.error('Error updating auth email:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update auth email', details: updateError.message })
      };
    }

    console.log(`✅ Auth email updated successfully`);

    // Step 3: Update password if provided
    if (password) {
      const { data: passwordData, error: passwordError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: password }
      );

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update password', details: passwordError.message })
        };
      }

      console.log(`✅ Password updated successfully`);
    }

    // Step 4: Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail if profile update fails - auth update is more important
      console.warn('⚠️ Profile update failed, but auth email was updated');
    } else {
      console.log(`✅ Profile email updated successfully`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Email updated from ${oldEmail} to ${newEmail}`,
        userId: user.id,
        newEmail: newEmail
      })
    };

  } catch (error) {
    console.error('Error in update-admin-email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

