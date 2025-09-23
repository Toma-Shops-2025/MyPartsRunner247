import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/');
          return;
        }

        if (data.session) {
          // User is authenticated, check their profile to determine redirect
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', data.session.user.id)
            .single();

          // Check if user signed up as driver from auth metadata
          // Handle both 'user_type' and 'role' fields from different signup methods
          const userType = data.session.user?.user_metadata?.user_type || 
                          data.session.user?.user_metadata?.role;
          
          if (profileError && !userType) {
            console.error('Profile fetch error:', profileError);
            // If we can't get profile and no metadata, redirect to home
            navigate('/');
            return;
          }

          // Redirect based on user type (from profile or metadata)
          const finalUserType = profile?.user_type || userType;
          if (finalUserType === 'driver') {
            navigate('/driver-dashboard');
          } else {
            navigate('/');
          }
        } else {
          // No session, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto mb-4"></div>
        <p className="text-white">Verifying your account and redirecting...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
