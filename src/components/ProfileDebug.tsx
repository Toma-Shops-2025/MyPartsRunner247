import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const ProfileDebug: React.FC = () => {
  const { user, profile, loading } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-50 text-xs">
      <h3 className="font-bold mb-2">Profile Debug</h3>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? 'Yes' : 'No'}</div>
      <div>Profile: {profile ? 'Yes' : 'No'}</div>
      <div>User Type: {profile?.user_type || 'None'}</div>
      <div>Email: {user?.email || 'None'}</div>
    </div>
  );
};

export default ProfileDebug;
