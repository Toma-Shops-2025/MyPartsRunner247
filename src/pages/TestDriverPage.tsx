import React from 'react';
import { useAuth } from '@/hooks/useAuth';

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
      </div>
    </div>
  );
};

export default TestDriverPage;
