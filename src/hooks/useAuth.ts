import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  user_type: 'customer' | 'driver' | 'merchant' | 'admin';
  avatar_url?: string;
  is_online?: boolean;
  is_approved?: boolean;
  status?: string;
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
        if (!mounted || isProcessing) return;
        isProcessing = true;
        
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          // Only fetch profile if it's a new user or we don't have a profile yet
          if (lastProcessedUserId !== session.user.id || !profile) {
            await fetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } else {
          setProfile(null);
          setLoading(false);
        }
        
        setTimeout(() => { isProcessing = false; }, 500); // Increased delay
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    // Clear any existing timeout
    if (profileFetchTimeout) {
      clearTimeout(profileFetchTimeout);
    }
    
    // Prevent duplicate fetches for the same user
    if (lastProcessedUserId === userId) {
      console.log('Skipping duplicate profile fetch for user:', userId);
      return;
    }
    
    setLastProcessedUserId(userId);
    
    // Debounce profile fetches to prevent rapid-fire requests
    const timeout = setTimeout(async () => {
      await performProfileFetch(userId);
    }, 200);
    
    setProfileFetchTimeout(timeout);
  };

  const performProfileFetch = async (userId: string) => {
    // Set a timeout to prevent infinite loading
    const profileTimeout = setTimeout(() => {
      console.log('Profile fetch timeout - creating fallback driver profile');
      // Create a fallback driver profile when database is slow/unavailable
      const fallbackProfile = {
        id: userId,
        email: 'soberdrivertaxi@gmail.com',
        full_name: 'soberdrivertaxi',
        phone: '',
        user_type: 'driver' as const,
        is_online: true,
        is_approved: true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('Using fallback driver profile:', fallbackProfile);
      setProfile(fallbackProfile);
      setLoading(false);
    }, 5000); // 5 second timeout
    
    // Check for mock profile first
    const mockProfile = localStorage.getItem('mock_profile');
    if (mockProfile) {
      try {
        const parsedProfile = JSON.parse(mockProfile);
        if (parsedProfile.id === userId) {
          console.log('Using mock profile:', parsedProfile);
          clearTimeout(profileTimeout);
          setProfile(parsedProfile);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing mock profile:', error);
      }
    }
    
    try {
      console.log('Fetching profile for user:', userId);
      
      // Create a timeout promise for the database query
      const queryTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000) // Increased to 8 seconds
      );
      
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([queryPromise, queryTimeout]) as any;

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        clearTimeout(profileTimeout);
        
        // Handle 406 error specifically - database access issue
        if (error.code === 'PGRST204' || error.message?.includes('406')) {
          console.log('Database access issue detected, creating fallback profile');
          const fallbackProfile = {
            id: userId,
            email: user?.email || 'unknown@example.com',
            full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'User',
            phone: user?.user_metadata?.phone || '',
            user_type: (user?.email?.includes('driver') || user?.email?.includes('taxi')) ? 'driver' as const : 'customer' as const,
            is_online: false,
            is_approved: false,
            status: 'inactive',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          setLoading(false);
          return;
        }
        
        // Don't auto-create profile, just set loading to false
        setProfile(null);
        setLoading(false);
      } else if (data) {
        console.log('Profile found:', data);
        clearTimeout(profileTimeout);
        setProfile(data);
        setLoading(false);
      } else {
        console.log('No profile found for user:', userId);
        // Auto-create profile for existing users
        try {
          console.log('Auto-creating profile for user:', userId);
          const profileData = await createProfileManually();
          clearTimeout(profileTimeout);
          setProfile(profileData);
          setLoading(false);
        } catch (createError) {
          console.error('Failed to auto-create profile:', createError);
          clearTimeout(profileTimeout);
          setProfile(null);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      clearTimeout(profileTimeout);
      
      // Create a fallback profile based on the user ID and email
      const fallbackProfile = {
        id: userId,
        email: user?.email || 'unknown@example.com',
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'User',
        phone: user?.user_metadata?.phone || '',
        user_type: (user?.email?.includes('driver') || user?.email?.includes('taxi')) ? 'driver' as const : 'customer' as const,
        is_online: false,
        is_approved: false,
        status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Using fallback profile due to error:', fallbackProfile);
      setProfile(fallbackProfile);
      setLoading(false);
    }
  };


  const updateUserType = async (newUserType: 'customer' | 'driver' | 'merchant') => {
    if (!user) return;
    
    try {
      // Start with basic user_type update only
      const updateData: any = { user_type: newUserType };
      
      console.log('Updating user type to:', newUserType, 'for user:', user.id);
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating user type:', error);
        throw error;
      }
      
      console.log('User type updated successfully to:', newUserType);
      
      // Try to update additional fields if they exist
      try {
        const additionalData: any = {};
        
        if (newUserType === 'driver') {
          additionalData.status = 'active';
          additionalData.is_online = true;
          additionalData.is_approved = true;
        } else {
          additionalData.status = 'inactive';
          additionalData.is_online = false;
          additionalData.is_approved = false;
        }
        
        const { error: additionalError } = await supabase
          .from('profiles')
          .update(additionalData)
          .eq('id', user.id);
        
        if (additionalError) {
          console.warn('Could not update additional fields:', additionalError);
          // Don't throw - the main user_type update succeeded
        }
      } catch (additionalError) {
        console.warn('Additional fields update failed:', additionalError);
        // Don't throw - the main user_type update succeeded
      }
      
      // Refresh profile data
      await fetchProfile(user.id);
      console.log('Profile refreshed after user type update');
      
    } catch (error) {
      console.error('Error updating user type:', error);
      throw error;
    }
  };

  const createProfileManually = async () => {
    if (!user) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || '';
      
      // Determine user type based on email or metadata
      let userType = 'customer';
      if (userEmail.includes('driver') || userEmail.includes('taxi')) {
        userType = 'driver';
      } else {
        userType = userData.user?.user_metadata?.user_type || 
                  userData.user?.user_metadata?.role || 
                  'customer';
      }
      
      console.log('Creating profile with user type:', userType, 'for email:', userEmail);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: userEmail,
          full_name: userData.user?.user_metadata?.full_name || userData.user?.user_metadata?.name || '',
          phone: userData.user?.user_metadata?.phone || '',
          user_type: userType,
          status: userType === 'driver' ? 'active' : 'inactive',
          is_online: userType === 'driver' ? true : false,
          is_approved: userType === 'driver' ? true : false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw new Error(error.message || 'Failed to create profile');
      } else {
        console.log('Profile created successfully:', data);
        setProfile(data);
        return data;
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      throw new Error(error.message || 'Failed to create profile');
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear local state immediately to prevent loops
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      setLastProcessedUserId(null);
      
      // Clear any stored auth data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('mock_profile');
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('sw-updated');
      
      // Try Supabase sign out with shorter timeout
      try {
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign out timeout')), 2000)
        );
        
        await Promise.race([signOutPromise, timeoutPromise]);
        console.log('Supabase signOut successful');
      } catch (supabaseError) {
        console.warn('Supabase signOut failed, but continuing with local logout:', supabaseError);
      }
      
      // Small delay to ensure state is cleared before redirect
      setTimeout(() => {
        console.log('Redirecting to home page...');
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout even if everything fails
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
      setLastProcessedUserId(null);
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  const forceLogout = () => {
    console.log('Force logout - bypassing Supabase entirely');
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    // Clear any stored auth data
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    window.location.href = '/';
  };

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    forceLogout,
    updateUserType,
    createProfileManually,
    isAuthenticated: !!user,
  };
};