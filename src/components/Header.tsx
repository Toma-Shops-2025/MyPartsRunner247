import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AuthModal from './AuthModal';
import { User, LogOut, Package, Car, BarChart3, Settings, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  MyPartsRunner
                </h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <button onClick={() => handleNavigation('/services')} className="text-gray-700 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                  Services
                </button>
                <a href="#how-it-works" className="text-gray-700 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                  How It Works
                </a>
                <button onClick={() => handleNavigation('/driver-application')} className="text-gray-700 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                  Become a Driver
                </button>
                <button onClick={() => handleNavigation('/about')} className="text-gray-700 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                  About
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
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
                        <DropdownMenuItem onClick={() => handleNavigation('/vehicle-settings')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Vehicle Settings
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* Admin-specific menu items */}
                    {profile?.user_type === 'admin' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigation('/admin-dashboard')}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/system-settings')}>
                          System Settings
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* Customer menu items */}
                    {profile?.user_type === 'customer' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigation('/my-orders')}>
                          <Package className="mr-2 h-4 w-4" />
                          My Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/addresses')}>
                          <Home className="mr-2 h-4 w-4" />
                          Addresses
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};
export default Header;