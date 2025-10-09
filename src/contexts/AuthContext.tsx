"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Mock user type for demo
interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    role?: string;
    full_name?: string;
    phone?: string;
      avatar?: string;
    language?: 'en' | 'mr'; // Add language preference
  };
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('messmate_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      // Mock user creation
      const newUser: MockUser = {
        id: `user_${Date.now()}`,
        email,
        user_metadata: {
          role: userData.role || 'user',
          full_name: userData.full_name,
          phone: userData.phone,
          avatar: userData.avatar,
        },
      };

      // Store in localStorage for demo
      localStorage.setItem('messmate_user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to create account' } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Demo users for testing
      const demoUsers = {
        'user@demo.com': { role: 'user', full_name: 'Demo User', language: 'en' as const },
        'admin@demo.com': { role: 'admin', full_name: 'Demo Admin', language: 'mr' as const }, // Admin defaults to Marathi
      };

      // Check if it's a demo user
      const demoUser = demoUsers[email as keyof typeof demoUsers];
      
      if (demoUser && password === 'demo123') {
        const mockUser: MockUser = {
          id: `user_${Date.now()}`,
          email,
          user_metadata: demoUser,
        };
        
        localStorage.setItem('messmate_user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { error: null };
      }
      
      // For other emails, just simulate a successful login
      if (password.length >= 6) {
        const mockUser: MockUser = {
          id: `user_${Date.now()}`,
          email,
          user_metadata: {
            role: 'user',
            full_name: email.split('@')[0],
          },
        };
        
        localStorage.setItem('messmate_user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { error: null };
      }
      
      return { error: { message: 'Invalid email or password' } };
    } catch (error) {
      return { error: { message: 'Failed to sign in' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('messmate_user');
      setUser(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to send reset email' } };
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) return { error: { message: 'No user logged in' } };

      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...updates,
        },
      };

      localStorage.setItem('messmate_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to update profile' } };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}