"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Edit, Trash2, ArrowLeft, Mail, Phone, Calendar, User, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  plan: 'basic' | 'premium' | 'vip';
  lastPayment: string;
  amount: number;
}

export default function MembersPage() {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'premium' | 'vip'>('all');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'basic' as const
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockMembers: Member[] = [
      {
        id: '1',
        name: 'राहुल शर्मा',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        joinDate: '2024-01-15',
        status: 'active',
        plan: 'premium',
        lastPayment: '2024-11-01',
        amount: 3500
      },
      {
        id: '2',
        name: 'प्रिया पटेल',
        email: 'priya.patel@example.com',
        phone: '+91 87654 32109',
        joinDate: '2024-02-20',
        status: 'active',
        plan: 'basic',
        lastPayment: '2024-11-01',
        amount: 2500
      },
      {
        id: '3',
        name: 'अमित गुप्ता',
        email: 'amit.gupta@example.com',
        phone: '+91 76543 21098',
        joinDate: '2024-03-10',
        status: 'pending',
        plan: 'vip',
        lastPayment: '2024-10-15',
        amount: 5000
      },
      {
        id: '4',
        name: 'स्नेहा देशमुख',
        email: 'sneha.deshmukh@example.com',
        phone: '+91 65432 10987',
        joinDate: '2024-04-05',
        status: 'inactive',
        plan: 'basic',
        lastPayment: '2024-09-01',
        amount: 2500
      },
      {
        id: '5',
        name: 'विकास जोशी',
        email: 'vikas.joshi@example.com',
        phone: '+91 54321 09876',
        joinDate: '2024-05-12',
        status: 'active',
        plan: 'premium',
        lastPayment: '2024-11-01',
        amount: 3500
      }
    ];
    setMembers(mockMembers);
    setFilteredMembers(mockMembers);
  }, []);

  // Filter members based on search and filters
  useEffect(() => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
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

  const userRole = user?.user_metadata?.role || 'user';

  if (userRole !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.phone) return;

    const member: Member = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      plan: newMember.plan,
      lastPayment: '',
      amount: newMember.plan === 'basic' ? 2500 : newMember.plan === 'premium' ? 3500 : 5000
    };

    setMembers(prev => [...prev, member]);
    setNewMember({ name: '', email: '', phone: '', plan: 'basic' });
    setIsAddingMember(false);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan: Member['plan']) => {
    switch (plan) {
      case 'basic': return 'text-blue-600 bg-blue-100';
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'vip': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="p-2 bg-orange-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-900">
                  {language === 'en' ? 'Member Management' : 'सदस्य व्यवस्थापन'}
                </h1>
                <p className="text-sm text-orange-600">Manage mess members and subscriptions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsAddingMember(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
              <Button variant="outline" className="border-orange-200 text-orange-600">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
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
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-900">{member.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-orange-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(member.plan)}`}>
                      {member.plan.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-orange-900">₹{member.amount}</div>
                      <div className="text-xs text-orange-500">
                        {member.lastPayment ? `Last: ${new Date(member.lastPayment).toLocaleDateString()}` : 'No payment'}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-orange-200 text-orange-600">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Member Modal */}
        {isAddingMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-orange-900">Add New Member</CardTitle>
                <CardDescription>Add a new member to the mess</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-orange-900">Full Name</label>
                  <Input
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Enter full name"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-900">Email</label>
                  <Input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="Enter email address"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-900">Phone</label>
                  <Input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-900">Plan</label>
                  <select
                    value={newMember.plan}
                    onChange={(e) => setNewMember({ ...newMember, plan: e.target.value as any })}
                    className="w-full p-2 border border-orange-200 rounded-md focus:border-orange-400"
                  >
                    <option value="basic">Basic - ₹2,500/month</option>
                    <option value="premium">Premium - ₹3,500/month</option>
                    <option value="vip">VIP - ₹5,000/month</option>
                  </select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleAddMember}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    Add Member
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingMember(false);
                      setNewMember({ name: '', email: '', phone: '', plan: 'basic' });
                    }}
                    variant="outline"
                    className="flex-1 border-orange-200 text-orange-600"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}