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
  id: string;
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
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
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
      return;
    }

    const planPrice = getSelectedPlanPrice();
    if (paymentAmount > planPrice) {
      alert(`Payment amount cannot exceed plan price of ₹${planPrice}`);
      return;
    }

    try {
      const token = session?.access_token;
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

      const data = await resp.json();
      if (!resp.ok) {
        alert('Failed to add member: ' + (data.error || resp.statusText));
        return;
      }

      // Refresh the members list after adding
      await fetchMembers();
      
      // Reset form
      setNewMember({ name: '', email: '', phone: '', parent_mobile: '', plan: 'double_time' });
      setPhotoFile(null);
      setPhotoPreview(null);
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setPaymentAmount(2600);
      setPaymentType('full');
      
      const paymentStatus = paymentAmount === 0 ? 'No payment made' :
                           paymentAmount < planPrice ? `Advance payment of ₹${paymentAmount}. Remaining: ₹${planPrice - paymentAmount}` :
                           'Full payment received';
      
      alert(`Member added successfully!\n\nTemporary password: ${data.tempPassword}\n\nPayment Status: ${paymentStatus}\n\nPlease share the password with the member securely.`);
    } catch (err) {
      console.error('Error adding member:', err);
      alert('An unexpected error occurred while adding member');
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
    if (!selectedMember) return;
    
    // TODO: Implement update API call
    alert('Update member functionality will be implemented');
    setEditMode(false);
  };

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-purple-600 bg-purple-100'; // Purple for advance payment
      default: return 'text-gray-600 bg-gray-100';
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-orange-700">Loading members...</p>
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
        {/* Add New Member Card */}
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
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
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
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-medium text-orange-900">
                        {member.amount ? `₹${member.amount}` : 'N/A'}
                      </div>
                      <div className="text-xs text-orange-500">
                        {member.lastPayment ? `Last: ${new Date(member.lastPayment).toLocaleDateString()}` : 'No payment'}
                      </div>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-orange-200 text-orange-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMember(member);
                          setEditMode(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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
                      await handleAddMember();
                      router.push('/members');
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 h-11"
                  >
                    Add Member
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
                      {selectedMember.status.charAt(0).toUpperCase() + selectedMember.status.slice(1)}
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
                        <p className="mt-1 text-gray-900 font-medium">
                          {new Date(selectedMember.joinDate).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Expiry Date</label>
                        <p className="mt-1 text-gray-900 font-medium">
                          {selectedMember.expiryDate 
                            ? new Date(selectedMember.expiryDate).toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Not set'}
                        </p>
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
                          selectedMember.paymentStatus === 'success' ? 'text-green-600' :
                          selectedMember.paymentStatus === 'due' ? 'text-red-600' :
                          selectedMember.paymentStatus === 'pending' ? 'text-purple-600' :
                          'text-gray-600'
                        }`}>
                          {selectedMember.paymentStatus === 'success' ? 'ACTIVE - PAID' :
                           selectedMember.paymentStatus === 'due' ? 'INACTIVE - UNPAID' :
                           selectedMember.paymentStatus === 'pending' ? 'ADVANCE PAID - NOT SETTLED' :
                           selectedMember.paymentStatus.toUpperCase()}
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
                        <p className="mt-1 text-2xl font-bold text-green-600">
                          ₹{selectedMember.amount || selectedMember.advancePayment || '0'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Total Amount Due</label>
                        <p className="mt-1 text-2xl font-bold text-orange-600">
                          ₹{selectedMember.totalAmountDue || getSelectedPlanPrice()}
                        </p>
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
                          selectedMember.status === 'inactive' ? 'text-red-600' :
                          'text-purple-600'
                        }`}>
                          {selectedMember.status === 'active' ? '✓ ACTIVE' :
                           selectedMember.status === 'inactive' ? '✗ INACTIVE' :
                           '⚡ ADVANCE PAYMENT'}
                        </p>
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
                      <Button
                        onClick={() => setEditMode(true)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 h-11"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
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