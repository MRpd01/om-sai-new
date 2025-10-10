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
    mess_id: '',
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMemberCameraStream(stream);
      setIsMemberCameraOn(true);
      if (memberVideoRef.current) {
        memberVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const captureFromMemberCamera = () => {
    if (memberVideoRef.current && memberCanvasRef.current) {
      const canvas = memberCanvasRef.current;
      const video = memberVideoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'member-photo.jpg', { type: 'image/jpeg' });
          setMemberPhotoFile(file);
          setMemberPhotoPreview(canvas.toDataURL('image/jpeg'));
          closeMemberCamera();
        }
      }, 'image/jpeg');
    }
  };

  const closeMemberCamera = () => {
    if (memberCameraStream) {
      memberCameraStream.getTracks().forEach(track => track.stop());
      setMemberCameraStream(null);
    }
    setIsMemberCameraOn(false);
  };

  const resetMemberForm = () => {
    setNewMemberData({
      full_name: '',
      email: '',
      phone: '',
      mess_id: '',
      plan: 'double_time',
      join_date: new Date().toISOString().split('T')[0]
    });
    setMemberPhotoFile(null);
    setMemberPhotoPreview(null);
    setShowAddMember(false);
    closeMemberCamera();
  };

  const handleAddMember = async () => {
    if (!newMemberData.full_name || !newMemberData.email || !newMemberData.mess_id) {
      alert('Please fill all required fields');
      return;
    }

    setAddingMember(true);
    try {
      // Here you would typically create the member in your database
      // For now, we'll simulate the process
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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-900">MessMate {t('nav.dashboard')}</h1>
                <p className="text-sm text-orange-600 capitalize">{userRole === 'admin' ? t('mess.messOwner') : t('dashboard.members')} Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userRole === 'admin' && (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                    }}
                    className="flex items-center space-x-2"
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
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                {t('dashboard.notifications')}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t('dashboard.settings')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </Button>
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
                    <label className="text-sm text-orange-900">Select Mess</label>
                    <select value={selectedMess || ''} onChange={(e) => setSelectedMess(e.target.value)} className="w-full p-2 border border-orange-200 rounded-md">
                      <option value="">Choose a mess</option>
                      {messes.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

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
                      if (!selectedMess) { alert('Please select a mess'); return; }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-orange-900">Add New Member</h2>
              <Button variant="ghost" onClick={resetMemberForm}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">Member Photo</label>
                <div className="flex flex-col items-center space-y-4">
                  {memberPhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={memberPhotoPreview} 
                        alt="Member preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-orange-200"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 rounded-full w-8 h-8"
                        onClick={() => {
                          setMemberPhotoFile(null);
                          setMemberPhotoPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center border-2 border-dashed border-orange-300">
                      <User className="h-16 w-16 text-orange-400" />
                    </div>
                  )}

                  {isMemberCameraOn ? (
                    <div className="space-y-3">
                      <video 
                        ref={memberVideoRef}
                        autoPlay 
                        playsInline 
                        className="w-64 h-48 bg-gray-800 rounded-lg"
                      />
                      <canvas ref={memberCanvasRef} style={{ display: 'none' }} />
                      <div className="flex space-x-2">
                        <Button onClick={captureFromMemberCamera} className="bg-orange-600">
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button variant="outline" onClick={closeMemberCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={openMemberCamera} variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </Button>
                      <label className="cursor-pointer">
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </span>
                        </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Full Name *</label>
                  <Input 
                    value={newMemberData.full_name}
                    onChange={(e) => setNewMemberData({...newMemberData, full_name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Email *</label>
                  <Input 
                    type="email"
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({...newMemberData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Phone</label>
                  <Input 
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({...newMemberData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Select Mess *</label>
                  <select 
                    value={newMemberData.mess_id} 
                    onChange={(e) => setNewMemberData({...newMemberData, mess_id: e.target.value})} 
                    className="w-full p-2 border border-orange-200 rounded-md"
                  >
                    <option value="">Choose a mess</option>
                    {messes.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-900 mb-1">Subscription Plan</label>
                  <select 
                    value={newMemberData.plan} 
                    onChange={(e) => setNewMemberData({...newMemberData, plan: e.target.value as any})} 
                    className="w-full p-2 border border-orange-200 rounded-md"
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
              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={handleAddMember} 
                  disabled={addingMember}
                  className="bg-orange-600 hover:bg-orange-700 flex-1"
                >
                  {addingMember ? 'Adding Member...' : 'Add Member'}
                </Button>
                <Button variant="outline" onClick={resetMemberForm}>
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