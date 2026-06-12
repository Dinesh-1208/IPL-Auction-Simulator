import { useParams, useLocation } from "wouter";
import { useGetRoom, getGetRoomQueryKey, useGetRoomMembers, getGetRoomMembersQueryKey, useStartAuction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

export default function RoomLobby() {
  const params = useParams();
  const code = params.code as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: room, isLoading: roomLoading } = useGetRoom(code, {
    query: { enabled: !!code, queryKey: getGetRoomQueryKey(code) }
  });

  const { data: members, isLoading: membersLoading } = useGetRoomMembers(code, {
    query: { enabled: !!code, queryKey: getGetRoomMembersQueryKey(code) }
  });

  const startAuction = useStartAuction();

  const isHost = room?.hostUserId === user?.id;

  const handleStart = () => {
    startAuction.mutate(
      { code },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
          toast({ title: "Auction phase started!" });
          setLocation(`/room/${code}/prepare`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to start auction" });
        }
      }
    );
  };

  if (roomLoading || membersLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Lobby...</div>;
  }

  if (!room) return <div>Room not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{room.name}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <span className="text-sm font-medium text-secondary-foreground uppercase">Room Code</span>
            <span className="text-lg font-mono font-bold tracking-widest text-primary">{room.code}</span>
          </div>
        </header>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 flex items-center justify-between">
            <span>Members ({members?.length || 0})</span>
            {isHost && (
              <Button onClick={handleStart} disabled={startAuction.isPending} size="lg">
                {startAuction.isPending ? "Starting..." : "Start Auction"}
              </Button>
            )}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members?.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">{member.teamName || 'Spectator'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}