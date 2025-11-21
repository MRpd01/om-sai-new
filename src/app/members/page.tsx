"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Edit, Trash2, ArrowLeft, Mail, Phone, Calendar, User, Filter, Download } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type SubscriptionType = 'full_month' | 'half_month' | 'single_morning' | 'single_evening' | 'double_time';
type PaymentStatus = 'success' | 'due' | 'pending' | 'failed';

interface Member {
  id: string; // mess_members.id (membership ID)
  userId: string; // users.id (user ID)
  name: string;
  email: string | null;
  phone: string | null;
  parent_mobile: string | null;
  photo_url: string | null;
  joinDate: string;
  expiryDate: string | null;
  status: 'active' | 'inactive' | 'pending';
  plan: SubscriptionType;
  paymentStatus: PaymentStatus;
  lastPayment: string | null;
  amount: number | null;
  advancePayment?: number;
  totalAmountDue?: number;
  remainingAmount?: number;
}

const subscriptionOptions: Array<{ value: SubscriptionType; label: string; price: number }> = [
  { value: 'full_month', label: 'Full Month (Lunch + Dinner)', price: 2600 },
  { value: 'half_month', label: 'Half Month (15 Days)', price: 1300 },
  { value: 'single_morning', label: 'Single Time - Morning', price: 800 },
  { value: 'single_evening', label: 'Single Time - Evening', price: 800 },
  { value: 'double_time', label: 'Double Time (Breakfast + Dinner)', price: 2600 },
];

const planLabels: Record<SubscriptionType, string> = {
  full_month: 'Full Month',
  half_month: 'Half Month',
  single_morning: 'Single Morning',
  single_evening: 'Single Evening',
  double_time: 'Double Time',
};

