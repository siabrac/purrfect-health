import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../lib/supabase';

// Mock user for development
const MOCK_USER = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  email: 'demo@pettracker.com',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
} as User;
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockUser, setIsMockUser] = useState(false);

  useEffect(() => {
    // Check for mock login in development
    const isMockMode = localStorage.getItem('mock-auth') === 'true';
    
    if (isMockMode) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't override mock auth
      if (localStorage.getItem('mock-auth') === 'true') {
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get the appropriate Supabase client based on auth type
  const getSupabaseClient = () => {
    return isMockUser ? supabaseAdmin : supabase
  }

  const mockLogin = () => {
    const mockUser = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'demo@pettracker.com',
      user_metadata: {
        full_name: 'Demo User',
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
      }
    };
    
    // Create a mock session for Supabase
    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser
    };
    
    // Set the session in Supabase client
    supabase.auth.setSession(mockSession);
    setUser(mockUser);
    setIsMockUser(true);
  };

  const signOut = async () => {
    // Clear mock auth
    localStorage.removeItem('mock-auth');
    await supabase.auth.signOut();
    setUser(null);
    setIsMockUser(false);
  };

  return {
    user,
    loading,
    isMockUser,
    supabaseClient: getSupabaseClient(),
    signOut,
  };
}