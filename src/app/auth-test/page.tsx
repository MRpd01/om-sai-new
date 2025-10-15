"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, User, Mail, Shield, Calendar } from 'lucide-react';

export default function AuthTestPage() {
  const { user, session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-orange-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-orange-900">
              🔐 Supabase Authentication Status
            </CardTitle>
            <CardDescription className="text-orange-700">
              Real-time authentication state for ओम साई भोजनालय
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Authentication Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`border-2 ${user ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className={`h-6 w-6 ${user ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <h3 className={`font-semibold ${user ? 'text-green-900' : 'text-red-900'}`}>
                        Authentication Status
                      </h3>
                      <p className={`text-sm ${user ? 'text-green-700' : 'text-red-700'}`}>
                        {user ? '✅ Authenticated' : '❌ Not Authenticated'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${session ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className={`h-6 w-6 ${session ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <h3 className={`font-semibold ${session ? 'text-green-900' : 'text-red-900'}`}>
                        Session Status
                      </h3>
                      <p className={`text-sm ${session ? 'text-green-700' : 'text-red-700'}`}>
                        {session ? '✅ Active Session' : '❌ No Session'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Details */}
            {user ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900 flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>User Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-800">User ID</label>
                      <p className="text-green-700 font-mono text-sm bg-green-100 p-2 rounded">
                        {user.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-800">Email</label>
                      <p className="text-green-700 bg-green-100 p-2 rounded flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-800">Role</label>
                      <p className="text-green-700 bg-green-100 p-2 rounded">
                        {user.user_metadata?.role || 'user'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-800">Full Name</label>
                      <p className="text-green-700 bg-green-100 p-2 rounded">
                        {user.user_metadata?.full_name || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-800">Phone</label>
                      <p className="text-green-700 bg-green-100 p-2 rounded">
                        {user.user_metadata?.phone || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-800">Language</label>
                      <p className="text-green-700 bg-green-100 p-2 rounded">
                        {user.user_metadata?.language || 'mr'} ({user.user_metadata?.language === 'mr' ? 'मराठी' : 'English'})
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-green-800">Created At</label>
                    <p className="text-green-700 bg-green-100 p-2 rounded">
                      {new Date(user.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-green-800">Email Confirmed</label>
                    <p className="text-green-700 bg-green-100 p-2 rounded">
                      {user.email_confirmed_at ? '✅ Confirmed' : '❌ Not Confirmed'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-red-900 font-semibold mb-2">No User Data</h3>
                  <p className="text-red-700 mb-4">Please sign in to view user information</p>
                  <div className="space-x-4">
                    <Button 
                      onClick={() => window.location.href = '/login'} 
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/signup'} 
                      variant="outline"
                      className="border-orange-600 text-orange-600"
                    >
                      Sign Up
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Details */}
            {session && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-blue-800">Access Token (First 20 chars)</label>
                      <p className="text-blue-700 font-mono text-sm bg-blue-100 p-2 rounded">
                        {session.access_token.substring(0, 20)}...
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-800">Token Type</label>
                      <p className="text-blue-700 bg-blue-100 p-2 rounded">
                        {session.token_type}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-800">Expires At</label>
                      <p className="text-blue-700 bg-blue-100 p-2 rounded">
                        {new Date(session.expires_at! * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-800">Refresh Token (First 20 chars)</label>
                      <p className="text-blue-700 font-mono text-sm bg-blue-100 p-2 rounded">
                        {session.refresh_token?.substring(0, 20)}...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-6">
              <Button onClick={() => window.location.href = '/dashboard'} className="bg-orange-600 hover:bg-orange-700">
                Go to Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="border-orange-600 text-orange-600">
                Go to Home
              </Button>
              {user && (
                <Button onClick={signOut} variant="destructive">
                  Sign Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}