function MembersContent() {
  const { user, session, loading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  
  const userRole = user?.user_metadata?.role || 'user';
  const isOwner = userRole === 'admin' && (user?.user_metadata?.sub_role === 'owner' || !user?.user_metadata?.sub_role);
  const isSubAdmin = userRole === 'admin' && user?.user_metadata?.sub_role === 'sub_admin';

  // Redirect non-admin users early - BEFORE other hooks
  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      router.push('/dashboard');
    }
  }, [userRole, loading, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionType>('all');
  
  // Check if in manage mode (password-protected access for add/edit operations)
  const isManageMode = searchParams?.get('manage') === 'true';
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(2600);
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    parent_mobile: '',
    plan: 'double_time' as SubscriptionType
  });

  // Fetch members from API
  const fetchMembers = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoadingMembers(true);
    try {
      const resp = await fetch('/api/members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setMembers(data.members || []);
      } else {
        console.error('Failed to load members:', data.error);
        alert('Failed to load members: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      alert('Error fetching members. Please try again.');
    } finally {
      setLoadingMembers(false);
    }
  }, [session?.access_token]);

  // Load members on mount
  useEffect(() => {
    if (session?.access_token) {
      fetchMembers();
    }
  }, [session?.access_token, fetchMembers]);

  // Open / close Add Member modal based on `?add=1` query param
  useEffect(() => {
    const shouldOpen = searchParams?.get('add') === '1';
    setIsAddingMember(shouldOpen);
  }, [searchParams]);

  // Apply status filter from URL on mount and whenever searchParams change
  useEffect(() => {
    const statusFromUrl = searchParams?.get('status') as 'active' | 'inactive' | 'pending' | null;
    if (statusFromUrl && ['active', 'inactive', 'pending'].includes(statusFromUrl)) {
      setStatusFilter(statusFromUrl);
      console.log('📊 Filtering members by status:', statusFromUrl);
    } else if (!statusFromUrl) {
      setStatusFilter('all');
    }
  }, [searchParams]);

  // Filter members based on search and filters
  useEffect(() => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.phone && member.phone.includes(searchTerm))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(member => member.plan === planFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter, planFilter]);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.phone) {
      alert('Please fill in all required fields');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      alert('Please enter a valid email address');
      return false;
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newMember.phone.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit phone number');
      return false;
    }

    const planPrice = getSelectedPlanPrice();
    if (paymentAmount > planPrice) {
      alert(`Payment amount cannot exceed plan price of ₹${planPrice}`);
      return false;
    }

    if (!session?.access_token) {
      alert('You are not logged in. Please log in and try again.');
      return false;
    }

    setAddingMember(true);
    try {
      const token = session?.access_token;
      
      console.log('📤 Sending request to add member...');
      console.log('Member details:', { name: newMember.name, email: newMember.email, phone: newMember.phone, plan: newMember.plan });
      
      const resp = await fetch('/api/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newMember.name, 
          email: newMember.email, 
          phone: newMember.phone,
          parent_mobile: newMember.parent_mobile || null,
          plan: newMember.plan,
          joiningDate: joiningDate,
          photoBase64: photoPreview,
          paymentAmount: paymentAmount,
          paymentType: paymentType,
          totalAmountDue: planPrice
        })
      });

      console.log('📥 Response status:', resp.status);
      const data = await resp.json();
      console.log('📥 Response data:', data);
      
      if (!resp.ok) {
        const errorMsg = data.error || resp.statusText || 'Unknown error';
        console.error('❌ API Error:', errorMsg);
        alert('Failed to add member: ' + errorMsg);
        return false;
      }

      // Refresh the members list after adding
      await fetchMembers();
      
      const paymentStatus = paymentAmount === 0 ? 'No payment made' :
                           paymentAmount < planPrice ? `Advance payment of ₹${paymentAmount}. Remaining: ₹${planPrice - paymentAmount}` :
                           'Full payment received';
      
      alert(`✅ Member added successfully!\n\n🔐 Login Credentials:\nEmail: ${newMember.email}\nPassword: ${data.tempPassword}\n\n💰 Payment Status: ${paymentStatus}\n\n⚠️ Please share these credentials with the member securely.`);
      
      // Reset form after successful addition
      setNewMember({ name: '', email: '', phone: '', parent_mobile: '', plan: 'double_time' });
      setPhotoFile(null);
      setPhotoPreview(null);
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setPaymentAmount(2600);
      setPaymentType('full');
      setIsAddingMember(false);
      
      return true;
    } catch (err: any) {
      console.error('❌ Error adding member:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      alert(`Failed to add member: ${errorMessage}\n\nPlease check:\n- Your internet connection\n- Browser console for detailed error logs\n- Server is running on http://localhost:3000`);
      return false;
    } finally {
      setAddingMember(false);
    }
  };

  const handlePhotoCapture = () => {
    // Open camera (to be implemented with proper camera component)
    alert('Camera feature coming soon!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSelectedPlanPrice = () => {
    const selected = subscriptionOptions.find(opt => opt.value === newMember.plan);
    return selected?.price || 0;
  };

  const getSelectedPlanLabel = () => {
    const selected = subscriptionOptions.find(opt => opt.value === newMember.plan);
    return selected?.label.split(' (')[0] || 'Plan';
  };

  // Update payment amount when plan changes
  useEffect(() => {
    const planPrice = getSelectedPlanPrice();
    setPaymentAmount(planPrice);
  }, [newMember.plan]);

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setIsViewingProfile(true);
    setEditMode(false);
  };

  const handleUpdateMember = async () => {
    if (!selectedMember || !session?.access_token) return;
    
    try {
      const response = await fetch('/api/update-member', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          userId: selectedMember.userId,
          name: selectedMember.name,
          email: selectedMember.email,
          phone: selectedMember.phone,
          parent_mobile: selectedMember.parent_mobile,
          plan: selectedMember.plan,
          joinDate: selectedMember.joinDate,
          expiryDate: selectedMember.expiryDate,
          advancePayment: selectedMember.advancePayment || selectedMember.amount || 0,
          totalAmountDue: selectedMember.totalAmountDue || 0
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member');
      }

      alert(`✅ Member updated successfully!\n\nPayment Status: ${data.paymentStatus}\nRemaining Amount: ₹${data.remainingAmount || 0}`);
      setEditMode(false);
      
      // Refresh members list
      await fetchMembers();
    } catch (error: any) {
      console.error('Error updating member:', error);
      alert('Failed to update member: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-purple-600 bg-purple-100'; // Purple for advance payment
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'Active (Fully Paid)';
      case 'inactive': return 'Inactive (Expired/Unpaid)';
      case 'pending': return 'Partially Active (Advance Paid)';
      default: return 'Unknown';
    }
  };

  const getPlanColor = (plan: SubscriptionType) => {
    switch (plan) {
      case 'full_month': return 'text-blue-600 bg-blue-100';
      case 'half_month': return 'text-purple-600 bg-purple-100';
      case 'double_time': return 'text-orange-600 bg-orange-100';
      case 'single_morning': return 'text-green-600 bg-green-100';
      case 'single_evening': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || loadingMembers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Skeleton Header */}
        <div className="bg-white shadow-sm border-b border-orange-200 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="skeleton h-10 w-10 rounded-full"></div>
              <div className="skeleton h-8 w-48"></div>
            </div>
            <div className="skeleton h-10 w-32"></div>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton Search Bar */}
          <div className="mb-6 flex gap-4">
            <div className="skeleton h-10 flex-1"></div>
            <div className="skeleton h-10 w-32"></div>
            <div className="skeleton h-10 w-32"></div>
          </div>

          {/* Skeleton Member Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-orange-100 p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="skeleton h-16 w-16 rounded-full"></div>
                  <div className="flex-1">
                    <div className="skeleton h-5 w-32 mb-2"></div>
                    <div className="skeleton h-4 w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-4 w-5/6"></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="skeleton h-8 flex-1"></div>
                  <div className="skeleton h-8 w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Redirect non-admin users
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-orange-700">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div 
                className="p-2 bg-orange-600 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push('/')}
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-orange-900">
                  {language === 'en' ? 'Member Management' : 'सदस्य व्यवस्थापन'}
                </h1>
                <p className="text-xs sm:text-sm text-orange-600">Manage mess members and subscriptions</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button variant="outline" className="border-orange-200 text-orange-600">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Manage mode banner for owners */}
        {isOwner && isManageMode && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">
                  🔓 Full Access Mode - You can add, edit, and delete members
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View-only mode banner for owners not in manage mode */}
        {isOwner && !isManageMode && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 font-medium">
                  👁️ View-Only Mode - To add or edit members, use the "Manage Members" option from dashboard
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Read-only banner for sub-admins */}
        {isSubAdmin && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  👁️ Read-Only Access - You can view member details but cannot add or edit members
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add New Member Card - Only for owners in manage mode */}
        {isOwner && isManageMode && (
          <Card 
            className="border-orange-200 mb-8 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/members?add=1')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900">
                      {language === 'en' ? 'Add New Member' : 'नवीन सदस्य जोडा'}
                    </h3>
                    <p className="text-sm text-orange-600">
                      {language === 'en' ? 'Add member with subscription & photo' : 'सदस्य सबस्क्रिप्शन आणि फोटो सह जोडा'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-orange-600">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {language === 'en' ? 'Click to add member' : 'सदस्य जोडण्यासाठी क्लिक करा'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

  {/* Open modal when ?add=1 present - handled in effect below */}
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {members.filter(m => m.status === 'active').length}
                  </div>
                  <p className="text-sm text-green-500">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {members.filter(m => m.status === 'pending').length}
                  </div>
                  <p className="text-sm text-yellow-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <User className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {members.filter(m => m.status === 'inactive').length}
                  </div>
                  <p className="text-sm text-red-500">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{members.length}</div>
                  <p className="text-sm text-orange-500">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-orange-200 mb-6">
          <CardContent className="p-6">
            {/* Active Filter Badge */}
            {statusFilter !== 'all' && (
              <div className="mb-4 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Filtering by: <span className="capitalize font-bold">{statusFilter}</span> members
                  </span>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    router.push('/members');
                  }}
                  className="text-xs text-orange-600 hover:text-orange-800 underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    placeholder="Search members by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-orange-200 rounded-md focus:border-orange-400"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="px-3 py-2 border border-orange-200 rounded-md focus:border-orange-400"
                >
                  <option value="all">All Plans</option>
                  {subscriptionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{planLabels[opt.value]}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">Members List</CardTitle>
            <CardDescription>
              Showing {filteredMembers.length} of {members.length} members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                <p className="text-orange-600 font-medium">No members found</p>
                <p className="text-sm text-orange-500 mt-2">
                  {members.length === 0 
                    ? 'Add your first member to get started' 
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-orange-50 rounded-lg space-y-3 md:space-y-0 cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => handleViewMember(member)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden">
                        {member.photo_url ? (
                          <img 
                            src={member.photo_url} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-orange-900 truncate">{member.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-orange-600 mt-1">
                        {member.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {getStatusLabel(member.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(member.plan)}`}>
                        {planLabels[member.plan]}
                      </span>
                      {/* Payment Status Badge */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.paymentStatus === 'success' ? 'bg-green-100 text-green-700' :
                        member.paymentStatus === 'due' ? 'bg-red-100 text-red-700' :
                        member.paymentStatus === 'pending' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.paymentStatus === 'success' ? '✓ Paid' :
                         member.paymentStatus === 'due' ? '✗ Unpaid' :
                         member.paymentStatus === 'pending' ? '⚡ Advance' :
                         'Unknown'}
                      </span>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      {isOwner && isManageMode && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                              handleDeleteMember(member.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      {isSubAdmin && (
                        <span className="text-xs text-gray-500 px-2 py-1">View Only</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Add Member Modal */}
        {isAddingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="relative">
                <button
                  onClick={() => {
                    setIsAddingMember(false);
                    setNewMember({ name: '', email: '', phone: '', parent_mobile: '', plan: 'double_time' });
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    router.push('/members');
                  }}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
                <CardTitle className="text-orange-900 text-xl">Add New Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Member Photo */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-2 block">Member Photo</label>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-16 w-16 text-orange-400" />
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-orange-200 text-orange-600"
                        onClick={handlePhotoCapture}
                        suppressHydrationWarning
                      >
                        <span className="mr-2">📷</span>
                        Camera
                      </Button>
                      <label className="cursor-pointer">
                        <Button
                          type="button"
                          variant="default"
                          className="bg-orange-900 hover:bg-orange-800"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          suppressHydrationWarning
                        >
                          <span className="mr-2">⬆</span>
                          Upload
                        </Button>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Enter full name"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="Enter email address"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* Parent Mobile */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">
                    Parent Mobile Number
                  </label>
                  <Input
                    type="tel"
                    value={newMember.parent_mobile}
                    onChange={(e) => setNewMember({ ...newMember, parent_mobile: e.target.value })}
                    placeholder="Enter parent/guardian mobile number (optional)"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* Subscription Plan */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">Subscription Plan</label>
                  <select
                    value={newMember.plan}
                    onChange={(e) => setNewMember({ ...newMember, plan: e.target.value as SubscriptionType })}
                    className="w-full p-2.5 border border-orange-200 rounded-md focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    {subscriptionOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - ₹{opt.price} / month
                      </option>
                    ))}
                  </select>
                </div>

                {/* Joining Date */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">Joining Date</label>
                  <Input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                {/* Payment Type */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => {
                      setPaymentType(e.target.value as 'full' | 'advance');
                      if (e.target.value === 'full') {
                        setPaymentAmount(getSelectedPlanPrice());
                      }
                    }}
                    className="w-full p-2.5 border border-orange-200 rounded-md focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="full">Full Payment</option>
                    <option value="advance">Advance Payment</option>
                  </select>
                </div>

                {/* Amount Paying */}
                <div>
                  <label className="text-sm font-medium text-orange-900 mb-1 block">
                    Amount Paying <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-orange-700 font-medium">₹</span>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      placeholder="Enter amount"
                      min="0"
                      max={getSelectedPlanPrice()}
                      disabled={paymentType === 'full'}
                      className="pl-8 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {paymentType === 'full' 
                      ? `Full payment of ₹${getSelectedPlanPrice()}`
                      : `Standard amount: ₹${getSelectedPlanPrice()}. Enter advance amount.`
                    }
                  </p>
                </div>

                {/* Subscription Summary */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-900 mb-2">Subscription Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700">{getSelectedPlanLabel()}</span>
                      <span className="text-xl font-bold text-orange-600">₹{getSelectedPlanPrice()}</span>
                    </div>
                    {paymentType === 'advance' && paymentAmount < getSelectedPlanPrice() && (
                      <>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-orange-200">
                          <span className="text-orange-700">Amount Paying</span>
                          <span className="font-bold text-purple-600">₹{paymentAmount}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-700">Remaining Amount</span>
                          <span className="font-bold text-red-600">₹{getSelectedPlanPrice() - paymentAmount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={async () => {
                      const success = await handleAddMember();
                      if (success) {
                        router.push('/members');
                      }
                    }}
                    disabled={addingMember}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingMember ? 'Adding Member...' : 'Add Member'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingMember(false);
                      setNewMember({ name: '', email: '', phone: '', parent_mobile: '', plan: 'double_time' });
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      router.push('/members');
                    }}
                    variant="outline"
                    className="flex-1 border-orange-200 text-orange-600 h-11"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Member Profile View Modal */}
        {isViewingProfile && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="relative border-b border-orange-200">
                <button
                  onClick={() => {
                    setIsViewingProfile(false);
                    setSelectedMember(null);
                    setEditMode(false);
                  }}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
                <CardTitle className="text-orange-900 text-xl">
                  {editMode ? 'Edit Member Profile' : 'Member Profile'}
                  {isSubAdmin && <span className="text-sm font-normal text-yellow-600 ml-2">(Read-Only)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Profile Header with Photo */}
                <div className="flex flex-col items-center space-y-4 pb-6 border-b border-orange-200">
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-orange-200">
                    {selectedMember.photo_url ? (
                      <img 
                        src={selectedMember.photo_url} 
                        alt={selectedMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-5xl font-bold">
                        {selectedMember.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-orange-900">{selectedMember.name}</h2>
                    <p className="text-orange-600">{selectedMember.email || 'No email'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedMember.status)}`}>
                      {getStatusLabel(selectedMember.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(selectedMember.plan)}`}>
                      {planLabels[selectedMember.plan]}
                    </span>
                  </div>
                </div>

                {/* Member Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                      <Phone className="h-5 w-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-orange-700">Phone Number</label>
                        {editMode ? (
                          <Input
                            value={selectedMember.phone || ''}
                            onChange={(e) => setSelectedMember({ ...selectedMember, phone: e.target.value })}
                            className="mt-1 border-orange-200"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{selectedMember.phone || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Email Address</label>
                        {editMode ? (
                          <Input
                            type="email"
                            value={selectedMember.email || ''}
                            onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                            className="mt-1 border-orange-200"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{selectedMember.email || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Parent/Guardian Mobile</label>
                        {editMode ? (
                          <Input
                            type="tel"
                            value={selectedMember.parent_mobile || ''}
                            onChange={(e) => setSelectedMember({ ...selectedMember, parent_mobile: e.target.value })}
                            className="mt-1 border-orange-200"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{selectedMember.parent_mobile || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Subscription Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-orange-700">Subscription Plan</label>
                        {editMode ? (
                          <select
                            value={selectedMember.plan}
                            onChange={(e) => setSelectedMember({ ...selectedMember, plan: e.target.value as SubscriptionType })}
                            className="w-full mt-1 p-2.5 border border-orange-200 rounded-md"
                          >
                            {subscriptionOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label} - ₹{opt.price}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">{planLabels[selectedMember.plan]}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Joining Date</label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={selectedMember.joinDate}
                            onChange={(e) => setSelectedMember({ ...selectedMember, joinDate: e.target.value })}
                            className="mt-1 border-orange-200"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {new Date(selectedMember.joinDate).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Expiry Date</label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={selectedMember.expiryDate || ''}
                            onChange={(e) => setSelectedMember({ ...selectedMember, expiryDate: e.target.value })}
                            className="mt-1 border-orange-200"
                          />
                        ) : (
                          <p className="mt-1 text-gray-900 font-medium">
                            {selectedMember.expiryDate 
                              ? new Date(selectedMember.expiryDate).toLocaleDateString('en-IN', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4 pt-4 border-t border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Payment Information
                  </h3>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-orange-700">Payment Status</label>
                        <p className={`mt-1 font-semibold ${
                          selectedMember.status === 'active' ? 'text-green-600' :
                          selectedMember.status === 'pending' ? 'text-purple-600' :
                          'text-red-600'
                        }`}>
                          {selectedMember.status === 'active' ? 'ACTIVE - PAID' :
                           selectedMember.status === 'pending' ? 'PARTIALLY ACTIVE - ADVANCE PAID' :
                           'INACTIVE'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Last Payment</label>
                        <p className="mt-1 font-medium text-gray-900">
                          {selectedMember.lastPayment 
                            ? new Date(selectedMember.lastPayment).toLocaleDateString('en-IN')
                            : 'No payment yet'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Amount Paid</label>
                        {editMode ? (
                          <Input
                            type="number"
                            value={selectedMember.advancePayment || selectedMember.amount || 0}
                            onChange={(e) => {
                              const newAdvancePayment = Number(e.target.value);
                              const totalDue = selectedMember.totalAmountDue || getSelectedPlanPrice();
                              const remaining = totalDue - newAdvancePayment;
                              setSelectedMember({ 
                                ...selectedMember, 
                                advancePayment: newAdvancePayment,
                                amount: newAdvancePayment,
                                remainingAmount: remaining > 0 ? remaining : 0
                              });
                            }}
                            className="mt-1 border-orange-200 text-green-600 font-bold text-xl"
                            min="0"
                          />
                        ) : (
                          <p className="mt-1 text-2xl font-bold text-green-600">
                            ₹{selectedMember.amount || selectedMember.advancePayment || '0'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Total Amount Due</label>
                        {editMode ? (
                          <Input
                            type="number"
                            value={selectedMember.totalAmountDue || getSelectedPlanPrice()}
                            onChange={(e) => {
                              const newTotalDue = Number(e.target.value);
                              const advancePaid = selectedMember.advancePayment || selectedMember.amount || 0;
                              const remaining = newTotalDue - advancePaid;
                              setSelectedMember({ 
                                ...selectedMember, 
                                totalAmountDue: newTotalDue,
                                remainingAmount: remaining > 0 ? remaining : 0
                              });
                            }}
                            className="mt-1 border-orange-200 text-orange-600 font-bold text-xl"
                            min="0"
                          />
                        ) : (
                          <p className="mt-1 text-2xl font-bold text-orange-600">
                            ₹{selectedMember.totalAmountDue || getSelectedPlanPrice()}
                          </p>
                        )}
                      </div>
                      {selectedMember.paymentStatus === 'pending' && selectedMember.remainingAmount && selectedMember.remainingAmount > 0 && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-orange-700">Advance Payment</label>
                            <p className="mt-1 text-xl font-bold text-purple-600">
                              ₹{selectedMember.advancePayment || selectedMember.amount || '0'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-orange-700">Remaining Amount</label>
                            <p className="mt-1 text-xl font-bold text-red-600">
                              ₹{selectedMember.remainingAmount}
                            </p>
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-orange-700">Member Status</label>
                        <p className={`mt-1 font-bold text-lg ${
                          selectedMember.status === 'active' ? 'text-green-600' :
                          selectedMember.status === 'pending' ? 'text-purple-600' :
                          'text-red-600'
                        }`}>
                          {selectedMember.status === 'active' ? '✓ ACTIVE' :
                           selectedMember.status === 'pending' ? '⚡ PARTIALLY ACTIVE' :
                           '✗ INACTIVE'}
                        </p>
                        {selectedMember.status === 'inactive' && selectedMember.expiryDate && (
                          <p className="text-xs text-red-500 mt-1">
                            {new Date(selectedMember.expiryDate) < new Date() 
                              ? `Expired on ${new Date(selectedMember.expiryDate).toLocaleDateString('en-IN')}`
                              : 'No payment made'}
                          </p>
                        )}
                        {selectedMember.status === 'pending' && selectedMember.remainingAmount && selectedMember.remainingAmount > 0 && (
                          <p className="text-xs text-purple-500 mt-1">
                            Remaining: ₹{selectedMember.remainingAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t border-orange-200">
                  {editMode ? (
                    <>
                      <Button
                        onClick={handleUpdateMember}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 h-11"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setEditMode(false)}
                        variant="outline"
                        className="flex-1 border-orange-200 text-orange-600 h-11"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {isOwner && isManageMode && (
                        <Button
                          onClick={() => setEditMode(true)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 h-11"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setIsViewingProfile(false);
                          setSelectedMember(null);
                        }}
                        variant="outline"
                        className="flex-1 border-orange-200 text-orange-600 h-11"
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-orange-700">Loading members...</p>
        </div>
      </div>
    }>
      <MembersContent />
    </Suspense>
  );
}