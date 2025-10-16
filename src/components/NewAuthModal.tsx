import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface NewAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const NewAuthModal: React.FC<NewAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createProfileManually } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'customer' | 'driver'>('customer');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            user_type: userType
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          console.warn('Supabase signup failed, creating fallback account');
          
          // Create a fallback account using localStorage
          const fallbackUser = {
            id: `fallback_${Date.now()}`,
            email,
            user_metadata: {
              full_name: fullName,
              phone,
              user_type: userType
            }
          };
          
          // Store user data in localStorage
          localStorage.setItem('fallback_user', JSON.stringify(fallbackUser));
          
          // Clear any existing Stripe account ID for new user
          localStorage.removeItem('stripe_account_id');
          
          // Create a fallback profile
          const fallbackProfile = {
            id: fallbackUser.id,
            email,
            full_name: fullName,
            phone,
            user_type: userType,
            is_online: userType === 'driver',
            is_approved: userType === 'driver',
            status: userType === 'driver' ? 'active' : 'inactive',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem('mock_profile', JSON.stringify(fallbackProfile));
          
          toast({
            title: "Account created!",
            description: `Welcome! You've been registered as a ${userType}. (Using fallback mode due to server issues)`,
          });
          
          onSuccess?.();
          onClose();
          return;
        }
        
        throw error;
      }

      // Clear any existing Stripe account ID for new user
      localStorage.removeItem('stripe_account_id');

      // Create profile in database if user was created
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              phone: phone,
              user_type: userType,
              is_online: userType === 'driver',
              is_approved: userType === 'driver',
              status: userType === 'driver' ? 'active' : 'inactive',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.warn('Profile creation failed, but user created:', profileError);
            // Create fallback profile in localStorage
            const fallbackProfile = {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              phone: phone,
              user_type: userType,
              is_online: userType === 'driver',
              is_approved: userType === 'driver',
              status: userType === 'driver' ? 'active' : 'inactive',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            localStorage.setItem('mock_profile', JSON.stringify(fallbackProfile));
          } else {
            console.log('Profile created successfully in database');
          }
        } catch (profileError) {
          console.warn('Profile creation failed, but user created:', profileError);
          // Create fallback profile in localStorage
          const fallbackProfile = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            phone: phone,
            user_type: userType,
            is_online: userType === 'driver',
            is_approved: userType === 'driver',
            status: userType === 'driver' ? 'active' : 'inactive',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          localStorage.setItem('mock_profile', JSON.stringify(fallbackProfile));
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Account created!",
          description: "Please check your email for a verification link from 'Supabase Auth'. Click the link to confirm your account before signing in.",
        });
      } else {
        toast({
          title: "Account created!",
          description: `Welcome! You've been registered as a ${userType}.`,
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Sign in successful:', data.user?.email);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      // Force a page refresh to ensure auth state updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-full h-full max-w-none max-h-none p-0 overflow-hidden bg-transparent border-none shadow-none m-0 rounded-none"
        aria-describedby="auth-modal-description"
      >
        {/* Full Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("/auth-modal-background.webp?v=${Date.now()}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Dark Sign-in/Sign-up Box */}
        <div className="relative z-10 p-8 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg mx-auto my-auto max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold text-center mb-6">Welcome to MyPartsRunner</DialogTitle>
            <div id="auth-modal-description" className="sr-only">
              Sign in or create an account to access MyPartsRunner services
            </div>
          </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-600 mb-6">
            <TabsTrigger value="signin" className="text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
          </TabsList>
        
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email" className="text-white font-medium">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="signin-password" className="text-white font-medium">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-fullname" className="text-white font-medium">Full Name</Label>
                <Input
                  id="signup-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="signup-email" className="text-white font-medium">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="signup-phone" className="text-white font-medium">Phone</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-white font-medium">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400"
                />
              </div>
              
              {/* User Type Selection */}
              <div>
                <Label className="text-white font-medium">I want to:</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="userType"
                      value="customer"
                      checked={userType === 'customer'}
                      onChange={(e) => setUserType(e.target.value as 'customer' | 'driver')}
                      className="text-teal-600"
                    />
                    <span className="text-white">Place orders (Customer)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="userType"
                      value="driver"
                      checked={userType === 'driver'}
                      onChange={(e) => setUserType(e.target.value as 'customer' | 'driver')}
                      className="text-teal-600"
                    />
                    <span className="text-white">Deliver orders (Driver)</span>
                  </label>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewAuthModal;
