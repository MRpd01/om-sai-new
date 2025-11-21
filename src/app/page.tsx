"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, 
  Users, 
  LogIn, 
  UserPlus, 
  ChevronDown, 
  MapPin, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  Star,
  Utensils,
  PartyPopper,
  DollarSign,
  Sparkles,
  Package,
  Mail,
  Phone,
  Info,
  AlertCircle,
  Truck,
  Award,
  UtensilsCrossed,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GoogleMap from "@/components/GoogleMap";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false);
  const [isSignUpDropdownOpen, setIsSignUpDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on the mobile menu button or inside the mobile menu
      if (target.closest('[data-mobile-menu]') || target.closest('[data-mobile-menu-button]')) {
        return;
      }
      
      // Don't close if clicking on the user dropdown button or inside the user dropdown
      if (target.closest('[data-user-dropdown]') || target.closest('[data-user-dropdown-button]')) {
        return;
      }
      
      setIsSignInDropdownOpen(false);
      setIsSignUpDropdownOpen(false);
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen hero-bg relative bg-gradient-to-br from-cream via-orange-50/80 to-paneer">
      {/* Background overlay with food-themed patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 via-turmeric/5 to-curry/5"></div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 153, 51, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, rgba(217, 119, 6, 0.3) 0%, transparent 50%)`
        }}></div>
      </div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b-2 border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-3 lg:py-4">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 lg:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              <div className="relative h-10 w-10 lg:h-12 lg:w-12">
                <Image 
                  src="/images/BrandLogo.png" 
                  alt="Om Sai Bhojnalay Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">ओम साई भोजनालय</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a href="#features" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                Features
              </a>
              <a href="#about" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                About
              </a>
              <a href="#location" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                Location
              </a>
              <a href="#contact" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                Contact
              </a>
            </nav>

            {/* Desktop Auth Buttons or User Profile */}
            <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
              {!loading && user ? (
                /* Logged In User Menu */
                <div className="relative" data-user-dropdown>
                  <button
                    data-user-dropdown-button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('User dropdown clicked! Current state:', isUserMenuOpen);
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsSignInDropdownOpen(false);
                      setIsSignUpDropdownOpen(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-100 transition-colors border border-transparent hover:border-orange-200"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      {user.user_metadata?.avatar ? (
                        <img 
                          src={user.user_metadata.avatar} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-orange-900">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-orange-600 capitalize">
                        {user.user_metadata?.role || 'Member'}
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 text-orange-600" />
                  </button>

                  {isUserMenuOpen && (
                    <div 
                      data-user-dropdown
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 border border-orange-200 ring-1 ring-black ring-opacity-5"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-orange-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            {user.user_metadata?.avatar ? (
                              <img 
                                src={user.user_metadata.avatar} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-orange-900">
                              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="text-sm text-orange-600 capitalize">
                              {user.user_metadata?.role || 'Member'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            router.push('/dashboard');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                        >
                          <ChefHat className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">
                              Dashboard
                            </div>
                            <div className="text-xs text-orange-600">
                              Manage your account
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            router.push('/profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">
                              Profile Settings
                            </div>
                            <div className="text-xs text-orange-600">
                              Update your information
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            router.push('/menu');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                        >
                          <ChefHat className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">
                              Menu
                            </div>
                            <div className="text-xs text-orange-600">
                              View today's menu
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            router.push('/members');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                        >
                          <Users className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">
                              Members
                            </div>
                            <div className="text-xs text-orange-600">
                              View mess members
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Sign Out Section */}
                      <div className="border-t border-orange-100 pt-1">
                        <button
                          onClick={async () => {
                            await signOut();
                            setIsUserMenuOpen(false);
                            router.push('/');
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                        >
                          <LogOut className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="font-medium">
                              Sign Out
                            </div>
                            <div className="text-xs text-red-600">
                              Logout from your account
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Logged In - Show Auth Buttons */
                <>
                  {/* Sign In Dropdown */}
                  <div className="relative flex items-center">
                    <Button
                      variant="ghost"
                      className="text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                      onClick={() => router.push('/login?role=user')}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {"Sign In"}
                    </Button>

                    {/* small chevron to open dropdown for role choices */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSignInDropdownOpen(!isSignInDropdownOpen);
                        setIsSignUpDropdownOpen(false);
                      }}
                      className="ml-1 p-2 rounded hover:bg-orange-100"
                      aria-label="Open sign in options"
                    >
                      <ChevronDown className="h-3 w-3 text-orange-600" />
                    </button>

                    {isSignInDropdownOpen && (
                      <div className="absolute right-0 mt-10 md:mt-8 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-orange-200">
                        <button
                          onClick={() => {
                            router.push('/login?role=user');
                            setIsSignInDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                        >
                          <Users className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">{"Member Sign In"}</div>
                            <div className="text-xs text-orange-600">Access your mess account</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            router.push('/login?role=admin');
                            setIsSignInDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                        >
                          <ChefHat className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">{"Owner/Admin Sign In"}</div>
                            <div className="text-xs text-orange-600">Manage your mess operations</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sign Up Dropdown */}
                  <div className="relative flex items-center">
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => router.push('/signup?role=user')}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {"Sign Up"}
                    </Button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSignUpDropdownOpen(!isSignUpDropdownOpen);
                        setIsSignInDropdownOpen(false);
                      }}
                      className="ml-1 p-2 rounded hover:bg-orange-100"
                      aria-label="Open sign up options"
                    >
                      <ChevronDown className="h-3 w-3 text-white" />
                    </button>

                    {isSignUpDropdownOpen && (
                      <div className="absolute right-0 mt-10 md:mt-8 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-orange-200">
                        <button
                          onClick={() => {
                            router.push('/signup?role=user');
                            setIsSignUpDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                        >
                          <Users className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">{"Join as Member"}</div>
                            <div className="text-xs text-orange-600">Start your mess membership</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            router.push('/signup?role=admin');
                            setIsSignUpDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                        >
                          <ChefHat className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium">{"Register as Owner"}</div>
                            <div className="text-xs text-orange-600">Setup your mess business</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              data-mobile-menu-button
              className="lg:hidden p-3 text-orange-700 hover:text-orange-900 hover:bg-orange-100 rounded-lg transition-colors z-50 relative touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSignInDropdownOpen(false);
                setIsSignUpDropdownOpen(false);
                setIsUserMenuOpen(false);
              }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div 
              data-mobile-menu 
              className="lg:hidden fixed top-16 left-0 right-0 border-t border-orange-200/50 bg-white/98 backdrop-blur-md shadow-lg z-[60] max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="px-4 py-4 space-y-4">
                {/* User Profile Section - Always shown first */}
                {!loading && user && (
                  <div className="pb-3 border-b border-orange-200">
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        {user.user_metadata?.avatar ? (
                          <img 
                            src={user.user_metadata.avatar} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-orange-900">
                          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="text-sm text-orange-600 capitalize">
                          {user.user_metadata?.role || 'Member'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-orange-700 mb-3">Navigation / नेव्हिगेशन</h3>
                  <a 
                    href="#features" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    <span className="font-medium">{"Features"}</span>
                  </a>
                  <a 
                    href="#about" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Info className="h-4 w-4" />
                    <span className="font-medium">{"About"}</span>
                  </a>
                  <a 
                    href="#location" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location</span>
                  </a>
                  <a 
                    href="#contact" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{"Contact"}</span>
                  </a>
                </div>

                {/* Account Actions */}
                <div className="pt-3 border-t border-orange-200 space-y-3">
                  {!loading && user ? (
                    /* Logged In User - Account Actions */
                    <>
                      <h3 className="text-sm font-medium text-orange-700">Account / खाते</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            router.push('/dashboard');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-3"
                        >
                          <ChefHat className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              Dashboard
                            </div>
                            <div className="text-xs text-orange-200">
                              Manage your account
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            router.push('/profile');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex items-center space-x-3"
                        >
                          <Settings className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-900">
                              Profile Settings
                            </div>
                            <div className="text-xs text-orange-600">
                              Update your information
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={async () => {
                            await signOut();
                            setIsMobileMenuOpen(false);
                            router.push('/');
                          }}
                          className="w-full text-left px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-3"
                        >
                          <LogOut className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="font-medium text-red-700">
                              Sign Out
                            </div>
                            <div className="text-xs text-red-600">
                              Logout from your account
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Not Logged In - Authentication Options */
                    <>
                      <h3 className="text-sm font-medium text-orange-700">Account / खाते</h3>
                      
                      {/* Sign In Options */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            router.push('/login?role=user');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex items-center space-x-3"
                        >
                          <Users className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-900">{"Member Sign In"}</div>
                            <div className="text-xs text-orange-600">Access your mess account</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            router.push('/login?role=admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors flex items-center space-x-3"
                        >
                          <ChefHat className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-900">{"Owner/Admin Sign In"}</div>
                            <div className="text-xs text-orange-600">Manage your mess operations</div>
                          </div>
                        </button>
                      </div>

                      {/* Sign Up Options */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => {
                            router.push('/signup?role=user');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-3"
                        >
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{"Join as Member"}</div>
                            <div className="text-xs text-orange-200">Start your mess membership</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            router.push('/signup?role=admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-3"
                        >
                          <ChefHat className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{"Register as Owner"}</div>
                            <div className="text-xs text-orange-200">Setup your mess business</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-16 sm:pt-20 lg:pt-24 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          
          <div className="absolute inset-0 bg-gradient-to-br from-cream/80 via-paneer/80 to-orange-50/80"></div>
        </div>

        {/* Subtle floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-10">
          <div className="absolute top-20 left-10 text-4xl animate-float-gentle">🍛</div>
          <div className="absolute top-40 right-20 text-3xl animate-float-gentle" style={{animationDelay: '1s'}}>🥘</div>
          <div className="absolute bottom-40 left-20 text-3xl animate-float-gentle" style={{animationDelay: '2s'}}>🍚</div>
          <div className="absolute bottom-20 right-10 text-4xl animate-float-gentle" style={{animationDelay: '1.5s'}}>🫓</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20 relative z-20">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-4 sm:mb-6 leading-tight">
              {"Welcome to OM Sai Bhojnalay"}
            </h1>
            
            <h2 className="text-lg sm:text-xl lg:text-2xl text-black mb-6 sm:mb-8 font-medium">
              {"Authentic Home-Style Meals in Chhatrapati Sambhajinagar"}
            </h2>
            
            <p className="text-base sm:text-lg text-black mb-8 sm:mb-10 leading-relaxed font-medium max-w-4xl mx-auto">
              {"Experience the taste of home-cooked food with our nutritious and delicious meals. Perfect for students and working professionals looking for quality mess services."}
            </p>

            {/* Rating Display */}
            <div className="flex justify-center items-center mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 glass-morphism px-6 py-3 rounded-full shadow-lg border-2 border-saffron">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-turmeric text-turmeric" />
                  <Star className="h-5 w-5 fill-turmeric text-turmeric" />
                  <Star className="h-5 w-5 fill-turmeric text-turmeric" />
                  <Star className="h-5 w-5 fill-turmeric text-turmeric" />
                  <Star className="h-5 w-5 fill-gray-300 text-gray-300" />
                </div>
                <span className="text-black font-bold text-lg">4.5/5</span>
                <span className="text-black text-sm font-semibold">
                  (by our happy customers)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              {/* Hide sign-up buttons when user is already signed in */}
              {!loading && !user ? (
                <>
                  <Button
                    onClick={() => router.push('/signup?role=user')}
                    size="lg"
                    className="bg-gradient-food-warm text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto sm:min-w-[240px] shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-1"
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                    {"Get Started"}
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/signup?role=admin')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-curry bg-white/90 text-curry hover:bg-gradient-food-warm hover:text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto sm:min-w-[240px] shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-1"
                  >
                    <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                    {"Register as Owner"}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold gradient-text-orange mb-4">
                Why Choose OM Sai Bhojnalay?
              </h2>
              <p className="text-xl text-masala max-w-2xl mx-auto font-semibold">
                Experience authentic homely meals with premium quality and service
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Tiffin Service */}
              <div className="bg-gradient-to-br from-paneer via-white to-orange-50 p-6 rounded-xl border-2 border-saffron hover:shadow-2xl transition-all hover:-translate-y-2 hover:scale-105">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg transform transition-transform hover:rotate-6">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-chai mb-3 text-center">
                  Tiffin Service Available
                </h3>
                <p className="text-masala text-center font-medium">
                  Special tiffin service for college students - fresh, hygienic, and delivered on time!
                </p>
              </div>

              {/* Rating */}
              <div className="bg-gradient-to-br from-amber-50 via-white to-turmeric/20 p-6 rounded-xl border-2 border-turmeric hover:shadow-2xl transition-all hover:-translate-y-2 hover:scale-105">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg transform transition-transform hover:rotate-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-3 text-center">
                  Rated 4.5/5 Stars
                </h3>
                <p className="text-orange-700 text-center">
                  Consistently rated highly by our satisfied customers for quality and taste
                </p>
              </div>

              {/* Wide Varieties */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border-2 border-orange-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg transform transition-transform hover:rotate-6">
                  <UtensilsCrossed className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-3 text-center">
                  Wide Varieties of Food
                </h3>
                <p className="text-orange-700 text-center">
                  No item repetition in a week! Enjoy different delicious meals every day
                </p>
              </div>

              {/* Sunday Feast */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-orange-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg transform transition-transform hover:rotate-6">
                  <PartyPopper className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-3 text-center">
                  Sunday Special Feast
                </h3>
                <p className="text-orange-700 text-center">
                  {true 
                    ? 'Every Sunday enjoy special feast meals with exclusive dishes and desserts!'
                    : 'प्रत्येक रविवारी विशेष पदार्थ आणि मिष्टान्नांसह विशेष मेजवानीचा आनंद घ्या!'
                  }
                </p>
              </div>

              {/* Affordable Plans */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-orange-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-3 text-center">
                  Affordable Monthly Plans
                </h3>
                <p className="text-orange-700 text-center">
                  {true 
                    ? 'Budget-friendly subscription plans designed especially for students and working professionals'
                    : 'विद्यार्थी आणि कामकाजी व्यावसायिकांसाठी विशेषतः डिझाइन केलेल्या बजेट-फ्रेंडली सबस्क्रिप्शन योजना'
                  }
                </p>
              </div>

              {/* Hygiene & Freshness */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-orange-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-3 text-center">
                  Hygienic & Fresh Meals
                </h3>
                <p className="text-orange-700 text-center">
                  {true 
                    ? 'Freshly cooked daily with the highest standards of hygiene and quality ingredients'
                    : 'उच्च दर्जाची स्वच्छता आणि दर्जेदार साहित्यासह दररोज ताजे शिजवलेले'
                  }
                </p>
              </div>
            </div>

            {/* Important Note - Sunday Evening */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-orange-100 border-l-4 border-orange-600 p-6 rounded-lg shadow-md">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-bold text-orange-900 mb-2">
                      Important Notice
                    </h4>
                    <p className="text-orange-800">
                      {true 
                        ? 'Sunday evening mess remains closed. Please plan accordingly.'
                        : 'रविवारी संध्याकाळी मेस बंद असतो. कृपया त्यानुसार योजना करा.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gradient-to-br from-orange-50/90 via-amber-50/90 to-yellow-50/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-8">
                About OM Sai Bhojnalay
              </h2>
              <div className="max-w-4xl mx-auto text-lg text-orange-700 leading-relaxed">
                <p className="mb-6">
                  {true 
                    ? 'Welcome to OM Sai Bhojnalay, the premier mess service in Chhatrapati Sambhajinagar. We take pride in serving authentic, homely meals prepared with love, care, and the highest standards of hygiene. Our commitment to quality and tradition has made us the No.1 choice for students and working professionals in the area.'
                    : 'छत्रपती संभाजीनगरमधील प्रीमियर मेस सेवा, ओम साई भोजनालयात आपले स्वागत आहे. प्रेम, काळजी आणि स्वच्छतेच्या सर्वोच्च मानकांसह तयार केलेले अस्सल, घरगुती जेवण सर्व्ह करण्यात आम्हाला अभिमान आहे. गुणवत्ता आणि परंपरेच्या आमच्या वचनबद्धतेमुळे आम्ही या क्षेत्रातील विद्यार्थी आणि कामकाजी व्यावसायिकांसाठी नंबर १ निवड बनलो आहोत.'
                  }
                </p>
                <p className="mb-6">
                  {true 
                    ? 'Our state-of-the-art digital platform makes it easy to manage subscriptions, view menus, and make payments seamlessly. We believe in combining traditional cooking methods with modern technology to provide you with the best dining experience.'
                    : 'आमचे अत्याधुनिक डिजिटल प्लॅटफॉर्म सबस्क्रिप्शन व्यवस्थापित करणे, मेनू पाहणे आणि पेमेंट्स निर्बाधपणे करणे सोपे करते. पारंपारिक स्वयंपाक पद्धती आधुनिक तंत्रज्ञानासह एकत्र करून तुम्हाला सर्वोत्तम डायनिंग अनुभव प्रदान करण्यावर आमचा विश्वास आहे.'
                  }
                </p>
              </div>
            </div>

            {/* Address Card */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-200">
                <div className="flex items-center justify-center mb-6">
                  <MapPin className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-2xl font-bold text-orange-900">
                    Visit Us
                  </h3>
                </div>
                
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-bold text-orange-900">
                    HOTEL OM SAI BHOJNALAYA
                  </h4>
                  <div className="text-orange-700 leading-relaxed">
                    <p>Plot No 9-A, Gut No 3, Martand Nagar</p>
                    <p>Satara Parisar, Chhatrapati Sambhajinagar</p>
                    <p>Ward No 114 (Deolai Satara)</p>
                    <p>Aurangabad Municipal Corporation Zone 8</p>
                    <p>Aurangabad, Maharashtra - 431001</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-orange-200 text-center">
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Plot+No+9-A+Gut+No+3+Martand+Nagar+Satara+Parisar+Chhatrapati+Sambhajinagar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section id="location" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
                Find Our Mess
              </h2>
              <p className="text-xl text-orange-700 max-w-2xl mx-auto mb-8">
                {true 
                  ? 'Conveniently located for easy access. Visit us today!'
                  : 'सोप्या प्रवेशासाठी सोयीस्कर ठिकाणी स्थित. आज आम्हाला भेट द्या!'
                }
              </p>
              <div className="flex items-center justify-center space-x-2 text-orange-600 mb-8">
                <MapPin className="h-5 w-5" />
                <span className="text-lg font-medium">
                  Live Location
                </span>
              </div>
            </div>
            
            {/* Google Map */}
            <div className="max-w-4xl mx-auto">
              <GoogleMap className="w-full h-96 md:h-[500px]" />
            </div>
            
            <div className="text-center mt-8">
              <p className="text-orange-600 text-sm">
                {true 
                  ? 'Location shown is based on your current position. Contact us for exact mess address.'
                  : 'दर्शविलेले स्थान तुमच्या सध्याच्या स्थितीवर आधारित आहे. अचूक मेस पत्त्यासाठी आमच्याशी संपर्क साधा.'
                }
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-8">
                Get In Touch
              </h2>
              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-orange-700 mb-8">
                  {true 
                    ? 'Ready to experience authentic homely meals? Join us today or contact us for more information about subscriptions, tiffin service, and special packages.'
                    : 'अस्सल घरगुती जेवणाचा अनुभव घेण्यास तयार आहात? आज आमच्यात सामील व्हा किंवा सबस्क्रिप्शन, टिफिन सेवा आणि विशेष पॅकेजबद्दल अधिक माहितीसाठी आमच्याशी संपर्क साधा.'
                  }
                </p>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-8 mb-8 border-2 border-orange-200 shadow-lg">
                  <h3 className="text-xl font-bold text-orange-900 mb-4">
                    Contact Mess Owner
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2 text-orange-800">
                      <Mail className="h-6 w-6 text-orange-600" />
                      <a 
                        href="mailto:usha011993@gmail.com" 
                        className="text-lg font-semibold hover:text-orange-600 underline transition-colors"
                      >
                        usha011993@gmail.com
                      </a>
                    </div>
                    <p className="text-orange-600 text-sm">
                      {true 
                        ? 'For inquiries about meals, subscriptions, tiffin service, or any mess-related questions'
                        : 'जेवण, सबस्क्रिप्शन, टिफिन सेवा किंवा कोणत्याही मेस संबंधित प्रश्नांसाठी'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/signup')}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Join Now
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <ChefHat className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-orange-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div 
              className="flex items-center justify-center space-x-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              <div className="relative h-16 w-16">
                <Image 
                  src="/images/BrandLogo.png" 
                  alt="Om Sai Bhojnalay Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">ओम साई भोजनालय</span>
                <span className="text-sm text-orange-200">The No.1 Mess in Chhatrapati Sambhajinagar</span>
              </div>
            </div>
            
            <p className="text-orange-200 mb-6 text-lg">
              {true 
                ? 'Serving delicious, homely meals with love, hygiene, and tradition'
                : 'प्रेम, स्वच्छता आणि परंपरेसह चवदार, घरगुती जेवण सर्व्ह करत आहोत'
              }
            </p>

            {/* Address Section */}
            <div className="mb-8 pb-8 border-b border-orange-700">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <MapPin className="h-5 w-5 text-orange-300" />
                <h3 className="text-lg font-bold text-orange-100">
                  Visit Us
                </h3>
              </div>
              <div className="text-orange-200 space-y-1">
                <p className="font-semibold">HOTEL OM SAI BHOJNALAYA</p>
                <p className="text-sm">Plot No 9-A, Gut No 3, Martand Nagar, Satara Parisar</p>
                <p className="text-sm">Chhatrapati Sambhajinagar, Ward No 114 (Deolai Satara)</p>
                <p className="text-sm">Aurangabad Municipal Corporation Zone 8</p>
                <p className="text-sm">Aurangabad, Maharashtra - 431001</p>
              </div>
            </div>

            {/* Developer copyright and contact info */}
            <div className="text-orange-300 text-sm space-y-2">
              <div className="text-orange-200 font-medium">© 2025 ओम साई भोजनालय. All rights reserved.</div>
              <div>Developed with ❤️ by MIT students: Pramod Dwarkunde &amp; Mohan Birajdar</div>
              <div className="text-xs flex flex-wrap justify-center gap-2">
                <span>Pramod: <a href="mailto:pramodkd023@gmail.com" className="underline hover:text-white">pramodkd023@gmail.com</a></span>
                <span>•</span>
                <span>Mohan: <a href="mailto:mohanbirajdar@gmail.com" className="underline hover:text-white">mohanbirajdar@gmail.com</a></span>
              </div>

              <div className="pt-4 text-sm text-orange-200 border-t border-orange-700 mt-4">
                <p className="font-medium mb-1">Our Services</p>
                <p className="text-xs">Software Development • Product Design • Custom Software Solutions</p>
                <p className="text-xs">Mobile &amp; Web Apps • Payment Integration • DevOps &amp; Consultancy</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
