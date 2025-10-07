import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  user_type: 'customer' | 'driver' | 'merchant';
  avatar_url?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
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
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        // Don't auto-create profile, just set loading to false
        setProfile(null);
      } else if (data) {
        console.log('Profile found:', data);
        setProfile(data);
      } else {
        console.log('No profile found for user:', userId);
        // No profile found, don't auto-create
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        // Clear local state
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    updateUserType,
    createProfileManually,
    isAuthenticated: !!user,
  };
};