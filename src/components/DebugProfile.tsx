import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const DebugProfile: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white text-sm z-50">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <div>User ID: {user.id}</div>
      <div>Email: {user.email}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Profile: {profile ? 'Exists' : 'Missing'}</div>
      {profile && (
        <>
          <div>User Type: {profile.user_type}</div>
          <div>Full Name: {profile.full_name || 'Empty'}</div>
        </>
      )}
      <div>User Metadata: {JSON.stringify(user.user_metadata, null, 2)}</div>
    </div>
  );
};

export default DebugProfile;
