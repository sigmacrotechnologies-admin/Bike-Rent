'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';

/** Wait for persisted auth before redirecting or fetching protected data. */
export function useAuthReady() {
  const [ready, setReady] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setReady(true);
  }, []);

  const hasToken =
    ready && typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  return {
    ready,
    isAuthed: isAuthenticated || hasToken,
  };
}
