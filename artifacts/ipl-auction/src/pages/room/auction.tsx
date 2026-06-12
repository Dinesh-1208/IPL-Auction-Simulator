import { useParams, useLocation } from "wouter";
import { useGetRoom, getGetRoomQueryKey, useGetCurrentAuctionPlayer, getGetCurrentAuctionPlayerQueryKey, usePlaceBid, useNextPlayer, useCompleteAuction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useUser } from "@clerk/react";

export default function RoomAuction() {
  const params = useParams();
  const code = params.code as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  
  const socket = useSocket(code);

  const { data: room, isLoading: roomLoading } = useGetRoom(code, {
    query: { enabled: !!code, queryKey: getGetRoomQueryKey(code) }
  });

  const { data: auctionState, isLoading: auctionLoading } = useGetCurrentAuctionPlayer(code, {
    query: { enabled: !!code, queryKey: getGetCurrentAuctionPlayerQueryKey(code) }
  });

  const placeBid = usePlaceBid();
  const nextPlayer = useNextPlayer();
  const completeAuction = useCompleteAuction();

  useEffect(() => {
    if (!socket) return;

    socket.on('auction:bid', () => queryClient.invalidateQueries({ queryKey: getGetCurrentAuctionPlayerQueryKey(code) }));
    socket.on('auction:sold', () => queryClient.invalidateQueries({ queryKey: getGetCurrentAuctionPlayerQueryKey(code) }));
    socket.on('auction:unsold', () => queryClient.invalidateQueries({ queryKey: getGetCurrentAuctionPlayerQueryKey(code) }));
    socket.on('auction:next', () => queryClient.invalidateQueries({ queryKey: getGetCurrentAuctionPlayerQueryKey(code) }));
    socket.on('auction:complete', () => {
      queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
      setLocation(`/room/${code}/results`);
    });

    return () => {
      socket.off('auction:bid');
      socket.off('auction:sold');
      socket.off('auction:unsold');
      socket.off('auction:next');
      socket.off('auction:complete');
    };
  }, [socket, code, queryClient, setLocation]);

  const handleBid = () => {
    // Need teamId for this, mock for now
    placeBid.mutate({ code, data: { teamId: 1, bidAmountCrore: (auctionState?.currentBidCrore || 0) + 0.5 } });
  };

  const handleNext = () => {
    nextPlayer.mutate({ code });
  };
  
  const handleComplete = () => {
    completeAuction.mutate({ code }, {
      onSuccess: () => setLocation(`/room/${code}/results`)
    });
  };

  const isHost = room?.hostUserId === user?.id;

  if (roomLoading || auctionLoading) return <div className="min-h-screen flex items-center justify-center">Loading Auction...</div>;
  if (!room) return <div>Room not found</div>;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 border-b border-border bg-card flex justify-between items-center">
        <div>
          <h1 className="font-bold text-xl">{room.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">CODE: {room.code}</p>
        </div>
        {isHost && (
          <Button variant="outline" onClick={handleComplete} disabled={completeAuction.isPending}>
            End Auction
          </Button>
        )}
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player Info & Controls */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
          <div className="bg-card border border-border rounded-xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
            {auctionState?.currentPlayer ? (
              <>
                <div className="text-7xl font-bold tracking-tighter mb-4">{auctionState.currentPlayer.name}</div>
                <div className="flex gap-4 mb-8">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">{auctionState.currentPlayer.role}</span>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold">{auctionState.currentPlayer.nationality}</span>
                  <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-semibold">{auctionState.currentPlayer.isOverseas ? "Overseas" : "Indian"}</span>
                </div>
                
                <div className="text-2xl text-muted-foreground mb-2">Base Price: ₹{auctionState.currentPlayer.basePriceCrore} Cr</div>
                <div className="text-5xl font-black text-green-500 mb-8">Current Bid: ₹{auctionState.currentBidCrore} Cr</div>
                
                <div className="flex gap-4">
                  <Button size="lg" className="h-16 px-12 text-xl font-bold bg-blue-600 hover:bg-blue-700" onClick={handleBid} disabled={placeBid.isPending}>
                    BID +0.5 Cr
                  </Button>
                </div>
                
                {isHost && (
                  <div className="mt-8 flex gap-4">
                    <Button variant="outline" onClick={handleNext} disabled={nextPlayer.isPending}>
                      Next Player
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl text-muted-foreground mb-4">No active player</h2>
                {isHost && (
                  <Button size="lg" onClick={handleNext} disabled={nextPlayer.isPending}>
                    Draw First Player
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Teams & Budgets */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-muted-foreground">Franchise Budgets</h2>
          <div className="flex-1 overflow-auto space-y-4">
            <p className="text-sm text-muted-foreground">Budgets will appear here...</p>
          </div>
        </div>
      </main>
    </div>
  );
}