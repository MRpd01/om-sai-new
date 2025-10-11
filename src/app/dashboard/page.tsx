"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, Users, CreditCard, Calendar, Bell, Settings, LogOut, User, Globe, ChevronDown, Camera, Upload, X, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fetchMesses, createPayment, createMembership } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const router = useRouter();
  
  // Subscription state (for users) - moved before early returns
  const [messes, setMesses] = useState<any[]>([]);
  const [selectedMess, setSelectedMess] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'double_time' | 'single_time' | 'half_month' | 'full_month'>('double_time');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing, setProcessing] = useState(false);
  
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
  const planPrices: Record<string, number> = { double_time: 2600, single_time: 1500, half_month: 1300, full_month: 2600 };

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

    // Auto-assign the default mess (first available mess)
    const defaultMessId = selectedMess || (messes.length > 0 ? messes[0].id : '');
    if (!defaultMessId) {
      alert('No mess available. Please ensure at least one mess is configured.');
      return;
    }

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
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load messes for subscription dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMesses();
        if (!res.error && res.data) {
          setMesses(res.data as any[]);
          if ((res.data as any[]).length > 0) setSelectedMess((res.data as any[])[0].id);
        }
      } catch (err) {
        console.error('Failed to load messes', err);
      }
    })();
  }, []);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsLanguageDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-orange-900">MessMate {t('nav.dashboard')}</h1>
                <p className="text-xs sm:text-sm text-orange-600 capitalize">{userRole === 'admin' ? t('mess.messOwner') : t('dashboard.members')} Portal</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {userRole === 'admin' && (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                    }}
                    className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{availableLanguages.find(lang => lang.code === language)?.flag}</span>
                    <span className="hidden sm:inline">{availableLanguages.find(lang => lang.code === language)?.name}</span>
                    <span className="sm:hidden">{availableLanguages.find(lang => lang.code === language)?.flag}</span>
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
              
              {/* Action Buttons - Stack on mobile, row on desktop */}
              <div className="flex flex-row gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none px-2 sm:px-3">
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline ml-1">{t('dashboard.notifications')}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none px-2 sm:px-3">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline ml-1">{t('dashboard.settings')}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="flex-1 sm:flex-none px-2 sm:px-3">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline ml-1">{t('common.logout')}</span>
                </Button>
              </div>
            </div>
          </div>
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
                    {user.email} • {userRole === 'admin' ? t('mess.messOwner') : t('dashboard.members')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <p className="text-sm text-orange-500">Active Members</p>
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
                <p className="text-sm text-orange-500">This Month</p>
              </CardContent>
            </Card>

            <Link href="/menu">
              <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900 group-hover:text-orange-700 transition-colors">Menu Planning</CardTitle>
                      <CardDescription>Manage weekly menus</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">7</div>
                  <p className="text-sm text-orange-500">Days Planned</p>
                </CardContent>
              </Card>
            </Link>

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
                  <p className="text-sm text-orange-500">Active Admins</p>
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

            {/* Add Member Card */}
            <Card 
              className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400 cursor-pointer"
              onClick={() => setShowAddMember(true)}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <UserPlus className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900 group-hover:text-orange-700 transition-colors">Add New Member</CardTitle>
                    <CardDescription>Add member with subscription & photo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">+</div>
                <p className="text-sm text-orange-500">Click to add member</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* User Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Subscription Card - placed at the start for users */}
            <Card className="border-orange-200">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Subscribe / Update Plan</CardTitle>
                    <CardDescription>Select a mess, plan and joining date</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-orange-900">Plan</label>
                    <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as any)} className="w-full p-2 border border-orange-200 rounded-md">
                      <option value="double_time">Double Time - ₹2600 / month</option>
                      <option value="single_time">Single Time - ₹1500 / month</option>
                      <option value="half_month">Half Month - ₹1300</option>
                      <option value="full_month">Full Month - ₹2600</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-orange-900">Joining Date</label>
                    <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="w-full p-2 border border-orange-200 rounded-md" />
                  </div>

                  <div className="text-lg font-bold text-orange-700">Amount: ₹{planPrices[selectedPlan]}</div>

                  <div className="flex space-x-2">
                    <Button className="bg-orange-600 hover:bg-orange-700" onClick={async () => {
                      if (!selectedMess) { alert('No mess available. Please contact admin.'); return; }
                      setProcessing(true);
                      try {
                        // Simulate payment then create payment & membership
                        const amount = planPrices[selectedPlan];
                        const userId = user?.id as string;
                        const payRes = await createPayment(userId, selectedMess, amount, selectedPlan);
                        if (payRes.error) throw payRes.error;

                        // calculate expiry: if half_month take ~15 days else 30 days
                        const join = new Date(joinDate);
                        const expiry = new Date(join.getTime());
                        if (selectedPlan === 'half_month') expiry.setDate(expiry.getDate() + 15);
                        else expiry.setMonth(expiry.getMonth() + 1);

                        const memRes = await createMembership(userId, selectedMess, selectedPlan, joinDate, expiry.toISOString().split('T')[0]);
                        if (memRes.error) throw memRes.error;

                        alert('Subscription successful!');
                      } catch (err) {
                        console.error(err);
                        alert('Subscription failed (see console)');
                      } finally {
                        setProcessing(false);
                      }
                    }} disabled={processing}>
                      {processing ? 'Processing...' : 'Subscribe'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Payment Status</CardTitle>
                    <CardDescription>Your payment information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Paid</div>
                <p className="text-sm text-orange-500">Valid until Dec 31, 2025</p>
              </CardContent>
            </Card>

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