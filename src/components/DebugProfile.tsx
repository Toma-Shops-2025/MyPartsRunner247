import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const DebugProfile: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-1 text-xs">Debug Info:</h3>
      <div className="space-y-1">
        <div>User ID: {user.id.slice(0, 8)}...</div>
        <div>Email: {user.email}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Profile: {profile ? 'Exists' : 'Missing'}</div>
        {profile && (
          <>
            <div>User Type: {profile.user_type}</div>
            <div>Full Name: {profile.full_name || 'Empty'}</div>
          </>
        )}
        <div className="text-xs">Role: {user.user_metadata?.role || 'none'}</div>
      </div>
    </div>
  );
};

export default DebugProfile;
