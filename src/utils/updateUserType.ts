import { supabase } from '@/lib/supabase';

export const updateUserTypeToDriver = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ user_type: 'driver' })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating user type:', error);
      throw error;
    }

    console.log('User type updated to driver:', data);
    return data;
  } catch (error) {
    console.error('Error updating user type:', error);
    throw error;
  }
};

export const updateCurrentUserToDriver = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No user found');
    }

    return await updateUserTypeToDriver(user.id);
  } catch (error) {
    console.error('Error updating current user to driver:', error);
    throw error;
  }
};
