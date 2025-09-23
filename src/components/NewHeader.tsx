import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import NewAuthModal from './NewAuthModal';
import { User, LogOut, Package, Car, BarChart3, Settings, Home, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewHeader: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
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
                <a href="#how-it-works" className="text-gray-300 hover:text-teal-400 px-3 py-2 text-sm font-medium">
                  How It Works
                </a>
                <button onClick={() => handleNavigation('/about')} className="text-gray-300 hover:text-teal-400 px-3 py-2 text-sm font-medium">
                  About
                </button>
              </nav>
            </div>

            <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
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
                    
                    {/* Customer menu items */}
                    {profile?.user_type === 'customer' && (
                      <>
                        <DropdownMenuItem onClick={() => handleNavigation('/place-order')}>
                          <Package className="mr-2 h-4 w-4" />
                          Place Order
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation('/my-orders')}>
                          <Package className="mr-2 h-4 w-4" />
                          My Orders
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="h-10 px-4 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Sign In
                </Button>
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
                <a 
                  href="#how-it-works" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                >
                  How It Works
                </a>
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
                          onClick={() => handleNavigation('/vehicle-settings')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          🚙 Vehicle Settings
                        </button>
                      </>
                    )}
                    {profile?.user_type === 'customer' && (
                      <>
                        <button 
                          onClick={() => handleNavigation('/place-order')}
                          className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:text-teal-400 hover:bg-gray-700 rounded-md"
                        >
                          📦 Place Order
                        </button>
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
