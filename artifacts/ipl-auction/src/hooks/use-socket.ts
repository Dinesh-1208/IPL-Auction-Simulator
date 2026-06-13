import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppUser } from './useAppAuth';

export function useSocket(code?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAppUser();

  useEffect(() => {
    if (!code || !user?.id) return;
    
    const socket = io({ path: '/ws/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', {
        code,
        userId: user.id,
        displayName: user.fullName || "Player"
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, user?.id, user?.fullName]);

  return socketRef.current;
}

