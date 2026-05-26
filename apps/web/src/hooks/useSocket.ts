'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/constants';
import { useAuthStore, useNotificationStore } from '@/store';

let socket: Socket | null = null;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socket.on('notification', (notification) => {
      useNotificationStore.getState().addNotification(notification);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated, accessToken]);

  return socket;
}
