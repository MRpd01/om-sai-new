"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, Users, CreditCard, Calendar, Bell, Settings, LogOut, User, Globe, ChevronDown, Camera, Upload, X, UserPlus, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createPayment, createMembership } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  // Member subscription state
  const [memberSubscription, setMemberSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);
  const [subscriptionMode, setSubscriptionMode] = useState<'payment' | 'request'>('payment'); // payment = pay ₹500+, request = ask admin
  
  // First-time subscription form state (for payment mode)
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: 'double_time' as 'double_time' | 'single_time' | 'half_month' | 'full_month',
    joiningDate: new Date().toISOString().split('T')[0],
    paymentType: 'full' as 'full' | 'advance',
    paymentAmount: 2600
  });

  // Request approval form state (for request mode)
  const [requestForm, setRequestForm] = useState({
    plan: 'double_time' as 'double_time' | 'single_time' | 'half_month' | 'full_month',
    joiningDate: new Date().toISOString().split('T')[0],
    requestMessage: ''
  });
  
  // Subscription state (for users) - simplified for single mess system
  const [selectedPlan, setSelectedPlan] = useState<'double_time' | 'single_time' | 'half_month' | 'full_month'>('double_time');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing, setProcessing] = useState(false);
  
  // Single mess information - hardcoded for ओम साई भोजनालय
  const SINGLE_MESS = {
    id: 'om-sai-bhojanalay',
    name: 'ओम साई भोजनालय',
    name_en: 'Om Sai Bhojnalay',
    address: 'Main Street, City',
    phone: '+91-XXXXXXXXXX'
  };
  
  // Admin member addition state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    full_name: '',
    email: '',
    phone: '',
    plan: 'double_time' as 'double_time' | 'single_time' | 'half_month' | 'full_month',
    join_date: new Date().toISOString().split('T')[0]
  });
  const [memberPhotoFile, setMemberPhotoFile] = useState<File | null>(null);
  const [memberPhotoPreview, setMemberPhotoPreview] = useState<string | null>(null);
  const [isMemberCameraOn, setIsMemberCameraOn] = useState(false);
  const [memberCameraStream, setMemberCameraStream] = useState<MediaStream | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  
  const userRole = user?.user_metadata?.role || 'user';
  const planPrices: Record<string, number> = { 
    double_time: 2600, 
    single_time: 1500, 
    half_month: 1300, 
    full_month: 2600 
  };

  const planLabels: Record<string, string> = {
    double_time: 'Double Time',
    single_time: 'Single Time', 
    half_month: 'Half Month',
    full_month: 'Full Month'
  };

  // Camera refs for member photo
  const memberVideoRef = useRef<HTMLVideoElement>(null);
  const memberCanvasRef = useRef<HTMLCanvasElement>(null);

  // Member photo handling functions
  const handleMemberPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMemberPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setMemberPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openMemberCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 }
        }, 
        audio: false 
      });
      console.log('Camera access granted, setting up stream...');
      setMemberCameraStream(stream);
      setIsMemberCameraOn(true);
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        if (memberVideoRef.current) {
          memberVideoRef.current.srcObject = stream;
          memberVideoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback...');
            memberVideoRef.current?.play().catch(console.error);
          };
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions and ensure you\'re using HTTPS or localhost.');
    }
  };

  const captureFromMemberCamera = () => {
    if (memberVideoRef.current && memberCanvasRef.current) {
      const canvas = memberCanvasRef.current;
      const video = memberVideoRef.current;
      const context = canvas.getContext('2d');
      
      // Wait for video to be ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Camera is not ready yet. Please wait a moment and try again.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        // Clear canvas first
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'member-photo.jpg', { type: 'image/jpeg' });
            setMemberPhotoFile(file);
            setMemberPhotoPreview(canvas.toDataURL('image/jpeg'));
            closeMemberCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    } else {
      alert('Camera not available. Please try opening the camera again.');
    }
  };

  const closeMemberCamera = () => {
    if (memberCameraStream) {
      memberCameraStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setMemberCameraStream(null);
    }
    setIsMemberCameraOn(false);
  };

  const resetMemberForm = () => {
    setNewMemberData({
      full_name: '',
      email: '',
      phone: '',
      plan: 'double_time',
      join_date: new Date().toISOString().split('T')[0]
    });
    setMemberPhotoFile(null);
    setMemberPhotoPreview(null);
    setShowAddMember(false);
    closeMemberCamera();
  };

  const handleAddMember = async () => {
    if (!newMemberData.full_name || !newMemberData.email) {
      alert('Please fill all required fields (Name and Email)');
      return;
    }

    // Use the single mess system
    const defaultMessId = SINGLE_MESS.id;

    setAddingMember(true);
    try {
      // Here you would typically create the member in your database
      // For now, we'll simulate the process
      const memberDataWithMess = { ...newMemberData, mess_id: defaultMessId };
      console.log('Creating member:', memberDataWithMess);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Member added successfully!');
      resetMemberForm();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch member subscription data for regular users
  useEffect(() => {
    const fetchMemberSubscription = async () => {
      if (userRole !== 'user' || !user?.id) {
        setLoadingSubscription(false);
        return;
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('mess_members')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
        } else {
          setMemberSubscription(data);
          // If no subscription exists, show subscribe form
          if (!data) {
            setShowSubscribeForm(true);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchMemberSubscription();
  }, [user, userRole]);

  // Update payment amount when plan changes in subscription form
  useEffect(() => {
    if (showSubscribeForm) {
      const planPrice = planPrices[subscriptionForm.plan];
      setSubscriptionForm(prev => ({
        ...prev,
        paymentAmount: prev.paymentType === 'full' ? planPrice : Math.max(500, prev.paymentAmount)
      }));
    }
  }, [subscriptionForm.plan, subscriptionForm.paymentType, showSubscribeForm]);

  // Note: No need to load messes since we're using a single mess system

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsLanguageDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProcessing(true);
    await signOut();
    // Always redirect even if there's an error (state is cleared)
    router.push('/');
    setProcessing(false);
  };

  const handleFirstTimeSubscription = async () => {
    if (subscriptionMode === 'payment') {
      // PAYMENT MODE - User subscribes with minimum ₹500 payment
      if (subscriptionForm.paymentAmount < 500) {
        alert('Minimum payment amount is ₹500. Please enter at least ₹500.');
        return;
      }

      const planPrice = planPrices[subscriptionForm.plan];
      if (subscriptionForm.paymentAmount > planPrice) {
        alert(`Payment amount cannot exceed plan price of ₹${planPrice}`);
        return;
      }

      setProcessing(true);
      try {
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            email: user?.email,
            plan: subscriptionForm.plan,
            joiningDate: subscriptionForm.joiningDate,
            paymentType: subscriptionForm.paymentType,
            paymentAmount: subscriptionForm.paymentAmount,
            totalAmountDue: planPrice
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create subscription');

        alert('✅ Subscription created successfully!');
        window.location.reload();
        
      } catch (err: any) {
        console.error('Subscription error:', err);
        alert(err.message || 'Failed to create subscription. Please try again.');
      } finally {
        setProcessing(false);
      }

    } else {
      // REQUEST MODE - User requests admin approval (₹0 payment)
      setProcessing(true);
      try {
        const response = await fetch('/api/request-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            userName: user?.user_metadata?.full_name || 'Member',
            userEmail: user?.email,
            userPhone: user?.user_metadata?.phone || null,
            plan: requestForm.plan,
            joiningDate: requestForm.joiningDate,
            message: requestForm.requestMessage || null
          }),
        });

        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text) {
            data = JSON.parse(text);
          } else {
            throw new Error('Empty response from server');
          }
        } else {
          throw new Error('Server returned non-JSON response');
        }

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to send subscription request');
        }

        alert('✅ Subscription request sent successfully!\n\nAdmin will review and approve your request. You will be notified once approved.');
        setShowSubscribeForm(false);
        window.location.reload();
        
      } catch (err: any) {
        console.error('Subscription request error:', err);
        alert(err.message || 'Failed to send subscription request. Please try again.');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-orange-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo and Title */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-orange-900">ओम साई भोजनालय</h1>
                <p className="text-xs text-orange-600 capitalize">{userRole === 'admin' ? 'Admin Portal' : 'Member Portal'}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {userRole === 'admin' && (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                    }}
                    className="flex items-center space-x-2 text-gray-900 hover:text-black hover:bg-orange-50"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{availableLanguages.find(lang => lang.code === language)?.flag}</span>
                    <span>{availableLanguages.find(lang => lang.code === language)?.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  
                  {isLanguageDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-1 z-20 border border-orange-200">
                      {availableLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLanguageDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-2"
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <Button variant="ghost" size="sm" className="text-gray-900 hover:text-black hover:bg-orange-50">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-900 hover:text-black hover:bg-orange-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut} 
                disabled={processing}
                className="text-gray-900 border-gray-300 hover:text-black hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {processing ? 'Signing out...' : 'Logout'}
              </Button>
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-900 hover:text-black hover:bg-orange-50 p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-orange-200 py-3 space-y-2">
              {userRole === 'admin' && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-orange-900 px-2">Language</div>
                  <div className="flex space-x-1">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-2 py-1 rounded text-xs ${
                          language === lang.code 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-900">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-900">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut} 
                disabled={processing}
                className="w-full justify-start text-gray-900 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {processing ? 'Signing out...' : 'Logout'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="border-orange-200 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{t('dashboard.welcome')}!</h2>
                  <p className="text-orange-100">
                    {user.email} • {userRole === 'admin' ? 'Manage Members' : t('dashboard.members')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => {
                const paymentSection = document.getElementById('payment-section');
                paymentSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Now</span>
            </button>
            <button 
              onClick={() => window.location.href = '/menu'}
              className="bg-white text-orange-600 border border-orange-300 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>View Menu</span>
            </button>
            <button className="bg-white text-orange-600 border border-orange-300 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2">
              <User className="h-4 w-4" />
              <span>Update Profile</span>
            </button>
            <button className="bg-white text-orange-600 border border-orange-300 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Contact Admin</span>
            </button>
          </div>
        </div>

        {/* Role-based Dashboard Content */}
        {userRole === 'admin' ? (
          /* Admin Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/members">
              <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900 group-hover:text-orange-700 transition-colors">{t('dashboard.members')}</CardTitle>
                      <CardDescription>View and manage mess members</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">127</div>
                  <p className="text-sm text-orange-700">Active Members</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">{t('dashboard.payments')}</CardTitle>
                    <CardDescription>Track payment collections</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">₹45,000</div>
                <p className="text-sm text-orange-700">This Month</p>
              </CardContent>
            </Card>

            <Link href="/manage-admins">
              <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900 group-hover:text-orange-700 transition-colors">Manage Admins</CardTitle>
                      <CardDescription>Add or remove admin access</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">2</div>
                  <p className="text-sm text-orange-700">Active Admins</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/subscription-requests">
              <Card className="group hover:shadow-lg transition-all duration-300 border-blue-200 hover:border-blue-400 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-900 group-hover:text-blue-700 transition-colors">Subscription Requests</CardTitle>
                      <CardDescription>Approve member subscription requests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">🔔</div>
                  <p className="text-sm text-blue-700">Review pending requests</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">{t('dashboard.notifications')}</CardTitle>
                    <CardDescription>Send alerts to members</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Reports</CardTitle>
                    <CardDescription>View analytics and reports</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        ) : (
          /* User Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Payment Status Card - shows subscription form for first-time users OR current subscription */}
            <Card id="payment-section" className="border-orange-200 md:col-span-2">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">
                      {showSubscribeForm 
                        ? (subscriptionMode === 'payment' ? 'Subscribe to Mess Plan' : 'Request Subscription Approval')
                        : 'Payment Status'
                      }
                    </CardTitle>
                    <CardDescription>
                      {showSubscribeForm 
                        ? (subscriptionMode === 'payment' 
                            ? 'Choose your plan and make payment (₹500 minimum)' 
                            : 'Admin will approve your subscription with ₹0 payment')
                        : 'Your mess subscription details'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-orange-600">Loading...</p>
                  </div>
                ) : showSubscribeForm ? (
                  /* First-time subscription form */
                  <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setSubscriptionMode('payment')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                          subscriptionMode === 'payment'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        💳 Pay & Subscribe (₹500+)
                      </button>
                      <button
                        onClick={() => setSubscriptionMode('request')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                          subscriptionMode === 'request'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        📨 Request Approval (₹0)
                      </button>
                    </div>

                    {subscriptionMode === 'payment' ? (
                      /* PAYMENT MODE - Subscribe with ₹500+ payment */
                      <>
                        {/* Plan Selection */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">Select Plan *</label>
                          <select
                            value={subscriptionForm.plan}
                            onChange={(e) => setSubscriptionForm(prev => ({ 
                              ...prev, 
                              plan: e.target.value as any 
                            }))}
                            className="w-full p-2.5 border border-orange-200 rounded-md focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          >
                            <option value="double_time">Double Time (Breakfast + Dinner) - ₹2600/month</option>
                            <option value="full_month">Full Month (Lunch + Dinner) - ₹2600/month</option>
                            <option value="single_time">Single Time - ₹1500/month</option>
                            <option value="half_month">Half Month (15 Days) - ₹1300</option>
                          </select>
                        </div>

                        {/* Joining Date */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">Joining Date *</label>
                          <Input
                            type="date"
                            value={subscriptionForm.joiningDate}
                            onChange={(e) => setSubscriptionForm(prev => ({ 
                              ...prev, 
                              joiningDate: e.target.value 
                            }))}
                            className="border-orange-200 focus:border-orange-400"
                          />
                        </div>

                        {/* Payment Type */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">Payment Type *</label>
                          <select
                            value={subscriptionForm.paymentType}
                            onChange={(e) => {
                              const type = e.target.value as 'full' | 'advance';
                              const planPrice = planPrices[subscriptionForm.plan];
                              setSubscriptionForm(prev => ({
                                ...prev,
                                paymentType: type,
                                paymentAmount: type === 'full' ? planPrice : 500
                              }));
                            }}
                            className="w-full p-2.5 border border-orange-200 rounded-md focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          >
                            <option value="full">Full Payment</option>
                            <option value="advance">Advance Payment</option>
                          </select>
                        </div>

                        {/* Payment Amount */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">
                            Payment Amount * <span className="text-xs text-red-600">(Minimum ₹500)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-orange-700 font-medium">₹</span>
                            <Input
                              type="number"
                              value={subscriptionForm.paymentAmount}
                              onChange={(e) => {
                                const amount = Number(e.target.value);
                                if (amount >= 500) {
                                  setSubscriptionForm(prev => ({ 
                                    ...prev, 
                                    paymentAmount: amount 
                                  }));
                                }
                              }}
                              min="500"
                              max={planPrices[subscriptionForm.plan]}
                              disabled={subscriptionForm.paymentType === 'full'}
                              className="pl-8 border-orange-200 focus:border-orange-400"
                            />
                          </div>
                          <p className="text-xs text-orange-600 mt-1">
                            {subscriptionForm.paymentType === 'full' 
                              ? `Full payment of ₹${planPrices[subscriptionForm.plan]}`
                              : `Plan total: ₹${planPrices[subscriptionForm.plan]}. Minimum ₹500 advance required.`
                            }
                          </p>
                        </div>

                        {/* Summary */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h4 className="text-sm font-medium text-orange-900 mb-2">Subscription Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700">Plan:</span>
                              <span className="text-sm font-bold text-orange-900">{planLabels[subscriptionForm.plan]}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-orange-700">Total Amount:</span>
                              <span className="text-lg font-bold text-orange-600">₹{planPrices[subscriptionForm.plan]}</span>
                            </div>
                            {subscriptionForm.paymentType === 'advance' && subscriptionForm.paymentAmount < planPrices[subscriptionForm.plan] && (
                              <>
                                <div className="flex justify-between pt-2 border-t border-orange-200">
                                  <span className="text-sm text-purple-700">Paying Now:</span>
                                  <span className="text-lg font-bold text-purple-600">₹{subscriptionForm.paymentAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-red-700">Remaining:</span>
                                  <span className="text-lg font-bold text-red-600">
                                    ₹{planPrices[subscriptionForm.plan] - subscriptionForm.paymentAmount}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Subscribe Button */}
                        <Button
                          onClick={handleFirstTimeSubscription}
                          disabled={processing || subscriptionForm.paymentAmount < 500}
                          className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg"
                        >
                          {processing ? 'Processing...' : `Subscribe Now - Pay ₹${subscriptionForm.paymentAmount}`}
                        </Button>
                      </>
                    ) : (
                      /* REQUEST MODE - Request admin approval (₹0) */
                      <>
                        {/* Plan Selection */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">Select Plan *</label>
                          <select
                            value={requestForm.plan}
                            onChange={(e) => setRequestForm(prev => ({ 
                              ...prev, 
                              plan: e.target.value as any 
                            }))}
                            className="w-full p-2.5 border border-orange-200 rounded-md focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          >
                            <option value="double_time">Double Time (Breakfast + Dinner) - ₹2600/month</option>
                            <option value="full_month">Full Month (Lunch + Dinner) - ₹2600/month</option>
                            <option value="single_time">Single Time - ₹1500/month</option>
                            <option value="half_month">Half Month (15 Days) - ₹1300</option>
                          </select>
                        </div>

                        {/* Joining Date */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">Preferred Joining Date *</label>
                          <Input
                            type="date"
                            value={requestForm.joiningDate}
                            onChange={(e) => setRequestForm(prev => ({ 
                              ...prev, 
                              joiningDate: e.target.value 
                            }))}
                            className="border-orange-200 focus:border-orange-400"
                          />
                        </div>

                        {/* Optional Message to Admin */}
                        <div>
                          <label className="text-sm font-medium text-orange-900 mb-2 block">Message to Admin (Optional)</label>
                          <textarea
                            value={requestForm.requestMessage}
                            onChange={(e) => setRequestForm(prev => ({ 
                              ...prev, 
                              requestMessage: e.target.value 
                            }))}
                            placeholder="Explain why you need admin approval..."
                            rows={3}
                            className="w-full p-2.5 border border-orange-200 rounded-md focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                          <div className="flex items-start space-x-3">
                            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-blue-900 mb-1">How This Works</h4>
                              <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Your request will be sent to the admin</li>
                                <li>• Admin will review and approve your subscription</li>
                                <li>• You will get <strong>FREE access</strong> (₹0 payment required)</li>
                                <li>• You'll be notified once approved</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Request Button */}
                        <Button
                          onClick={handleFirstTimeSubscription}
                          disabled={processing}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 text-lg"
                        >
                          {processing ? 'Sending Request...' : '📨 Send Approval Request to Admin'}
                        </Button>

                        <p className="text-xs text-center text-gray-500">
                          No payment required. Admin will approve with ₹0 fee.
                        </p>
                      </>
                    )}
                  </div>
                ) : memberSubscription ? (
                  <div className="space-y-4">
                    {/* Subscription Info */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-orange-700">Plan</label>
                          <p className="text-sm font-bold text-orange-900 capitalize">
                            {memberSubscription.subscription_type?.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-orange-700">Joining Date</label>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(memberSubscription.joining_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-orange-700">Expiry Date</label>
                          <p className="text-sm font-medium text-gray-900">
                            {memberSubscription.expiry_date 
                              ? new Date(memberSubscription.expiry_date).toLocaleDateString('en-IN')
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-orange-700">Status</label>
                          <p className={`text-sm font-bold ${
                            memberSubscription.payment_status === 'success' ? 'text-green-600' :
                            memberSubscription.payment_status === 'due' ? 'text-red-600' :
                            'text-purple-600'
                          }`}>
                            {memberSubscription.payment_status === 'success' ? '✓ ACTIVE - PAID' :
                             memberSubscription.payment_status === 'due' ? '✗ INACTIVE - UNPAID' :
                             '⚡ ADVANCE PAID - NOT SETTLED'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <label className="text-xs font-medium text-orange-700">Total Amount</label>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{memberSubscription.total_amount_due || 0}
                        </p>
                      </div>
                      
                      {memberSubscription.payment_status === 'pending' && (
                        <>
                          <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <label className="text-xs font-medium text-purple-700">Paid Amount</label>
                            <p className="text-2xl font-bold text-purple-600">
                              ₹{memberSubscription.advance_payment || 0}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-red-200 col-span-2">
                            <label className="text-xs font-medium text-red-700">Remaining Amount</label>
                            <p className="text-3xl font-bold text-red-600">
                              ₹{(memberSubscription.total_amount_due || 0) - (memberSubscription.advance_payment || 0)}
                            </p>
                          </div>
                        </>
                      )}

                      {memberSubscription.payment_status === 'due' && (
                        <div className="bg-white p-4 rounded-lg border border-red-200 col-span-2">
                          <label className="text-xs font-medium text-red-700">Amount Due</label>
                          <p className="text-3xl font-bold text-red-600">
                            ₹{memberSubscription.total_amount_due || 0}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Success message for fully paid */}
                    {memberSubscription.payment_status === 'success' && (
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 text-center mt-4">
                        <p className="text-green-700 font-bold text-lg">✓ Payment Complete</p>
                        <p className="text-sm text-green-600 mt-1">Your subscription is active</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                    <p className="text-orange-600 font-medium text-lg mb-2">No active subscription</p>
                    <p className="text-sm text-gray-600 mb-6">Choose how you want to get started</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => {
                          setSubscriptionMode('payment');
                          setShowSubscribeForm(true);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                      >
                        💳 Pay & Subscribe (₹500+)
                      </Button>
                      <Button
                        onClick={() => {
                          setSubscriptionMode('request');
                          setShowSubscribeForm(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        📨 Request Admin Approval (Free)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Make Payment Card - Only show if user has subscription with pending/due payment */}
            {memberSubscription && (memberSubscription.payment_status === 'pending' || memberSubscription.payment_status === 'due') && (
              <Card className="border-orange-200 md:col-span-2">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900">Make Payment</CardTitle>
                      <CardDescription>Pay your remaining balance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="text-sm font-medium text-orange-900 mb-3">Payment Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">Plan:</span>
                          <span className="text-sm font-bold text-orange-900 capitalize">
                            {memberSubscription.subscription_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-orange-700">Total Amount:</span>
                          <span className="text-lg font-bold text-orange-600">
                            ₹{memberSubscription.total_amount_due || 0}
                          </span>
                        </div>
                        {memberSubscription.payment_status === 'pending' && (
                          <>
                            <div className="flex justify-between pt-2 border-t border-orange-200">
                              <span className="text-sm text-purple-700">Already Paid:</span>
                              <span className="text-lg font-bold text-purple-600">
                                ₹{memberSubscription.advance_payment || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-red-700">Remaining Balance:</span>
                              <span className="text-2xl font-bold text-red-600">
                                ₹{(memberSubscription.total_amount_due || 0) - (memberSubscription.advance_payment || 0)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Amount Input */}
                    <div>
                      <label className="text-sm font-medium text-orange-900 mb-2 block">
                        Payment Amount *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-orange-700 font-medium">₹</span>
                        <Input
                          type="number"
                          value={
                            memberSubscription.payment_status === 'pending'
                              ? (memberSubscription.total_amount_due || 0) - (memberSubscription.advance_payment || 0)
                              : memberSubscription.total_amount_due || 0
                          }
                          disabled
                          className="pl-8 border-orange-200 bg-gray-50 font-bold text-lg"
                        />
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        {memberSubscription.payment_status === 'pending'
                          ? 'Complete your remaining payment'
                          : 'Pay the full amount to activate your subscription'
                        }
                      </p>
                    </div>

                    {/* Payment Method Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Payment via PhonePe</p>
                          <p className="text-xs text-blue-700 mt-1">
                            You will be redirected to PhonePe to complete your payment securely.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pay Now Button */}
                    <Button
                      onClick={async () => {
                        const remainingAmount = memberSubscription.payment_status === 'pending'
                          ? (memberSubscription.total_amount_due || 0) - (memberSubscription.advance_payment || 0)
                          : memberSubscription.total_amount_due || 0;

                        if (remainingAmount <= 0) {
                          alert('No payment due');
                          return;
                        }

                        setProcessing(true);
                        try {
                          const userId = user?.id as string;
                          const userEmail = user?.email || '';
                          const userName = user?.user_metadata?.full_name || 'User';

                          // Create payment order through PhonePe
                          const paymentResponse = await fetch('/api/create-payment', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              amount: remainingAmount,
                              userId: userId,
                              planType: memberSubscription.subscription_type,
                              userEmail: userEmail,
                              userName: userName,
                            }),
                          });

                          const paymentData = await paymentResponse.json();

                          if (paymentData.success && paymentData.paymentUrl) {
                            localStorage.setItem('pendingPayment', JSON.stringify({
                              transactionId: paymentData.transactionId,
                              amount: remainingAmount,
                              planType: memberSubscription.subscription_type,
                              userId: userId
                            }));

                            window.location.href = paymentData.paymentUrl;
                          } else {
                            throw new Error(paymentData.error || 'Failed to create payment');
                          }
                        } catch (err) {
                          console.error('Payment initiation error:', err);
                          alert('Failed to initiate payment. Please try again.');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      disabled={processing}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-14 text-lg font-bold"
                    >
                      {processing ? 'Processing Payment...' : `Pay Now - ₹${
                        memberSubscription.payment_status === 'pending'
                          ? (memberSubscription.total_amount_due || 0) - (memberSubscription.advance_payment || 0)
                          : memberSubscription.total_amount_due || 0
                      }`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Link href="/menu">
              <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900 group-hover:text-orange-700 transition-colors">Today&apos;s Menu</CardTitle>
                      <CardDescription>Check what&apos;s cooking today</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Lunch:</strong> Dal Rice, Sabzi</p>
                    <p className="text-sm"><strong>Dinner:</strong> Roti, Curry</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">My Profile</CardTitle>
                    <CardDescription>Update your information</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Make Payment</CardTitle>
                    <CardDescription>Pay for your mess plan</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Notifications</CardTitle>
                    <CardDescription>View important updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ChefHat className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Feedback</CardTitle>
                    <CardDescription>Share your suggestions</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {userRole === 'admin' ? (
              <>
                <Link href="/members">
                  <Button className="bg-orange-600 hover:bg-orange-700">Add New Member</Button>
                </Link>
                <Link href="/manage-admins">
                  <Button variant="outline" className="border-orange-200 text-orange-600">Manage Admins</Button>
                </Link>
                <Button variant="outline" className="border-orange-200 text-orange-600">Send Notification</Button>
                <Link href="/menu">
                  <Button variant="outline" className="border-orange-200 text-orange-600">Update Menu</Button>
                </Link>
                <Button variant="outline" className="border-orange-200 text-orange-600">View Reports</Button>
              </>
            ) : (
              <>
                <Button className="bg-orange-600 hover:bg-orange-700">Pay Now</Button>
                <Link href="/menu">
                  <Button variant="outline" className="border-orange-200 text-orange-600">View Menu</Button>
                </Link>
                <Button variant="outline" className="border-orange-200 text-orange-600">Update Profile</Button>
                <Button variant="outline" className="border-orange-200 text-orange-600">Contact Admin</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-orange-900">Add New Member</h2>
              <Button variant="ghost" onClick={resetMemberForm} size="sm">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">Member Photo</label>
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  {memberPhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={memberPhotoPreview} 
                        alt="Member preview" 
                        className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-orange-200"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 rounded-full w-6 h-6 sm:w-8 sm:h-8 p-0"
                        onClick={() => {
                          setMemberPhotoFile(null);
                          setMemberPhotoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-orange-100 rounded-full flex items-center justify-center border-2 border-dashed border-orange-300">
                      <User className="h-8 w-8 sm:h-16 sm:w-16 text-orange-400" />
                    </div>
                  )}

                  {isMemberCameraOn ? (
                    <div className="space-y-3 w-full">
                      <video 
                        ref={memberVideoRef}
                        autoPlay 
                        playsInline 
                        muted
                        controls={false}
                        onLoadedMetadata={() => {
                          console.log('Video metadata loaded');
                          if (memberVideoRef.current) {
                            memberVideoRef.current.play().catch(console.error);
                          }
                        }}
                        onCanPlay={() => console.log('Video can play')}
                        onPlay={() => console.log('Video started playing')}
                        onError={(e) => console.error('Video error:', e)}
                        style={{ 
                          objectFit: 'cover',
                          transform: 'scaleX(-1)' // Mirror the video like a selfie
                        }}
                        className="w-full max-w-xs sm:w-64 h-36 sm:h-48 bg-gray-800 rounded-lg mx-auto"
                      />
                      <canvas ref={memberCanvasRef} style={{ display: 'none' }} />
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button onClick={captureFromMemberCamera} className="bg-orange-600 w-full sm:w-auto">
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button variant="outline" onClick={closeMemberCamera} className="w-full sm:w-auto">
                          Cancel
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            console.log('Video element:', memberVideoRef.current);
                            console.log('Stream:', memberCameraStream);
                            console.log('Video dimensions:', memberVideoRef.current?.videoWidth, 'x', memberVideoRef.current?.videoHeight);
                            console.log('Video ready state:', memberVideoRef.current?.readyState);
                          }}
                          className="text-xs"
                        >
                          Debug
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                      <Button onClick={openMemberCamera} variant="outline" className="w-full sm:w-auto">
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </Button>
                      <label className="cursor-pointer w-full sm:w-auto">
                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMemberPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Member Details */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Full Name *</label>
                  <Input 
                    value={newMemberData.full_name}
                    onChange={(e) => setNewMemberData({...newMemberData, full_name: e.target.value})}
                    placeholder="Enter full name"
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Email *</label>
                  <Input 
                    type="email"
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({...newMemberData, email: e.target.value})}
                    placeholder="Enter email address"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Phone</label>
                  <Input 
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({...newMemberData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Subscription Plan</label>
                  <select 
                    value={newMemberData.plan} 
                    onChange={(e) => setNewMemberData({...newMemberData, plan: e.target.value as any})} 
                    className="w-full p-2 text-sm border border-orange-200 rounded-md"
                  >
                    <option value="double_time">Double Time - ₹2600 / month</option>
                    <option value="single_time">Single Time - ₹1500 / month</option>
                    <option value="half_month">Half Month - ₹1300</option>
                    <option value="full_month">Full Month - ₹2600</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Joining Date</label>
                  <Input 
                    type="date" 
                    value={newMemberData.join_date} 
                    onChange={(e) => setNewMemberData({...newMemberData, join_date: e.target.value})} 
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Pricing Display */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Subscription Summary</h3>
                <div className="flex justify-between items-center">
                  <span className="text-orange-700">
                    {newMemberData.plan === 'double_time' && 'Double Time Plan'}
                    {newMemberData.plan === 'single_time' && 'Single Time Plan'}
                    {newMemberData.plan === 'half_month' && 'Half Month Plan'}
                    {newMemberData.plan === 'full_month' && 'Full Month Plan'}
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    ₹{planPrices[newMemberData.plan]}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <Button 
                  onClick={handleAddMember} 
                  disabled={addingMember}
                  className="bg-orange-600 hover:bg-orange-700 w-full sm:flex-1"
                >
                  {addingMember ? 'Adding Member...' : 'Add Member'}
                </Button>
                <Button variant="outline" onClick={resetMemberForm} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}