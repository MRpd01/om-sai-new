"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, X, Calendar, User, Mail, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  requested_plan: string;
  requested_join_date: string;
  request_message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes: string | null;
}

export default function SubscriptionRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  const planLabels: Record<string, string> = {
    double_time: 'Double Time (₹2600)',
    single_time: 'Single Time (₹1500)',
    half_month: 'Half Month (₹1300)',
    full_month: 'Full Month (₹2600)'
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.user_metadata?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      fetchRequests();
    }
  }, [user, loading]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/subscription-requests?adminId=${user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approve this subscription request with ₹0 payment?')) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch('/api/approve-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          adminId: user?.id,
          action: 'approve',
          adminNotes: adminNotes[requestId] || 'Approved by admin'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Subscription request approved successfully!');
        fetchRequests(); // Refresh list
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const notes = adminNotes[requestId] || '';
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Reject this subscription request?')) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch('/api/approve-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          adminId: user?.id,
          action: 'reject',
          adminNotes: notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('❌ Subscription request rejected');
        fetchRequests(); // Refresh list
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading || loadingRequests) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-orange-700">Loading requests...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-900">Subscription Requests</h1>
              <p className="text-orange-600 mt-1">Review and approve member subscription requests</p>
            </div>
            <div className="bg-orange-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-orange-700">Pending Requests</p>
              <p className="text-2xl font-bold text-orange-900">{pendingRequests.length}</p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
              <Bell className="mr-2 h-5 w-5 text-orange-600" />
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-orange-200 border-2">
                  <CardHeader className="bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-orange-900">{request.user_name}</CardTitle>
                        <CardDescription>
                          Requested {planLabels[request.requested_plan]}
                        </CardDescription>
                      </div>
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                        ⏳ Pending
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-700">{request.user_email}</span>
                      </div>
                      {request.user_phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-orange-600" />
                          <span className="text-gray-700">{request.user_phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-700">
                          Joining: {new Date(request.requested_join_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-700">
                          Requested: {new Date(request.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {request.request_message && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-900 mb-1">User Message:</p>
                            <p className="text-sm text-blue-700">{request.request_message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Notes Input */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                        placeholder="Add notes or reason..."
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-orange-400 focus:outline-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {processing === request.id ? 'Approving...' : 'Approve (₹0 Payment)'}
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processing === request.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Pending Requests */}
        {pendingRequests.length === 0 && (
          <Card className="border-orange-200 mb-8">
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-orange-900 mb-2">No Pending Requests</h3>
              <p className="text-orange-600">All subscription requests have been processed</p>
            </CardContent>
          </Card>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Processed Requests ({processedRequests.length})
            </h2>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <Card key={request.id} className="border-gray-200">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{request.user_name}</p>
                        <p className="text-sm text-gray-600">{request.user_email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {request.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    {request.admin_notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{request.admin_notes}"</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
