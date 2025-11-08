import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import AvatarUpload from '@/components/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Shield, Bell, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const ProfilePage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
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
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
              <img
                src="/security-settings-modal-background.jpg"
                alt="Security settings background"
                className="absolute inset-0 h-full w-full object-cover object-center md:object-[center_top]"
              />
              <div className="absolute inset-0 bg-slate-950/30" />
              <div className="relative p-10 text-center space-y-6 text-white">
                <div className="flex items-center justify-center">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-xl animate-pulse" />
                    <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full border border-amber-400/50 bg-black/40 shadow-2xl">
                      <Shield className="h-10 w-10 text-amber-300" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Security Settings</h2>
                  <p className="text-white/80 max-w-xl mx-auto">
                    Manage two-factor authentication, password resets, and other account protection options through your authentication provider.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="secondary" className="bg-amber-500/80 hover:bg-amber-500 text-black px-6">
                    Change Password
                  </Button>
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                    View Security Tips
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
              <img
                src="/notification-preferences-modal-background.png"
                alt="Notification preferences background"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />
              <div className="relative p-8 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-white">Notification Preferences</h2>
                  <p className="text-white/80">
                    Control how you receive alerts and stay in the loop with your deliveries.
                  </p>
                </div>

                {/* Current Status */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-inner">
                  <h4 className="font-semibold mb-2 text-white">Current Status</h4>
                  <div className="flex items-center space-x-3 text-white/90">
                    <div className={`w-3 h-3 rounded-full ${
                      'Notification' in window && Notification.permission === 'granted' 
                        ? 'bg-green-400' 
                        : 'bg-red-400'
                    }`} />
                    <span className="text-sm">
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
                  <h4 className="font-semibold text-white">Notification Types</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-inner">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">Order Updates</div>
                          <div className="text-xs text-white/70 mt-1">New orders, status changes, delivery confirmations</div>
                        </div>
                        <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-inner">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">Driver Notifications</div>
                          <div className="text-xs text-white/70 mt-1">Earnings updates, schedule changes, important announcements</div>
                        </div>
                        <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-inner">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">System Alerts</div>
                          <div className="text-xs text-white/70 mt-1">Maintenance notifications, security alerts</div>
                        </div>
                        <div className="w-4 h-4 bg-amber-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;