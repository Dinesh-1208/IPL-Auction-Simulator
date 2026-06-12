import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetRoom, getGetRoomQueryKey } from "@workspace/api-client-react";

export default function RoomRouter() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const code = params.code as string;
  
  const { data: room, isLoading } = useGetRoom(code, {
    query: {
      enabled: !!code,
      queryKey: getGetRoomQueryKey(code),
    }
  });

  useEffect(() => {
    if (!room) return;
    
    if (room.status === "lobby") {
      setLocation(`/room/${code}/lobby`);
    } else if (room.status === "preparation") {
      setLocation(`/room/${code}/prepare`);
    } else if (room.status === "auction") {
      setLocation(`/room/${code}/auction`);
    } else if (room.status === "completed") {
      setLocation(`/room/${code}/results`);
    }
  }, [room, code, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading Room...</div>;
  }

  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
}