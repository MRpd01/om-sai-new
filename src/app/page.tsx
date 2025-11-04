"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChefHat, Users, LogIn, UserPlus, ChevronDown, MapPin, Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GoogleMap from "@/components/GoogleMap";

export default function Home() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [language, setLanguage] = useState<'en' | 'mr'>('mr'); // Default to Marathi
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false);
  const [isSignUpDropdownOpen, setIsSignUpDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const content: Record<'en' | 'mr', {
    title: string;
    subtitle: string;
    description: string;
    signIn: string;
    signUp: string;
    memberSignIn: string;
    ownerSignIn: string;
    memberSignUp: string;
    ownerSignUp: string;
    features: string;
    about: string;
    contact: string;
    getStarted: string;
  }> = {
    en: {
      title: "Welcome to OM Sai Bhojnalay",
      subtitle: "Powerful Mess Management for Owners",
      description: "Run your mess like a business — manage subscriptions, staff, menus and payments from a single dashboard. Built for mess owners to simplify operations and grow revenue.",
      signIn: "Sign In",
      signUp: "Sign Up",
      memberSignIn: "Sign In as Member",
      ownerSignIn: "Sign In as Mess Owner",
      memberSignUp: "Join as Member",
      ownerSignUp: "Register as Mess Owner",
      features: "Features",
      about: "About",
      contact: "Contact",
      getStarted: "Get Started Today"
    },
    mr: {
      title: "ओम साई भोजनालयात स्वागत आहे",
      subtitle: "मालकांसाठी सामर्थ्यशाली मेस व्यवस्थापन",
      description: "तुमचे मेस व्यावसायिक दृष्टिकोनातून चालवा — सदस्यता, कर्मचारी, मेनू आणि पेमेंट्स एका डॅशबोर्डवर व्यवस्थापित करा. मेस मालकांसाठी ऑपरेशन्स सुलभ करण्यासाठी आणि महसूल वाढविण्यासाठी तयार केलेले.",
      signIn: "साइन इन",
      signUp: "साइन अप",
      memberSignIn: "सदस्य म्हणून साइन इन",
      ownerSignIn: "मेस मालक म्हणून साइन इन",
      memberSignUp: "सदस्य म्हणून सामील व्हा",
      ownerSignUp: "मेस मालक म्हणून नोंदणी करा",
      features: "वैशिष्ट्ये",
      about: "आमच्याबद्दल",
      contact: "संपर्क",
      getStarted: "आज सुरुवात करा"
    }
  };

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
    <div className="min-h-screen hero-bg relative">
      {/* Background overlay for better text readability - responsive opacity */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/70 via-amber-50/60 to-yellow-50/50 sm:from-orange-50/60 sm:via-amber-50/50 sm:to-yellow-50/40 lg:from-orange-50/50 lg:via-amber-50/40 lg:to-yellow-50/30"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md shadow-sm border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-3 lg:py-4">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 lg:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              <div className="p-1.5 lg:p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">ओम साई भोजनालय</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a href="#features" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {content[language].features}
              </a>
              <a href="#about" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {content[language].about}
              </a>
              <a href="#location" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {language === 'en' ? 'Location' : 'स्थान'}
              </a>
              <a href="#contact" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {content[language].contact}
              </a>

              {/* Language Toggle */}
              <div className="flex items-center space-x-2 bg-orange-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('mr')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'mr' 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  🇮🇳 मराठी
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'en' 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
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
                              {language === 'en' ? 'Dashboard' : 'डॅशबोर्ड'}
                            </div>
                            <div className="text-xs text-orange-600">
                              {language === 'en' ? 'Manage your account' : 'तुमचे खाते व्यवस्थापित करा'}
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
                              {language === 'en' ? 'Profile Settings' : 'प्रोफाइल सेटिंग्ज'}
                            </div>
                            <div className="text-xs text-orange-600">
                              {language === 'en' ? 'Update your information' : 'तुमची माहिती अपडेट करा'}
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
                              {language === 'en' ? 'Menu' : 'मेनू'}
                            </div>
                            <div className="text-xs text-orange-600">
                              {language === 'en' ? 'View today\'s menu' : 'आजचा मेनू पहा'}
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
                              {language === 'en' ? 'Members' : 'सदस्य'}
                            </div>
                            <div className="text-xs text-orange-600">
                              {language === 'en' ? 'View mess members' : 'मेस सदस्य पहा'}
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
                              {language === 'en' ? 'Sign Out' : 'साइन आउट'}
                            </div>
                            <div className="text-xs text-red-600">
                              {language === 'en' ? 'Logout from your account' : 'तुमच्या खात्यातून लॉगआउट करा'}
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
                      {content[language].signIn}
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
                            <div className="font-medium">{content[language].memberSignIn}</div>
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
                            <div className="font-medium">{content[language].ownerSignIn}</div>
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
                      {content[language].signUp}
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
                            <div className="font-medium">{content[language].memberSignUp}</div>
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
                            <div className="font-medium">{content[language].ownerSignUp}</div>
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
                    <span>⭐</span>
                    <span className="font-medium">{content[language].features}</span>
                  </a>
                  <a 
                    href="#about" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <span>ℹ️</span>
                    <span className="font-medium">{content[language].about}</span>
                  </a>
                  <a 
                    href="#location" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{language === 'en' ? 'Location' : 'स्थान'}</span>
                  </a>
                  <a 
                    href="#contact" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <span>📞</span>
                    <span className="font-medium">{content[language].contact}</span>
                  </a>
                </div>

                {/* Language Toggle */}
                <div className="pt-3 border-t border-orange-200">
                  <p className="text-sm font-medium text-orange-700 mb-2">Language / भाषा</p>
                  <div className="flex items-center space-x-2 bg-orange-100 rounded-lg p-1 w-fit">
                    <button
                      onClick={() => setLanguage('mr')}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        language === 'mr' 
                          ? 'bg-orange-600 text-white' 
                          : 'text-orange-600 hover:bg-orange-200'
                      }`}
                    >
                      🇮🇳 मराठी
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        language === 'en' 
                          ? 'bg-orange-600 text-white' 
                          : 'text-orange-600 hover:bg-orange-200'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
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
                              {language === 'en' ? 'Dashboard' : 'डॅशबोर्ड'}
                            </div>
                            <div className="text-xs text-orange-200">
                              {language === 'en' ? 'Manage your account' : 'तुमचे खाते व्यवस्थापित करा'}
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
                              {language === 'en' ? 'Profile Settings' : 'प्रोफाइल सेटिंग्ज'}
                            </div>
                            <div className="text-xs text-orange-600">
                              {language === 'en' ? 'Update your information' : 'तुमची माहिती अपडेट करा'}
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
                              {language === 'en' ? 'Sign Out' : 'साइन आउट'}
                            </div>
                            <div className="text-xs text-red-600">
                              {language === 'en' ? 'Logout from your account' : 'तुमच्या खात्यातून लॉगआउट करा'}
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
                            <div className="font-medium text-orange-900">{content[language].memberSignIn}</div>
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
                            <div className="font-medium text-orange-900">{content[language].ownerSignIn}</div>
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
                            <div className="font-medium">{content[language].memberSignUp}</div>
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
                            <div className="font-medium">{content[language].ownerSignUp}</div>
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
      <main className="flex-1 pt-16 sm:pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="p-4 sm:p-5 lg:p-6 bg-orange-600 rounded-full shadow-lg">
                <ChefHat className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-orange-900 mb-4 sm:mb-6 leading-tight px-2">
              {content[language].title}
            </h1>
            
            <h2 className="text-lg sm:text-xl lg:text-2xl text-orange-700 mb-6 sm:mb-8 max-w-3xl mx-auto font-medium px-4">
              {content[language].subtitle}
            </h2>
            
            <p className="text-base sm:text-lg text-orange-600 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              {content[language].description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              {/* Hide sign-up buttons when user is already signed in */}
              {!loading && !user ? (
                <>
                  <Button
                    onClick={() => router.push('/signup?role=user')}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto sm:min-w-[240px] shadow-lg hover:shadow-xl transition-all"
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                    {content[language].getStarted}
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/signup?role=admin')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto sm:min-w-[240px] shadow-lg hover:shadow-xl transition-all"
                  >
                    <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                    {content[language].ownerSignUp}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard')}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto sm:min-w-[240px] shadow-lg hover:shadow-xl transition-all"
                >
                  {language === 'en' ? 'Go to Dashboard' : 'डॅशबोर्ड वर जा'}
                </Button>
              )}
            </div>

            <div className="mt-6 sm:mt-8">
              <p className="text-orange-500 text-sm px-4">
                {content[language].getStarted}
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
                {language === 'en' ? 'Why Choose OM Sai Bhojnalay?' : 'ओम साई भोजनालयाची निवड का करावी?'}
              </h2>
              <p className="text-xl text-orange-700 max-w-2xl mx-auto">
                {language === 'en' 
                  ? 'Everything you need to manage your mess efficiently'
                  : 'तुमचा मेस कार्यक्षमतेने चालवण्यासाठी आवश्यक असलेली प्रत्येक गोष्ट'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 mb-3">
                  {language === 'en' ? 'Member Management' : 'सदस्य व्यवस्थापन'}
                </h3>
                <p className="text-orange-700">
                  {language === 'en' 
                    ? 'Easy registration, subscription tracking, and member communication'
                    : 'सोपी नोंदणी, सदस्यत्व ट्रॅकिंग आणि सदस्य संवाद'
                  }
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 mb-3">
                  {language === 'en' ? 'Digital Payments' : 'डिजिटल पेमेंट'}
                </h3>
                <p className="text-orange-700">
                  {language === 'en' 
                    ? 'Secure online payments with automatic tracking and receipts'
                    : 'स्वयंचलित ट्रॅकिंग आणि पावत्यांसह सुरक्षित ऑनलाइन पेमेंट'
                  }
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 mb-3">
                  {language === 'en' ? 'Multi-Language Support' : 'बहुभाषिक समर्थन'}
                </h3>
                <p className="text-orange-700">
                  {language === 'en' 
                    ? 'Available in English and Marathi for better accessibility'
                    : 'चांगल्या प्रवेशक्षमतेसाठी इंग्रजी आणि मराठीमध्ये उपलब्ध'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gradient-to-br from-orange-50/90 via-amber-50/90 to-yellow-50/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-8">
                {language === 'en' ? 'About OM Sai Bhojnalay' : 'ओम साई भोजनालयाबद्दल'}
              </h2>
              <div className="max-w-4xl mx-auto text-lg text-orange-700 leading-relaxed">
                <p className="mb-6">
                  {language === 'en' 
                    ? 'Om Sai Bhojnalay is the official digital dashboard for this mess. The site is used by the mess owner to manage day-to-day operations — member subscriptions, menu planning, staff assignments, and payments. This dashboard reflects live data for this mess only.'
                    : 'ओम साई भोजनालय हा या मेससाठी अधिकृत डिजिटल डॅशबोर्ड आहे. हा साइट मेस मालकाद्वारे दैनंदिन ऑपरेशन्स — सदस्यता, मेनू नियोजन, कर्मचारी नेमणूक आणि पेमेंट्स व्यवस्थापित करण्यासाठी वापरला जातो. हा डॅशबोर्ड फक्त या मेसचे प्रत्यक्ष डेटा दर्शवितो.'
                  }
                </p>
                <p>
                  {language === 'en' 
                    ? 'All features are configured and maintained by the mess owner. Members can view menus and manage subscriptions as provided by the owner. For support or inquiries about this mess, please use the contact details in the footer.'
                    : 'सर्व वैशिष्ट्ये मेस मालकाद्वारे कॉन्फिगर आणि व्यवस्थापित केली जातात. सदस्य मालकाद्वारे उपलब्ध केलेल्या मेनू पाहू शकतात आणि सदस्यत्व व्यवस्थापित करू शकतात. या मेसबद्दल मदत किंवा चौकशीसाठी कृपया फूटर्समध्ये दिलेले संपर्क तपशील वापरा.'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section id="location" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
                {language === 'en' ? 'Find Our Mess' : 'आमचा मेस शोधा'}
              </h2>
              <p className="text-xl text-orange-700 max-w-2xl mx-auto mb-8">
                {language === 'en' 
                  ? 'Conveniently located for easy access. Visit us today!'
                  : 'सोप्या प्रवेशासाठी सोयीस्कर ठिकाणी स्थित. आज आम्हाला भेट द्या!'
                }
              </p>
              <div className="flex items-center justify-center space-x-2 text-orange-600 mb-8">
                <MapPin className="h-5 w-5" />
                <span className="text-lg font-medium">
                  {language === 'en' ? 'Live Location' : 'थेट स्थान'}
                </span>
              </div>
            </div>
            
            {/* Google Map */}
            <div className="max-w-4xl mx-auto">
              <GoogleMap className="w-full h-96 md:h-[500px]" />
            </div>
            
            <div className="text-center mt-8">
              <p className="text-orange-600 text-sm">
                {language === 'en' 
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
                {language === 'en' ? 'Get In Touch' : 'संपर्कात रहा'}
              </h2>
              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-orange-700 mb-8">
                  {language === 'en' 
                    ? 'Ready to transform your mess management? Get started today or contact us for more information.'
                    : 'तुमच्या मेस व्यवस्थापनात बदल करण्यास तयार आहात? आज सुरुवात करा किंवा अधिक माहितीसाठी आमच्याशी संपर्क साधा.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/signup')}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {language === 'en' ? 'Get Started Now' : 'आता सुरुवात करा'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                  >
                    {language === 'en' ? 'Contact Support' : 'सपोर्टशी संपर्क साधा'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-orange-900 text-orange-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div 
              className="flex items-center justify-center space-x-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ओम साई भोजनालय</span>
            </div>
            <p className="text-orange-200 mb-4">
              {language === 'en' 
                ? 'Your trusted partner for mess management solutions'
                : 'मेस व्यवस्थापन समाधानांसाठी तुमचा विश्वसनीय भागीदार'
              }
            </p>

            {/* New copyright and contact info */}
            <div className="text-orange-300 text-sm space-y-1">
              <div>© 2025 ओम साई भोजनालय. All rights reserved.</div>
              <div>Developed by MIT students: Pramod Dwarkunde &amp; Mohan Birajdar</div>
              <div className="text-xs">
                Pramod: <a href="mailto:pramodkd023@gmail.com" className="underline hover:text-white">pramodkd023@gmail.com</a> • Mohan: <a href="mailto:mohanbirajdar@gmail.com" className="underline hover:text-white">mohanbirajdar@gmail.com</a>
              </div>

              <div className="pt-2 text-sm text-orange-200">
                Services: Software development, Product design, Custom software solutions, Mobile &amp; Web apps, Payment integration, DevOps &amp; Consultancy
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
