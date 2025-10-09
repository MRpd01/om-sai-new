"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Users, CreditCard, Calendar, Bell, Settings, LogOut, User, Globe, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMesses, createPayment, createMembership } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const router = useRouter();

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

  const userRole = user?.user_metadata?.role || 'user';
  // Subscription state (for users)
  const [messes, setMesses] = useState<any[]>([]);
  const [selectedMess, setSelectedMess] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'double_time' | 'single_time' | 'half_month' | 'full_month'>('double_time');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing, setProcessing] = useState(false);
  const planPrices: Record<string, number> = { double_time: 2600, single_time: 1500, half_month: 1300, full_month: 2600 };

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
    </div>
  );
}