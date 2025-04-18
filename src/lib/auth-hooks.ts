'use client';

import { useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user;

  // Check if user is a lead
  const isLead = user?.role === UserRole.LEAD;

  return {
    user,
    isAuthenticated,
    isLoading,
    isLead,
    signIn,
    signOut,
  };
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isLoading };
}

export function useRequireLead(redirectTo = '/dashboard') {
  const { isAuthenticated, isLoading, isLead } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isLead) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, isLead, redirectTo, router]);

  return { isLoading };
}
