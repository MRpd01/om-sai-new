"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, Users, Plus, Trash2, Mail, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock data for demonstration
const mockAdmins = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'John Doe',
      email: 'john@mess.com',
      mobile_number: '+91 9876543210',
      role: 'admin' as const
    },
    assigned_by: 'owner1',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@mess.com',
      mobile_number: '+91 8765432109',
      role: 'admin' as const
    },
    assigned_by: 'owner1',
    is_active: true,
    created_at: '2024-02-01T14:20:00Z'
  }
];

export default function ManageAdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState(mockAdmins);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setLoading(true);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAdmin = {
      id: `admin_${Date.now()}`,
      user: {
        id: `user_${Date.now()}`,
        name: newAdminEmail.split('@')[0],
        email: newAdminEmail,
        mobile_number: '+91 9999999999',
        role: 'admin' as const
      },
      assigned_by: user?.id || 'current_user',
      is_active: true,
      created_at: new Date().toISOString()
    };

    setAdmins([...admins, newAdmin]);
    setNewAdminEmail('');
    setShowAddForm(false);
    setLoading(false);
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    
    setLoading(true);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAdmins(admins.filter(admin => admin.id !== adminId));
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-orange-600" />
              </Link>
              <div className="p-2 bg-orange-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-900">Manage Admins</h1>
                <p className="text-sm text-orange-600">Add or remove admin access for your mess</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Admin Form */}
        {showAddForm && (
          <Card className="mb-8 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Add New Admin</CardTitle>
              <CardDescription>
                Enter the email address of the user you want to make an admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="border-orange-200 focus:border-orange-400"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? 'Adding...' : 'Add Admin'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewAdminEmail('');
                    }}
                    className="border-orange-200 text-orange-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Current Admins */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-orange-900 mb-4">
              Current Admins ({admins.length})
            </h2>
            {admins.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-orange-700 mb-2">No Admins Yet</h3>
                  <p className="text-orange-600 mb-4">Add admins to help manage your mess operations</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Admin
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {admins.map((admin) => (
                  <Card key={admin.id} className="border-orange-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-orange-100 rounded-full">
                            <Users className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-orange-900">
                              {admin.user.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-orange-600">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {admin.user.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {admin.user.mobile_number}
                              </div>
                            </div>
                            <p className="text-xs text-orange-500 mt-1">
                              Added on {formatDate(admin.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChefHat className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Admin Permissions</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Manage mess members and their subscriptions</li>
                  <li>• View and manage payments</li>
                  <li>• Update menu and mess settings</li>
                  <li>• Send notifications to members</li>
                  <li>• View reports and analytics</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  Note: Only the mess owner can add or remove admins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}