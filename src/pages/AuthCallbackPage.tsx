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
            .select('id, user_type, is_approved, status, email')
            .eq('id', data.session.user.id)
            .single();

          // Check if user signed up as driver from auth metadata
          // Handle both 'user_type' and 'role' fields from different signup methods
          const userType = data.session.user?.user_metadata?.user_type || 
                          data.session.user?.user_metadata?.role;
          
          console.log('🔍 AUTH CALLBACK DEBUG:', {
            userId: data.session.user.id,
            userEmail: data.session.user.email,
            userType,
            profile,
            profileError,
            userMetadata: data.session.user.user_metadata
          });
          
          // Additional debug: Check if profile exists and its approval status
          if (profile) {
            console.log('🔍 PROFILE DETAILS:', {
              id: profile.id,
              user_type: profile.user_type,
              is_approved: profile.is_approved,
              status: profile.status,
              email: profile.email
            });
          }
          
          if (profileError && !userType) {
            console.error('Profile fetch error:', profileError);
            // If we can't get profile and no metadata, redirect to home
            navigate('/');
            return;
          }

          // Redirect based on user type (from profile or metadata)
          const finalUserType = profile?.user_type || userType;
          console.log('🔍 FINAL ROUTING DECISION:', {
            finalUserType,
            isApproved: profile?.is_approved,
            willGoToDashboard: finalUserType === 'driver' && profile?.is_approved,
            willGoToApplication: finalUserType === 'driver' && !profile?.is_approved
          });
          
          if (finalUserType === 'driver') {
            // Check if driver is already approved
            if (profile?.is_approved) {
              console.log('🚗 Redirecting approved driver to dashboard');
              navigate('/driver-dashboard');
            } else {
              console.log('📝 Redirecting unapproved driver to application');
              navigate('/driver-application');
            }
          } else {
            console.log('🏠 Redirecting non-driver to home');
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
