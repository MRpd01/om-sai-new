"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Mail, Lock, Eye, EyeOff, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const urlRole = searchParams?.get('role');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<'user' | 'admin'>(urlRole as 'user' | 'admin' || 'user');
  const { signIn } = useAuth();
  const router = useRouter();

  // Update role when URL parameter changes
  useEffect(() => {
    if (urlRole) {
      setCurrentRole(urlRole as 'user' | 'admin');
    }
  }, [urlRole]);

  const roleConfig = {
    user: {
      title: 'Member Sign In',
      description: 'Sign in to access your mess membership',
      icon: Users,
      color: 'orange',
      demoEmail: 'user@demo.com',
      demoLabel: 'Demo Member'
    },
    admin: {
      title: 'Mess Owner Sign In',
      description: 'Sign in to manage your mess business',
      icon: ChefHat,
      color: 'orange',
      demoEmail: 'admin@demo.com',
      demoLabel: 'Demo Owner'
    }
  };

  const config = roleConfig[currentRole];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message || 'Failed to sign in');
    } else {
      router.push('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="border-orange-200 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className={`p-3 bg-${config.color}-100 rounded-full`}>
                <config.icon className={`h-8 w-8 text-${config.color}-600`} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-900">{config.title}</CardTitle>
            <CardDescription className="text-orange-700">
              {config.description}
            </CardDescription>
            
            {/* Role Switch */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <span className="text-sm text-orange-600">Not what you're looking for?</span>
              <Link 
                href={`/login?role=${currentRole === 'user' ? 'admin' : 'user'}`}
                className="text-sm font-medium text-orange-700 hover:text-orange-900 underline"
              >
                {currentRole === 'user' ? 'Mess Owner Sign In' : 'Member Sign In'}
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-orange-900">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-orange-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-orange-500 hover:text-orange-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                  <span className="ml-2 text-sm text-orange-700">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-orange-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-orange-500">Or</span>
                </div>
              </div>

              <div className="text-sm text-orange-700">
                Don't have an account?{' '}
                <Link 
                  href={`/signup?role=${currentRole}`} 
                  className="font-medium text-orange-600 hover:text-orange-700"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-based Login Options */}
        <div className="mt-6 text-center">
          <p className="text-sm text-orange-600 mb-3">Quick Demo Access</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => {
                setEmail(config.demoEmail);
                setPassword('demo123');
              }}
            >
              {config.demoLabel}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => {
                const otherRole = currentRole === 'user' ? 'admin' : 'user';
                const otherConfig = roleConfig[otherRole];
                setEmail(otherConfig.demoEmail);
                setPassword('demo123');
              }}
            >
              {currentRole === 'user' ? 'Demo Owner' : 'Demo Member'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}