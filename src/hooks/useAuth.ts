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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
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
        // Create a basic profile if none exists
        await createProfile(userId);
      } else if (data) {
        setProfile(data);
      } else {
        // Create a basic profile if no data returned
        await createProfile(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Create a basic profile on error
      await createProfile(userId);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || '';
      
      // Check if user signed up as driver by looking at auth metadata
      const userType = userData.user?.user_metadata?.user_type || 'customer';
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          full_name: userData.user?.user_metadata?.full_name || '',
          phone: userData.user?.user_metadata?.phone || '',
          user_type: userType
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        // Set a basic profile even if creation fails
        setProfile({
          id: userId,
          email: userEmail,
          full_name: userData.user?.user_metadata?.full_name || '',
          phone: userData.user?.user_metadata?.phone || '',
          user_type: userType
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      // Set a basic profile on error
      setProfile({
        id: userId,
        email: '',
        full_name: '',
        phone: '',
        user_type: 'customer'
      });
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
    isAuthenticated: !!user,
  };
};