'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FloatingChatBubble from '@/components/FloatingChatBubble';

export default function CSMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkAuth();

    // Listen for auth state changes
    supabase.then(client => {
      const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login/csm');
        } else {
          checkAuth();
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    });
  }, [router]);

  async function checkAuth() {
    try {
      const client = await supabase;
      const { data: { session } } = await client.auth.getSession();
      
      if (!session) {
        router.push('/login/csm');
        return;
      }

      // Check if user has CSM role
      const { data: profile, error } = await client
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.role !== 'csm') {
        console.error('Access denied: User is not a CSM');
        router.push('/login/csm');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login/csm');
    }
  }

  // Show loading state while checking authorization
  if (!isMounted || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <FloatingChatBubble />
    </>
  );
}
