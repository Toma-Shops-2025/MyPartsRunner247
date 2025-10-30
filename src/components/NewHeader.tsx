import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import NewAuthModal from './NewAuthModal';
import AvatarUpload from './AvatarUpload';
import { User, LogOut, Package, Car, BarChart3, Settings, Home, Menu, X, ArrowRightLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewHeader: React.FC = () => {
  const { user, profile, signOut, forceLogout, loading, updateUserType } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    // Debug logging only in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Navigating to:', path, 'User:', !!user, 'Profile:', !!profile, 'User type:', profile?.user_type);
    }
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    console.log('Sign out button clicked!');
    try {
      setIsMobileMenuOpen(false);
      await signOut();
      console.log('Sign out completed');
      // Note: signOut() already handles navigation via window.location.href
    } catch (error) {
      console.error('Error in handleSignOut:', error);
    }
  };

  // Debug logging only in development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔍 NAVIGATION DEBUG: profile?.user_type =', profile?.user_type, 'profile =', profile);
  }

  const handleSwitchToDriver = async () => {
    try {
      console.log('Attempting to switch to driver mode...');
      await updateUserType('driver');
      console.log('Successfully switched to driver mode');
      alert('Switched to Driver Mode! You can now access driver features.');
      // Force a page refresh to update the UI
      window.location.reload();
    } catch (error: any) {
      console.error('Error switching to driver mode:', error);
      alert(`Error switching to driver mode: ${error.message || error}. Please try again.`);
    }
  };

  const handleSwitchToCustomer = async () => {
    try {
      console.log('Attempting to switch to customer mode...');
      await updateUserType('customer');
      console.log('Successfully switched to customer mode');
      alert('Switched to Customer Mode! You can now place orders.');
      // Force a page refresh to update the UI
      window.location.reload();
    } catch (error: any) {
      console.error('Error switching to customer mode:', error);
      alert(`Error switching to customer mode: ${error.message || error}. Please try again.`);
    }
  };

  return (
    <>
      <header className="bg-gray-900 shadow-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                  MyPartsRunner
                </h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <button onClick={() => handleNavigation('/services')} className="text-gray-300 hover:text-teal-400 px-3 py-2 text-sm font-medium">
                  Services
                </button>
                <button onClick={() => handleScrollToSection('how-it-works')} className="text-gray-300 hover:text-teal-400 px-3 py-2 text-sm font-medium">
                  How It Works
                </button>
                <button onClick={() => handleNavigation('/about')} className="text-gray-300 hover:text-teal-400 px-3 py-2 text-sm font-medium">
                  About
                </button>
                <button onClick={() => {
                  if (user) {
                    handleNavigation('/driver-dashboard');
                  } else {
                    handleNavigation('/driver-application');
                  }
                }} className="text-gray-300 hover:text-teal-400 px-3 py-2 text-sm font-medium">
                  Become a Driver
                </button>
              </nav>
            </div>

            <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
              {/* Online/Offline badge for drivers */}
              {user && profile?.user_type === 'driver' && (
                <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${profile?.is_online ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-gray-700/60 text-gray-300 border-gray-600'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${profile?.is_online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                  <span>{profile?.is_online ? 'Online' : 'Offline'}</span>
                </div>
              )}
              {/* Admin Dashboard Button - Always visible for admins */}
              {user && profile?.user_type === 'admin' && (
                <Button
                  onClick={() => handleNavigation('/admin-dashboard')}
                  variant="outline"
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
              
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 sm:h-8 sm:w-8 rounded-full p-0 hover:bg-gray-100"
                    >
                      <Avatar className="h-8 w-8 sm:h-8 sm:w-8">
                        <AvatarImage src={profile?.avatar_url} alt="Profile" />
                        <AvatarFallback className="text-sm">
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem className="flex-col items-start">
                      <div className="font-medium">{profile?.full_name || 'User'}</div>
                      <div className="text-xs text-gray-500">
                        {user.email} • {profile?.user_type || 'customer'}
                      </div>
                    </DropdownMenuItem>
                    
                    {/* Admin-specific menu items - Always show for debugging */}
                    {profile?.user_type === 'admin' && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => {
                            console.log('Admin Dashboard clicked');
                            handleNavigation('/admin-dashboard');
                          }}
                          className="cursor-pointer hover:bg-gray-100 bg-green-50 text-green-700"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Driver-specific menu items */}
                    {profile?.user_type === 'driver' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigation('/driver-dashboard')}>
                          <Car className="mr-2 h-4 w-4" />
                          Driver Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/earnings')}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Earnings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/driver-verification')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Driver Onboarding
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/driver-training')}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Driver Training
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSwitchToCustomer}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Switch to Customer Mode
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* Temporary: Show driver options for testing */}
                    
                    {/* Customer menu items */}
                    {profile?.user_type === 'customer' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigation('/my-orders')}>
                          <Package className="mr-2 h-4 w-4" />
                          My Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/driver-application')}>
                          <Car className="mr-2 h-4 w-4" />
                          Become a Driver
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    
                    {/* Admin Dashboard - Only visible to admins */}
                    {profile?.user_type === 'admin' && (
                      <DropdownMenuItem 
                        onClick={() => {
                          console.log('Direct Admin Dashboard clicked');
                          handleNavigation('/admin-dashboard');
                        }}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="h-10 px-4 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-teal-400"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-700 bg-gray-800">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button 
                  onClick={() => handleNavigation('/services')}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                >
                  Services
                </button>
                <button 
                  onClick={() => handleScrollToSection('how-it-works')}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => handleNavigation('/about')}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                >
                  About
                </button>
                
                {user ? (
                  <>
                    <hr className="my-2 border-gray-600" />
                    {profile?.user_type === 'driver' && (
                      <>
                        <button 
                          onClick={() => handleNavigation('/driver-dashboard')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          🚗 Driver Dashboard
                        </button>
                        <button 
                          onClick={() => handleNavigation('/earnings')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          💰 Earnings
                        </button>
                        <button 
                          onClick={() => handleNavigation('/driver-verification')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          🚙 Driver Onboarding
                        </button>
                        <button 
                          onClick={() => handleNavigation('/driver-training')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          📚 Driver Training
                        </button>
                        <hr className="my-2 border-gray-600" />
                        <button 
                          onClick={handleSwitchToCustomer}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          🔄 Switch to Customer Mode
                        </button>
                      </>
                    )}
                    {profile?.user_type === 'customer' && (
                      <>
                        <button 
                          onClick={() => handleNavigation('/my-orders')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          📋 My Orders
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleNavigation('/profile')}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <hr className="my-2 border-gray-600" />
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <NewAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default NewHeader;
