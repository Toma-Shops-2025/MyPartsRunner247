import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import AvatarUpload from '@/components/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Shield, Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const ProfilePage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  // Sync form data with profile when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    // The AvatarUpload component handles the database update
    // This is just for any additional UI updates if needed
    console.log('Avatar updated:', newAvatarUrl);
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "User not authenticated. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Profile will be updated automatically by the useAuth hook
      // No need to manually update local state

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditing(false);
      
      // Refresh the page to ensure profile data is updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const userInitials = profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U';

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a profile picture to personalize your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url}
                  userInitials={userInitials}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            full_name: profile?.full_name || '',
                            phone: profile?.phone || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details and user type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>User Type</Label>
                    <div className="mt-1 p-2 bg-gray-100 rounded-md">
                      <span className="capitalize font-medium">{profile?.user_type || 'customer'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Account Created</Label>
                    <div className="mt-1 p-2 bg-gray-100 rounded-md">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Features</h3>
                  <p className="text-gray-600 mb-4">
                    Security settings are managed through your authentication provider.
                  </p>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      'Notification' in window && Notification.permission === 'granted' 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">
                      {typeof window !== 'undefined' && 'Notification' in window 
                        ? Notification.permission === 'granted' 
                          ? 'Notifications enabled' 
                          : Notification.permission === 'denied' 
                            ? 'Notifications blocked' 
                            : 'Notifications not configured'
                        : 'Notifications not supported'
                      }
                    </span>
                  </div>
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Order Updates</div>
                        <div className="text-xs text-gray-500">New orders, status changes, delivery confirmations</div>
                      </div>
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Driver Notifications</div>
                        <div className="text-xs text-gray-500">Earnings updates, schedule changes, important announcements</div>
                      </div>
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">System Alerts</div>
                        <div className="text-xs text-gray-500">Maintenance notifications, security alerts</div>
                      </div>
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Open browser notification settings
                      if ('Notification' in window) {
                        if (Notification.permission === 'granted') {
                          alert('Notifications are already enabled! You can manage them in your browser settings.');
                        } else if (Notification.permission === 'denied') {
                          alert('Notifications are blocked. Please enable them in your browser settings:\n\nChrome: Settings > Privacy > Site Settings > Notifications\nSafari: Preferences > Websites > Notifications');
                        } else {
                          Notification.requestPermission().then((permission) => {
                            if (permission === 'granted') {
                              alert('Notifications enabled! You will now receive updates about your orders and deliveries.');
                              // Refresh the page to update status
                              window.location.reload();
                            } else {
                              alert('Notifications blocked. You can enable them later in your browser settings.');
                            }
                          });
                        }
                      } else {
                        alert('This browser does not support notifications. Please use a modern browser like Chrome, Safari, or Firefox.');
                      }
                    }}
                  >
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                      ? 'Manage Notifications' 
                      : 'Enable Notifications'
                    }
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Test notification
                      if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('MyPartsRunner Test', {
                          body: 'This is a test notification from MyPartsRunner!',
                          icon: '/icon-192x192.png'
                        });
                      } else {
                        alert('Please enable notifications first to test them.');
                      }
                    }}
                  >
                    Test Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;