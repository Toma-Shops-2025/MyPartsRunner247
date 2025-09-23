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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      setLoading(false);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
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
        setProfile(data);
      } else {
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
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newUserType })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating user type:', error);
      } else {
        // Refresh profile data
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error updating user type:', error);
    }
  };

  const createProfileManually = async () => {
    if (!user) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || '';
      
      // Get user type from metadata
      const userType = userData.user?.user_metadata?.user_type || 
                      userData.user?.user_metadata?.role || 
                      'customer';
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: userEmail,
          full_name: userData.user?.user_metadata?.name || userData.user?.user_metadata?.firstName + ' ' + userData.user?.user_metadata?.lastName || '',
          phone: userData.user?.user_metadata?.phone || '',
          user_type: userType
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      } else {
        setProfile(data);
        return data;
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
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