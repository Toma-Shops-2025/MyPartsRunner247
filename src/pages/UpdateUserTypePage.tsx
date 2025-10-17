import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { updateCurrentUserToDriver } from '@/utils/updateUserType';
import { useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';

const UpdateUserTypePage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleUpdateToDriver = async () => {
    if (!user) {
      setMessage('Please sign in first');
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      await updateCurrentUserToDriver();
      setMessage('Successfully updated to driver! Refreshing page...');
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error updating user type:', error);
      setMessage('Error updating user type. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NewHeader />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
            <p className="text-gray-300">You need to be signed in to update your user type.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Update User Type</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Current Status:</h2>
            <div className="bg-gray-700 rounded p-4">
              <p className="text-gray-300"><strong>Email:</strong> {user.email}</p>
              <p className="text-gray-300"><strong>User Type:</strong> {profile?.user_type || 'Not set'}</p>
              <p className="text-gray-300"><strong>Full Name:</strong> {profile?.full_name || 'Not set'}</p>
            </div>
          </div>

          {profile?.user_type === 'driver' ? (
            <div className="bg-green-800 border border-green-600 rounded p-4 mb-6">
              <p className="text-green-200">✅ You are already set as a driver! You should see driver options in the menu.</p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                You are currently set as a <strong>customer</strong>. To access driver features, 
                you need to update your user type to <strong>driver</strong>.
              </p>
              
              <Button
                onClick={handleUpdateToDriver}
                disabled={isUpdating}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isUpdating ? 'Updating...' : 'Update to Driver'}
              </Button>
            </div>
          )}

          {message && (
            <div className={`rounded p-4 mb-4 ${
              message.includes('Successfully') 
                ? 'bg-green-800 border border-green-600 text-green-200' 
                : 'bg-red-800 border border-red-600 text-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateUserTypePage;
