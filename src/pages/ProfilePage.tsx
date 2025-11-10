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
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
              <img
                src="/profile-pic-tab-background.png"
                alt="Profile picture background"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50 backdrop-blur-[2px]" />
              <div className="relative p-10 space-y-8 text-white text-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight drop-shadow-lg">Profile Picture</h2>
                  <p className="text-white/90 drop-shadow">
                    Upload a profile picture to personalize your account
                  </p>
                </div>
                <div className="max-w-sm mx-auto backdrop-blur-sm bg-black/35 border border-white/25 rounded-3xl p-6 shadow-2xl">
                  <AvatarUpload
                    currentAvatarUrl={profile?.avatar_url}
                    userInitials={userInitials}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
              <img
                src="/personal-info-tab-background.png"
                alt="Personal information background"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="relative p-10 space-y-8 text-white text-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Personal Information</h2>
                  <p className="text-white/80">
                    Update your personal details
                  </p>
                </div>
                <div className="backdrop-blur-sm bg-black/40 border border-white/25 rounded-3xl p-6 shadow-2xl space-y-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-white/90">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!isEditing}
                        className="bg-slate-900/70 border-white/20 text-white placeholder-white/60 focus:border-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90">Email</Label>
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="bg-slate-900/60 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/90">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                      className="bg-slate-900/70 border-white/20 text-white placeholder-white/60 focus:border-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg">
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
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
                          className="border-white/40 text-white hover:bg-white/15"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
              <img
                src="/account-info-background.png"
                alt="Account information background"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/35 to-slate-950/80" />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/50 via-transparent to-transparent" />
              <div className="absolute inset-0 mix-blend-screen opacity-65 bg-[radial-gradient(circle_at_top,_rgba(109,185,255,0.5)_0%,_rgba(15,23,42,0)_55%)]" />
              <div className="relative p-10 text-center space-y-8 text-white">
                <div className="flex items-center justify-center">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full bg-sky-500/30 blur-xl animate-pulse" />
                    <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full border border-sky-300/50 bg-black/40 shadow-2xl">
                      <Settings className="h-10 w-10 text-sky-200" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Account Information</h2>
                  <p className="text-white/80">
                    View your account details and user type
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl transition hover:border-white/20">
                    <Label className="text-white/70 uppercase tracking-wide text-xs">User Type</Label>
                    <div className="mt-3 rounded-xl bg-black/40 px-4 py-3 text-lg font-semibold capitalize text-white">
                      {profile?.user_type || 'customer'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl transition hover:border-white/20">
                    <Label className="text-white/70 uppercase tracking-wide text-xs">Account Created</Label>
                    <div className="mt-3 rounded-xl bg-black/40 px-4 py-3 text-lg font-semibold text-white">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
              <img
                src="/security-settings-modal-background.jpg"
                alt="Security settings background"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 backdrop-blur-[2px]" />
              <div className="absolute inset-0 mix-blend-screen opacity-60 bg-[radial-gradient(circle_at_top,_rgba(255,198,84,0.55)_0%,_rgba(0,0,0,0)_55%)]" />
              <div className="relative p-10 text-center space-y-6 text-white">
                <div className="flex items-center justify-center">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full bg-amber-500/35 blur-xl animate-pulse" />
                    <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full border border-amber-300/60 bg-black/55 shadow-2xl">
                      <Shield className="h-10 w-10 text-amber-300" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight drop-shadow-xl">Security Settings</h2>
                  <p className="text-white/90 max-w-xl mx-auto drop-shadow">
                    Manage two-factor authentication, password resets, and other account protection options through your authentication provider.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-900/50 px-6">
                    Change Password
                  </Button>
                  <Button variant="outline" className="border-white/60 text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-lg">
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
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70 backdrop-blur-[2px]" />
              <div className="relative p-8 space-y-8 text-white">
                <div>
                  <h2 className="text-3xl font-bold drop-shadow-xl">Notification Preferences</h2>
                  <p className="text-white/90 drop-shadow">
                    Control how you receive alerts and stay in the loop with your deliveries.
                  </p>
                </div>

                {/* Current Status */}
                <div className="rounded-2xl border border-white/15 bg-black/45 backdrop-blur-md p-4 shadow-xl">
                  <h4 className="font-semibold mb-2 text-white drop-shadow">Current Status</h4>
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
                  <h4 className="font-semibold text-white drop-shadow">Notification Types</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md p-4 text-white shadow-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold drop-shadow">Order Updates</div>
                          <div className="text-xs text-white/80 mt-1">New orders, status changes, delivery confirmations</div>
                        </div>
                        <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg shadow-green-900/50"></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md p-4 text-white shadow-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold drop-shadow">Driver Notifications</div>
                          <div className="text-xs text-white/80 mt-1">Earnings updates, schedule changes, important announcements</div>
                        </div>
                        <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg shadow-green-900/50"></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md p-4 text-white shadow-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold drop-shadow">System Alerts</div>
                          <div className="text-xs text-white/80 mt-1">Maintenance notifications, security alerts</div>
                        </div>
                        <div className="w-4 h-4 bg-amber-400 rounded-full shadow-lg shadow-amber-900/60"></div>
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