import { useParams, useLocation } from "wouter";
import { useGetRoom, getGetRoomQueryKey, useStartAuction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react";

export default function RoomPrepare() {
  const params = useParams();
  const code = params.code as string;
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: room, isLoading: roomLoading } = useGetRoom(code, {
    query: { enabled: !!code, queryKey: getGetRoomQueryKey(code) }
  });

  const startAuction = useStartAuction();
  const isHost = room?.hostUserId === user?.id;

  const handleStartAuction = () => {
    startAuction.mutate(
      { code },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
          setLocation(`/room/${code}/auction`);
        }
      }
    );
  };

  if (roomLoading) return <div className="min-h-screen flex items-center justify-center">Loading Preparation...</div>;
  if (!room) return <div>Room not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-center">Preparation Phase</h1>
        <p className="text-center text-muted-foreground">Select franchise and set retentions.</p>

        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
          <p className="mb-6">Retention and team selection UI would go here.</p>
          
          {isHost && (
            <Button onClick={handleStartAuction} disabled={startAuction.isPending} size="lg" className="w-full sm:w-auto">
              {startAuction.isPending ? "Starting..." : "Begin Live Auction"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}