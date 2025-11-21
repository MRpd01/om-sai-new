"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Extended user interface for our app
interface AppUser extends User {
  user_metadata: {
    role?: string;
    sub_role?: 'owner' | 'sub_admin';
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
        .select('role, sub_role, name, mobile_number, parent_mobile, photo_url, mess_id')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (profileError) {
        // Check if it's an empty error object (common for RLS or no data)
        const hasErrorContent = profileError && (profileError.message || profileError.code || profileError.details);
        
        if (hasErrorContent) {
          console.warn('⚠️ Profile fetch issue:', {
            message: profileError.message || 'No message',
            code: profileError.code || 'No code',
            hint: profileError.hint || 'No hint',
            userId: sessionUser.id
          });
        }
        
        // Return user with metadata from session as fallback
        console.log('ℹ️ Using session metadata as fallback for user:', sessionUser.id);
        return sessionUser as AppUser;
      }

      if (profile) {
        console.log('✅ Profile merged successfully for user:', sessionUser.id);
        return {
          ...(sessionUser as AppUser),
          user_metadata: {
            ...(sessionUser as AppUser).user_metadata,
            role: profile.role || (sessionUser as AppUser).user_metadata?.role || 'user',
            sub_role: profile.sub_role || 'owner', // Default to owner if not set
            full_name: profile.name || (sessionUser as AppUser).user_metadata?.full_name,
            phone: profile.mobile_number || (sessionUser as AppUser).user_metadata?.phone,
            parent_mobile: profile.parent_mobile || (sessionUser as AppUser).user_metadata?.parent_mobile,
            avatar: profile.photo_url || (sessionUser as AppUser).user_metadata?.avatar,
            mess_id: profile.mess_id || (sessionUser as AppUser).user_metadata?.mess_id,
          }
        } as AppUser;
      }
    } catch (e: any) {
      // Silently handle network errors - don't show in console unless it's critical
      if (e?.message && !e.message.includes('Failed to fetch')) {
        console.warn('⚠️ Exception fetching profile (continuing with session data):', {
          name: e?.name || 'Unknown',
          message: e?.message || 'No message',
          userId: sessionUser.id
        });
      }
    }
    
    // Always return at least the session user
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
            }).catch(err => {
              // Silently handle profile fetch errors
              if (isMounted) setUser(session.user as AppUser);
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error: any) {
        // Only log non-network errors
        if (error?.message && !error.message.includes('Failed to fetch')) {
          console.error('Error getting initial session:', error);
        }
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

      // Get the default mess (there's only one mess in this system)
      const { data: defaultMess } = await supabase
        .from('messes')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      const defaultMessId = defaultMess?.id || null;
      
      if (defaultMessId) {
        console.log('✅ Auto-assigning user to default mess:', defaultMessId);
      } else {
        console.warn('⚠️ No active mess found for auto-assignment');
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
        mess_id: user.user_metadata?.mess_id || defaultMessId, // Auto-assign to default mess
      };

      console.log('User does not exist, creating profile with mess_id:', profileData.mess_id);

      // Insert new user profile
      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate key error (user was created in parallel)
        if (error.code === '23505') {
          console.log('ℹ️ User profile already exists (duplicate key), skipping');
          return;
        }

        // Check if error is empty object or has no meaningful content
        const hasErrorContent = error && (error.message || error.code || error.details);
        
        if (!hasErrorContent) {
          console.warn('⚠️ Profile creation blocked (likely RLS policy). Attempting via API...');
          
          // Try creating via API endpoint (uses service role to bypass RLS)
          try {
            const response = await fetch('/api/create-user-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profileData)
            });
            
            if (response.ok) {
              console.log('✅ User profile created via API');
              return;
            } else {
              const apiError = await response.json();
              console.warn('⚠️ API profile creation issue:', apiError);
            }
          } catch (apiError) {
            console.warn('⚠️ API call issue:', apiError);
          }
          return;
        }

        // Only log if it's a real error with actual error data
        console.warn('⚠️ Profile creation issue:', {
          code: error.code || 'No code',
          message: error.message || 'No message',
          hint: error.hint || 'No hint',
          userId: user.id
        });
      } else {
        console.log('✅ User profile created successfully:', data);
      }
    } catch (error: any) {
      console.warn('⚠️ Exception while creating user profile (continuing):', {
        name: error?.name || 'Unknown',
        message: error?.message || 'No message',
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
      // Clear state immediately for instant UX
      setUser(null);
      setSession(null);
      setLoading(false); // Set loading false immediately
      
      // Sign out from Supabase in background (don't wait)
      supabase.auth.signOut().catch(error => {
        console.error('⚠️ Background sign out error (non-critical):', error);
      });
      
      // Redirect immediately without waiting
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state even on error
      setUser(null);
      setSession(null);
      setLoading(false);
      window.location.href = '/login';
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