import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Save, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ProfilePage: React.FC = () => {
  const { user, profile, loading, updateUserType, createProfileManually } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: (typeof profile?.address === 'object' && profile?.address?.street) || ''
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: (typeof profile.address === 'object' && profile.address?.street) || ''
      });
    }
  }, [profile]);

  // Show loading with timeout to prevent infinite loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async () => {
    if (!user || !profile) return;
    
    try {
      const updateData: any = {
        full_name: formData.full_name,
        phone: formData.phone
      };
      
      // Skip address update for now - database schema issue
      // TODO: Add address column to database schema
      // if (formData.address && formData.address.trim()) {
      //   updateData.address = { street: formData.address.trim() };
      // }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
      } else {
        alert('Profile updated successfully!');
        setIsEditing(false);
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + (error.message || error));
    }
  };

  const handleForceDriverUpdate = async () => {
    if (!user) return;
    
    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (existingProfile) {
        // Update existing profile to driver with auto-approval
        const { error } = await supabase
          .from('profiles')
          .update({ 
            user_type: 'driver',
            status: 'active',
            is_online: true,
            is_approved: true
          })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating profile:', error);
          alert('Error updating profile: ' + error.message);
        } else {
          alert('Profile updated to driver! Please refresh the page.');
          window.location.reload();
        }
      } else {
        // Create new profile as driver with auto-approval
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: '',
            phone: '',
            user_type: 'driver',
            status: 'active',
            is_online: true,
            is_approved: true
          });
        
        if (error) {
          console.error('Error creating driver profile:', error);
          alert('Error creating profile: ' + error.message);
        } else {
          alert('Driver profile created! Please refresh the page.');
          window.location.reload();
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + (error.message || error));
    }
  };


  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-300">Manage your account information</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-teal-600 text-white">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-white">{profile?.full_name || 'User'}</CardTitle>
                <p className="text-gray-300">{profile?.user_type || 'customer'}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    value={user.email || ''} 
                    disabled 
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">Full Name</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Input 
                    id="full_name" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-white">Address</Label>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2 flex-wrap">
                {profile?.user_type === 'driver' && (
                  <Button 
                    onClick={() => navigate('/driver-dashboard')}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Go to Driver Dashboard
                  </Button>
                )}
                {profile?.user_type === 'customer' && (
                  <Button 
                    onClick={() => updateUserType('driver')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Switch to Driver Mode
                  </Button>
                )}
                {profile?.user_type === 'driver' && (
                  <Button 
                    onClick={() => updateUserType('customer')}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Switch to Customer Mode
                  </Button>
                )}
                <Button 
                  onClick={handleForceDriverUpdate}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Force Driver Update
                </Button>
              </div>
              
              <div className="flex space-x-4">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage;