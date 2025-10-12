import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const TestDriverPage: React.FC = () => {
  const { user, profile, loading } = useAuth();

  console.log('TestDriverPage - User:', !!user, 'Profile:', !!profile, 'Loading:', loading);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Test Driver Page</h1>
      <div className="space-y-4">
        <p><strong>User:</strong> {user ? 'Yes' : 'No'}</p>
        <p><strong>Profile:</strong> {profile ? 'Yes' : 'No'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User Email:</strong> {user?.email || 'None'}</p>
        <p><strong>User Type:</strong> {profile?.user_type || 'None'}</p>
        <p><strong>Profile ID:</strong> {profile?.id || 'None'}</p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">This is a test page to verify navigation works</h2>
        <p>If you can see this page, navigation is working!</p>
        
        {!profile && (
          <div className="mt-6 p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Profile Missing!</h3>
            <p className="text-yellow-200 mb-4">This user doesn't have a profile in the database. This is why the driver dashboard isn't working.</p>
            <button 
              onClick={() => {
                console.log('Button clicked! User:', user?.id, 'Email:', user?.email);
                alert('Button clicked! Check console for details.');
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded mr-2"
            >
              Test Click
            </button>
            <button 
              onClick={() => {
                console.log('Creating local profile for testing...');
                // Create a mock profile in localStorage for testing
                const mockProfile = {
                  id: user?.id,
                  full_name: user?.email?.split('@')[0] || 'Driver',
                  email: user?.email,
                  user_type: 'driver',
                  is_approved: true,
                  is_online: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
                console.log('Mock profile created:', mockProfile);
                alert('Mock profile created! This will allow you to test the driver dashboard. Refresh the page to see the changes.');
                window.location.reload();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mr-2"
            >
              Create Mock Profile
            </button>
            <button 
              onClick={async () => {
                console.log('Creating profile for user...', user?.id);
                alert('Starting profile creation...');
                
                try {
                  const profileData = {
                    id: user?.id,
                    full_name: user?.email?.split('@')[0] || 'Driver',
                    email: user?.email,
                    user_type: 'driver',
                    is_approved: true,
                    is_online: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  
                  console.log('Profile data to insert:', profileData);
                  
                  // Add timeout to prevent hanging
                  const insertPromise = supabase
                    .from('profiles')
                    .insert([profileData])
                    .select()
                    .single();
                  
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database timeout after 10 seconds')), 10000)
                  );
                  
                  console.log('Calling Supabase with timeout...');
                  const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

                  if (error) {
                    console.error('Error creating profile:', error);
                    alert('Error creating profile: ' + error.message);
                  } else {
                    console.log('Profile created successfully:', data);
                    alert('Profile created successfully! Please refresh the page.');
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error creating profile:', error);
                  alert('Error creating profile: ' + error);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Create Driver Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDriverPage;
