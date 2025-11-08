"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Extended user interface for our app
interface AppUser extends User {
  user_metadata: {
    role?: string;
    full_name?: string;
    phone?: string;
    avatar?: string;
    language?: 'en' | 'mr';
    parent_mobile?: string;
    joining_date?: string;
    mess_id?: string;
  };
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: any) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch and merge profile - cached to avoid duplicate fetches
  const fetchAndMergeProfile = async (sessionUser: User): Promise<AppUser> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, name, mobile_number, parent_mobile, photo_url, mess_id')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (profile && !profileError) {
        return {
          ...(sessionUser as AppUser),
          user_metadata: {
            ...(sessionUser as AppUser).user_metadata,
            role: profile.role || (sessionUser as AppUser).user_metadata?.role,
            full_name: profile.name || (sessionUser as AppUser).user_metadata?.full_name,
            phone: profile.mobile_number || (sessionUser as AppUser).user_metadata?.phone,
            parent_mobile: profile.parent_mobile || (sessionUser as AppUser).user_metadata?.parent_mobile,
            avatar: profile.photo_url || (sessionUser as AppUser).user_metadata?.avatar,
            mess_id: profile.mess_id || (sessionUser as AppUser).user_metadata?.mess_id,
          }
        } as AppUser;
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
    return sessionUser as AppUser;
  };

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(session);
          if (session?.user) {
            // Fetch profile asynchronously without blocking
            fetchAndMergeProfile(session.user).then(mergedUser => {
              if (isMounted) setUser(mergedUser);
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change:', event);
      
      // For SIGNED_IN event, set session immediately and fetch profile in background
      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session);
        // Set user immediately with basic data to avoid blocking
        setUser(session.user as AppUser);
        setLoading(false);
        
        // Fetch profile asynchronously without blocking
        fetchAndMergeProfile(session.user).then(mergedUser => {
          if (isMounted) setUser(mergedUser);
        });
        
        // Create user profile if needed (non-blocking)
        createUserProfile(session.user).catch(console.error);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        // Update user from session without fetching profile again
        if (isMounted && session.user) {
          setUser(prevUser => prevUser ? { ...prevUser, ...session.user } as AppUser : session.user as AppUser);
        }
      } else {
        // For other events, just update session
        setSession(session);
        if (session?.user && !user) {
          setUser(session.user as AppUser);
        } else if (!session) {
          setUser(null);
        }
      }
      
      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh failed - forcing sign out');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Create user profile in our users table
  const createUserProfile = async (user: User) => {
    try {
      console.log('Creating/updating user profile for:', {
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.role
      });
      
      // First, check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, role, mess_id')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        console.log('✅ User profile already exists, skipping upsert:', existingUser);
        return;
      }

      const profileData = {
        id: user.id,
        // Follow DB column names: name, email, mobile_number, parent_mobile, photo_url
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        mobile_number: user.user_metadata?.phone || '',
        parent_mobile: user.user_metadata?.parent_mobile || null,
        photo_url: user.user_metadata?.avatar || null,
        role: user.user_metadata?.role || 'user',
        mess_id: user.user_metadata?.mess_id || null,
      };

      console.log('User does not exist, creating profile...');

      // Insert new user profile
      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate key error (user was created in parallel)
        if (error.code === '23505') {
          console.log('ℹ️ User profile created by another process, ignoring duplicate error');
          return;
        }

        // Check if error is empty object (RLS policy issue)
        const errorKeys = Object.keys(error);
        if (errorKeys.length === 0) {
          console.warn('⚠️ Empty error object - likely RLS policy issue (non-critical)', {
            userId: user.id,
            note: 'User profile may already exist or RLS policy is blocking operation'
          });
        } else {
          console.error('❌ Error creating user profile:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            userId: user.id
          });
        }
      } else {
        console.log('✅ User profile created successfully:', data);
      }
    } catch (error: any) {
      console.error('❌ Exception while creating user profile:', {
        message: error?.message,
        userId: user.id
      });
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation redirect
          data: {
            role: userData.role || 'user',
            full_name: userData.full_name || '',
            phone: userData.phone || '',
            parent_mobile: userData.parent_mobile || null,
            joining_date: userData.joining_date || null,
            avatar: userData.avatar || null,
            language: userData.language || 'mr',
          },
        },
      });

      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('supabase.auth.signInWithPassword ->', { data, error });

      if (error) throw error;

      // Don't wait for profile fetch - let onAuthStateChange handle it
      return { error: null };
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Normalize timeout errors
      if (err?.message && err.message.toLowerCase().includes('timeout')) {
        return { error: { message: 'Authentication timeout. Please check your connection and try again.' } as AuthError };
      }
      
      // Handle invalid refresh token
      if (err?.message && err.message.toLowerCase().includes('refresh token')) {
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('Error signing out after invalid refresh token:', signOutErr);
        }
        return { error: { message: 'Session expired. Please sign in again.' } as AuthError };
      }
      
      // Handle network errors
      if (err?.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network'))) {
        return { error: { message: 'Network error. Please check your internet connection.' } as AuthError };
      }
      
      return { error: err as AuthError };
    } finally {
      // Remove setLoading(false) here - let onAuthStateChange handle it
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear state immediately for better UX
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't throw error - state is already cleared, user is effectively logged out
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      // Don't re-throw - state is already cleared
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) return { error: { message: 'No user logged in' } as AuthError };

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (authError) throw authError;

      // Update user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: updates.full_name || updates.name,
          mobile_number: updates.phone || updates.mobile_number,
          photo_url: updates.avatar || updates.photo_url,
          
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
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