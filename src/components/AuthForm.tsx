import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart } from 'lucide-react';

export default function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect if we're in the bolt.new iframe or separate tab
  const isInIframe = window !== window.top;
  const currentUrl = window.location.origin;

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Attempting Google sign-in...');
    console.log('Current URL:', currentUrl);
    console.log('Is in iframe:', isInIframe);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: currentUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }
      
      console.log('Google sign-in initiated successfully');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(error.message);
      setLoading(false);
    }
    // Don't set loading to false here as the redirect should happen
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pet Tracker</h1>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
        
        {/* Debug info - remove in production */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Debug: Check browser console for sign-in logs
          </p>
        </div>
      </div>
    </div>
  );
}