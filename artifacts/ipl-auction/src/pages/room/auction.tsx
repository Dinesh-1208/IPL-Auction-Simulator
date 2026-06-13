import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetRoom, getGetRoomQueryKey,
  useGetRoomTeams, getGetRoomTeamsQueryKey,
  useGetCurrentAuctionPlayer, getGetCurrentAuctionPlayerQueryKey,
  usePlaceBid,
  useNextPlayer,
  useCompleteAuction,
  useMarkPlayerSold,
  useMarkPlayerUnsold,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/use-socket";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Gavel, Trophy, ChevronRight, SkipForward, X } from "lucide-react";

export default function RoomAuction() {
  const params = useParams();
  const code = params.code as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const socket = useSocket(code);

  const [timer, setTimer] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: room } = useGetRoom(code, {
    query: { queryKey: getGetRoomQueryKey(code) },
  });

  const { data: roomTeams } = useGetRoomTeams(code, {
    query: { queryKey: getGetRoomTeamsQueryKey(code) },
  });

  const { data: auctionState, isLoading: auctionLoading } = useGetCurrentAuctionPlayer(code, {
    query: { queryKey: getGetCurrentAuctionPlayerQueryKey(code) },
  });

  const myTeam = roomTeams?.find((t) => t.owners.some((o) => o.userId === user?.id));
  const isHost = room?.hostUserId === user?.id;

  const placeBid = usePlaceBid();
  const nextPlayer = useNextPlayer();
  const completeAuction = useCompleteAuction();
  const markSold = useMarkPlayerSold();
  const markUnsold = useMarkPlayerUnsold();

  const refreshAuction = () => queryClient.invalidateQueries({ queryKey: getGetCurrentAuctionPlayerQueryKey(code) });
  const refreshTeams = () => queryClient.invalidateQueries({ queryKey: getGetRoomTeamsQueryKey(code) });

  useEffect(() => {
    if (!socket) return;
    const onBid = () => { refreshAuction(); refreshTeams(); };
    const onSold = () => { refreshAuction(); refreshTeams(); startTimer(5); };
    const onUnsold = () => { refreshAuction(); startTimer(5); };
    const onNext = () => { refreshAuction(); };
    const onComplete = () => {
      queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
      setLocation(`/room/${code}/results`);
    };
    socket.on("auction:bid", onBid);
    socket.on("auction:sold", onSold);
    socket.on("auction:unsold", onUnsold);
    socket.on("auction:next", onNext);
    socket.on("auction:complete", onComplete);
    return () => {
      socket.off("auction:bid", onBid);
      socket.off("auction:sold", onSold);
      socket.off("auction:unsold", onUnsold);
      socket.off("auction:next", onNext);
      socket.off("auction:complete", onComplete);
    };
  }, [socket, code, queryClient, setLocation]);

  useEffect(() => {
    if (auctionState?.timerSeconds && auctionState.timerSeconds > 0) {
      startTimer(auctionState.timerSeconds);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [auctionState?.currentPlayer?.id]);

  function startTimer(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleBid = () => {
    if (!myTeam) {
      toast({ variant: "destructive", title: "You need a franchise to bid!" });
      return;
    }
    const currentBid = auctionState?.currentBidCrore ?? 0;
    const nextBid = Math.round((currentBid + 0.5) * 10) / 10;

    if (nextBid > myTeam.budgetRemainingCrore) {
      toast({ variant: "destructive", title: "Insufficient budget!" });
      return;
    }

    placeBid.mutate(
      { code, data: { teamId: myTeam.id, bidAmountCrore: nextBid } },
      {
        onError: (err: any) => toast({ variant: "destructive", title: "Bid failed", description: err?.message }),
      }
    );
  };

  const handleSold = () => markSold.mutate({ code }, { onSuccess: refreshAuction });
  const handleUnsold = () => markUnsold.mutate({ code }, { onSuccess: refreshAuction });
  const handleNext = () => nextPlayer.mutate({ code }, { onSuccess: refreshAuction });
  const handleComplete = () => {
    completeAuction.mutate({ code }, { onSuccess: () => setLocation(`/room/${code}/results`) });
  };

  const currentPlayer = auctionState?.currentPlayer;
  const currentBid = auctionState?.currentBidCrore ?? 0;
  const isMyBid = auctionState?.currentBidderTeamId === myTeam?.id;
  const timerPct = timer !== null && auctionState?.timerSeconds ? (timer / auctionState.timerSeconds) * 100 : 100;
  const timerColor = timer === null || timer > 10 ? "bg-green-500" : timer > 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg leading-tight">{room?.name}</h1>
          <p className="text-xs text-muted-foreground font-mono">{code} · {auctionState?.totalPlayersAuctioned ?? 0}/{(auctionState?.totalPlayersAuctioned ?? 0) + (auctionState?.totalPlayersRemaining ?? 0)} players</p>
        </div>
        <div className="flex items-center gap-2">
          {myTeam && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">{myTeam.shortName}</p>
              <p className="text-sm font-bold text-green-400">₹{myTeam.budgetRemainingCrore.toFixed(1)} Cr left</p>
            </div>
          )}
          {isHost && (
            <Button variant="outline" size="sm" onClick={handleComplete} disabled={completeAuction.isPending}>
              End Auction
            </Button>
          )}
        </div>
      </header>

      {/* Timer bar */}
      <div className="h-1 bg-muted transition-all" style={{ width: `${timerPct}%` }}>
        <div className={`h-full transition-colors ${timerColor}`} style={{ width: "100%" }} />
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
        <div className="lg:col-span-2 flex flex-col p-4 gap-4">
          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col items-center justify-center p-6 min-h-[360px] relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5"
              style={{ background: `radial-gradient(ellipse at center, ${auctionState?.currentBidderTeamId ? "#3b82f6" : "#6b7280"} 0%, transparent 70%)` }}
            />

            {auctionLoading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : !currentPlayer ? (
              <div className="text-center relative z-10">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Active Player</h2>
                <p className="text-muted-foreground mb-6">
                  {auctionState?.status === "completed" ? "Auction complete!" : "Draw first player to begin"}
                </p>
                {isHost && auctionState?.status !== "completed" && (
                  <Button size="lg" onClick={handleNext} disabled={nextPlayer.isPending}>
                    <Gavel className="w-5 h-5 mr-2" />
                    Draw First Player
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center relative z-10 w-full max-w-md">
                <div className="flex gap-2 justify-center mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">{currentPlayer.role}</span>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold">{currentPlayer.nationality}</span>
                  {currentPlayer.isOverseas && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">Overseas</span>
                  )}
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1">{currentPlayer.name}</h2>
                {currentPlayer.previousTeamName && (
                  <p className="text-sm text-muted-foreground mb-4">Previously at {currentPlayer.previousTeamName}</p>
                )}

                <p className="text-muted-foreground mb-1">Base Price</p>
                <p className="text-xl font-semibold mb-4">₹{currentPlayer.basePriceCrore} Cr</p>

                <div className={`text-5xl font-black mb-1 ${isMyBid ? "text-green-400" : "text-blue-400"}`}>
                  ₹{currentBid} Cr
                </div>
                {auctionState?.currentBidderTeamName && (
                  <p className={`text-sm mb-2 ${isMyBid ? "text-green-300" : "text-muted-foreground"}`}>
                    {isMyBid ? "🎉 Your bid is highest!" : `Highest: ${auctionState.currentBidderTeamName}`}
                  </p>
                )}

                {timer !== null && (
                  <div className={`text-2xl font-mono font-bold mb-6 ${timer <= 5 ? "text-red-400 animate-pulse" : timer <= 10 ? "text-yellow-400" : "text-muted-foreground"}`}>
                    {timer}s
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                  {myTeam && (
                    <Button
                      size="lg"
                      className="h-14 px-10 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                      onClick={handleBid}
                      disabled={placeBid.isPending || isMyBid}
                    >
                      <Gavel className="w-5 h-5 mr-2" />
                      BID ₹{(currentBid + 0.5).toFixed(1)} Cr
                    </Button>
                  )}
                  {isHost && (
                    <>
                      <Button variant="outline" size="lg" className="h-14" onClick={handleSold} disabled={markSold.isPending}>
                        <Trophy className="w-5 h-5 mr-2" />
                        SOLD
                      </Button>
                      <Button variant="outline" size="lg" className="h-14" onClick={handleUnsold} disabled={markUnsold.isPending}>
                        <X className="w-5 h-5 mr-2" />
                        Unsold
                      </Button>
                    </>
                  )}
                </div>

                {isHost && (
                  <Button variant="ghost" size="sm" className="mt-4 text-muted-foreground" onClick={handleNext} disabled={nextPlayer.isPending}>
                    <SkipForward className="w-4 h-4 mr-1" />
                    Next Player
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-border overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Team Budgets</h2>
            <div className="space-y-2">
              {(roomTeams ?? []).map((team) => {
                const spent = team.budgetSpentCrore;
                const total = spent + team.budgetRemainingCrore;
                const pct = total > 0 ? (spent / total) * 100 : 0;
                const isMyTeam = myTeam?.id === team.id;

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-lg border transition-colors ${isMyTeam ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                          style={{ backgroundColor: team.primaryColor }}
                        >
                          {team.shortName.slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold">{team.shortName}</span>
                        {isMyTeam && <span className="text-xs text-primary">(You)</span>}
                      </div>
                      <span className="text-xs font-mono text-green-400">₹{team.budgetRemainingCrore.toFixed(1)}Cr</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: team.primaryColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
