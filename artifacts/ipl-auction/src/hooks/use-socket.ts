import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket(code?: string) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!code) return;
    
    const socket = io({ path: '/ws/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinRoom', { code });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code]);

  return socketRef.current;
}
