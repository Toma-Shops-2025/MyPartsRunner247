import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import autoPushNotificationService from '@/services/AutoPushNotificationService';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  user_type: 'customer' | 'driver' | 'merchant' | 'admin';
  avatar_url?: string;
  is_approved?: boolean;
  status?: string;
  is_online?: boolean;
  vehicle_info?: any;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastProcessedUserId, setLastProcessedUserId] = useState<string | null>(null);
  const [profileFetchTimeout, setProfileFetchTimeout] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Helper function to check if we're in development mode
  const isDevelopment = () => {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost';
  };

  useEffect(() => {
    let mounted = true;
    let isProcessing = false;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || isProcessing) return;
      isProcessing = true;
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
      
      setTimeout(() => { isProcessing = false; }, 100);
    });

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Only process meaningful state changes
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);
          setLoading(true);
          
          // Only fetch profile if we don't already have it for this user
          if (lastProcessedUserId !== session.user.id) {
            await fetchProfile(session.user.id);
            
            // Automatically enable push notifications on login (aggressive, multiple attempts)
            // Try immediately, then retry several times with delays
            setTimeout(async () => {
              try {
                await autoPushNotificationService.autoEnablePushNotifications(session.user.id);
              } catch (error) {
                console.error('Failed to auto-enable push notifications:', error);
              }
            }, 1000); // Try after 1 second
            
            // Also try again after 3 seconds (for slow service worker)
            setTimeout(async () => {
              try {
                await autoPushNotificationService.autoEnablePushNotifications(session.user.id);
              } catch (error) {
                console.error('Failed to auto-enable push notifications (retry):', error);
              }
            }, 3000);
            
            // And once more after 5 seconds (for mobile devices)
            setTimeout(async () => {
              try {
                await autoPushNotificationService.autoEnablePushNotifications(session.user.id);
              } catch (error) {
                console.error('Failed to auto-enable push notifications (final retry):', error);
              }
            }, 5000);
          } else {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setLastProcessedUserId(null);
          localStorage.removeItem('mock_profile');
          localStorage.removeItem('fallback_user');
          
          // Clear push notification tracking
          if (lastProcessedUserId) {
            autoPushNotificationService.clearUser(lastProcessedUserId);
          }
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          setSession(session);
          setUser(session.user);
          setLoading(true);
          
          // Only fetch profile if we don't already have it for this user
          if (lastProcessedUserId !== session.user.id) {
            await fetchProfile(session.user.id);
            
            // Automatically enable push notifications on initial session (aggressive, multiple attempts)
            setTimeout(async () => {
              try {
                await autoPushNotificationService.autoEnablePushNotifications(session.user.id);
              } catch (error) {
                console.error('Failed to auto-enable push notifications:', error);
              }
            }, 1000);
            
            setTimeout(async () => {
              try {
                await autoPushNotificationService.autoEnablePushNotifications(session.user.id);
              } catch (error) {
                console.error('Failed to auto-enable push notifications (retry):', error);
              }
            }, 3000);
            
            setTimeout(async () => {
              try {
                await autoPushNotificationService.autoEnablePushNotifications(session.user.id);
              } catch (error) {
                console.error('Failed to auto-enable push notifications (final retry):', error);
              }
            }, 5000);
          } else {
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setSession(session);
          setUser(session.user);
          // Don't fetch profile on token refresh unless we don't have one
          if (!profile || profile.id !== session.user.id) {
            await fetchProfile(session.user.id);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [lastProcessedUserId, profile]);

  const fetchProfile = async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Clear any existing timeout
    if (profileFetchTimeout) {
      clearTimeout(profileFetchTimeout);
    }

    // Debounce profile fetches to prevent excessive API calls
    const timeout = setTimeout(async () => {
      await performProfileFetch(userId);
    }, 1000); // 1 second debounce
    setProfileFetchTimeout(timeout);
  };

  const performProfileFetch = async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Skip if we already have the profile for this user
    if (profile && profile.id === userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        setLastProcessedUserId(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Create profile manually (for admin use)
  const createProfileManually = async (profileData: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('No user ID available');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating profile manually:', error);
        throw error;
      }

      // Refresh profile data
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Error in createProfileManually:', error);
      throw error;
    }
  };

  // Force logout (for admin use)
  const forceLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error in forceLogout:', error);
    }
  };

  // Update user type (for admin use)
  const updateUserType = async (newType: string) => {
    if (!user?.id) {
      throw new Error('No user ID available');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user type:', error);
        throw error;
      }

      // Refresh profile data
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Error in updateUserType:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    isSigningOut,
    createProfileManually,
    forceLogout,
    updateUserType
  };
};
