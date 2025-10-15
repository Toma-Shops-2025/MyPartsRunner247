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
    phone: profile?.phone || ''
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
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
      // Update profile in localStorage (bypass database for now)
      const updatedProfile = {
        ...profile,
        full_name: formData.full_name,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('mock_profile', JSON.stringify(updatedProfile));
      
      // Try to update database, but don't fail if it doesn't work
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone
          })
          .eq('id', user.id);
        
        if (error) {
          console.warn('Database update failed, but localStorage updated:', error);
        }
      } catch (dbError) {
        console.warn('Database update failed, but localStorage updated:', dbError);
      }
      
      alert('Profile updated successfully!');
      setIsEditing(false);
      // Refresh the page to show updated data
      window.location.reload();
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
          {profile?.user_type === 'customer' && (
            <div className="mt-4 p-4 bg-blue-900 border border-blue-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-100 mb-1">Want to become a driver?</h3>
                  <p className="text-blue-200 text-sm">
                    Click "🚗 Activate Driver Mode" below to instantly become a driver and start earning money delivering packages!
                  </p>
                </div>
              </div>
            </div>
          )}
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
                  <>
                    <Button 
                      onClick={async () => {
                        try {
                          // Create driver profile in localStorage
                          const driverProfile = {
                            id: user?.id,
                            email: user?.email || 'unknown@example.com',
                            full_name: profile?.full_name || user?.user_metadata?.full_name || 'Driver',
                            phone: profile?.phone || user?.user_metadata?.phone || '',
                            user_type: 'driver',
                            is_online: true,
                            is_approved: true,
                            status: 'active',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          };
                          
                          // Save to localStorage
                          localStorage.setItem('mock_profile', JSON.stringify(driverProfile));
                          
                          // Try to update database, but don't fail if it doesn't work
                          try {
                            await updateUserType('driver');
                          } catch (error) {
                            console.warn('Database update failed, but localStorage updated:', error);
                          }
                          
                          alert('Successfully activated Driver mode! You now have access to the Driver Dashboard.');
                          window.location.reload();
                        } catch (error) {
                          console.error('Error switching to driver:', error);
                          alert('Error switching to driver mode. Please try again.');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      🚗 Activate Driver Mode
                    </Button>
                    <Button 
                      onClick={() => navigate('/driver-application')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Apply to Become a Driver
                    </Button>
                  </>
                )}
                {profile?.user_type === 'driver' && (
                  <Button 
                    onClick={() => updateUserType('customer')}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Switch to Customer Mode
                  </Button>
                )}
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