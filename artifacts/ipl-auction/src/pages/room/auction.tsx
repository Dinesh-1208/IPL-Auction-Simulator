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
import { Gavel, Trophy, SkipForward, X, Zap, Target, Activity } from "lucide-react";

type PlayerCard = {
  name: string;
  role: string;
  nationality: string;
  isOverseas: boolean;
  isCapped?: boolean;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  age?: number | null;
  basePriceCrore: number;
  previousTeamName?: string | null;
  previousTeamShortName?: string | null;
  previousTeamColor?: string | null;
  matchesPlayed?: number | null;
  runs?: number | null;
  wickets?: number | null;
  strikeRate?: number | null;
  economy?: number | null;
  highScore?: number | null;
  bestBowling?: string | null;
};

function roleColor(role: string) {
  switch (role) {
    case "Batter": return "#3b82f6";
    case "Bowler": return "#ef4444";
    case "All-Rounder": return "#8b5cf6";
    case "Wicket-Keeper": return "#f59e0b";
    default: return "#6b7280";
  }
}

function StatPill({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null;
  return (
    <div className="flex flex-col items-center gap-0.5 bg-white/5 rounded-lg px-3 py-2 min-w-[60px]">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

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
  const prevPlayerIdRef = useRef<number | null>(null);

  const { data: room } = useGetRoom(code, { query: { queryKey: getGetRoomQueryKey(code) } });
  const { data: roomTeams } = useGetRoomTeams(code, { query: { queryKey: getGetRoomTeamsQueryKey(code) } });
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
    const onSold = () => { refreshAuction(); refreshTeams(); };
    const onUnsold = () => { refreshAuction(); };
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

  // Start timer when player changes
  useEffect(() => {
    const currentId = (auctionState?.currentPlayer as any)?.playerId ?? null;
    if (currentId && currentId !== prevPlayerIdRef.current && auctionState?.timerSeconds) {
      prevPlayerIdRef.current = currentId;
      startTimer(auctionState.timerSeconds);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [(auctionState?.currentPlayer as any)?.playerId]);

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
    if (!myTeam) { toast({ variant: "destructive", title: "You need a franchise to bid!" }); return; }
    const currentBid = auctionState?.currentBidCrore ?? 0;
    const nextBid = Math.round((currentBid + 0.5) * 10) / 10;
    if (nextBid > myTeam.budgetRemainingCrore) { toast({ variant: "destructive", title: "Insufficient budget!" }); return; }
    placeBid.mutate(
      { code, data: { teamId: myTeam.id, bidAmountCrore: nextBid } },
      { onError: (err: any) => toast({ variant: "destructive", title: "Bid failed", description: err?.message }) }
    );
  };

  const handleSold = () => markSold.mutate({ code }, { onSuccess: refreshAuction });
  const handleUnsold = () => markUnsold.mutate({ code }, { onSuccess: refreshAuction });
  const handleNext = () => nextPlayer.mutate({ code }, { onSuccess: () => { refreshAuction(); prevPlayerIdRef.current = null; } });
  const handleComplete = () => completeAuction.mutate({ code }, { onSuccess: () => setLocation(`/room/${code}/results`) });

  const currentPlayer = auctionState?.currentPlayer as PlayerCard | null | undefined;
  const currentBid = auctionState?.currentBidCrore ?? 0;
  const isMyBid = auctionState?.currentBidderTeamId === myTeam?.id;
  const timerMax = auctionState?.timerSeconds ?? 30;
  const timerPct = timer !== null ? Math.max(0, (timer / timerMax) * 100) : 100;
  const timerDanger = timer !== null && timer <= 5;
  const timerWarn = timer !== null && timer <= 10 && !timerDanger;
  const color = roleColor(currentPlayer?.role ?? "");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg leading-tight">{room?.name ?? "Auction"}</h1>
          <p className="text-xs text-muted-foreground font-mono">
            {code} · {auctionState?.totalPlayersAuctioned ?? 0} auctioned · {auctionState?.totalPlayersRemaining ?? 0} remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          {myTeam && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">{myTeam.shortName}</p>
              <p className="text-sm font-bold text-green-400">₹{myTeam.budgetRemainingCrore.toFixed(1)} Cr</p>
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
      <div className="h-1.5 bg-muted/50 transition-all duration-1000">
        <div
          className={`h-full transition-all duration-1000 ${timerDanger ? "bg-red-500" : timerWarn ? "bg-yellow-500" : "bg-green-500"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        {/* Player Card (left 2/3) */}
        <div className="lg:col-span-2 flex flex-col p-4 gap-4 overflow-y-auto">
          <div
            className="flex-1 bg-card border border-border rounded-2xl overflow-hidden relative"
            style={{ minHeight: 400, borderColor: currentPlayer ? `${color}40` : undefined }}
          >
            {/* Background glow */}
            {currentPlayer && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${color} 0%, transparent 70%)` }}
              />
            )}

            {auctionLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !currentPlayer ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {auctionState?.status === "completed" ? "Auction Complete!" : "Ready to Begin"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {auctionState?.status === "completed"
                    ? "All players have been auctioned."
                    : "Draw the first player to start the auction."}
                </p>
                {isHost && auctionState?.status !== "completed" && (
                  <Button size="lg" onClick={handleNext} disabled={nextPlayer.isPending}>
                    <Gavel className="w-5 h-5 mr-2" />
                    Draw First Player
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center text-center relative z-10">
                {/* Previous team badge */}
                {currentPlayer.previousTeamName && (
                  <div
                    className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${currentPlayer.previousTeamColor ?? "#374151"}30`,
                      color: currentPlayer.previousTeamColor ?? "#9ca3af",
                      border: `1px solid ${currentPlayer.previousTeamColor ?? "#374151"}40`,
                    }}
                  >
                    Previously: {currentPlayer.previousTeamShortName ?? currentPlayer.previousTeamName}
                  </div>
                )}

                {/* Role + badges */}
                <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {currentPlayer.role}
                  </span>
                  <span className="px-3 py-1 bg-muted rounded-full text-sm font-semibold">
                    {currentPlayer.nationality}
                  </span>
                  {currentPlayer.isOverseas && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                      Overseas
                    </span>
                  )}
                  {currentPlayer.isCapped && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                      Capped
                    </span>
                  )}
                  {currentPlayer.age && (
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      Age {currentPlayer.age}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 leading-none">
                  {currentPlayer.name}
                </h2>

                {/* Batting / bowling style */}
                {(currentPlayer.battingStyle || currentPlayer.bowlingStyle) && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentPlayer.battingStyle}
                    {currentPlayer.battingStyle && currentPlayer.bowlingStyle && " · "}
                    {currentPlayer.bowlingStyle}
                  </p>
                )}

                {/* Season Stats */}
                {currentPlayer.matchesPlayed && (
                  <div className="flex flex-wrap gap-2 justify-center mb-5">
                    <StatPill label="Matches" value={currentPlayer.matchesPlayed} />
                    {(currentPlayer.runs != null) && (
                      <>
                        <StatPill label="Runs" value={currentPlayer.runs} />
                        {currentPlayer.highScore && <StatPill label="HS" value={currentPlayer.highScore} />}
                        {currentPlayer.strikeRate && <StatPill label="SR" value={currentPlayer.strikeRate.toFixed(1)} />}
                      </>
                    )}
                    {(currentPlayer.wickets != null) && (
                      <>
                        <StatPill label="Wickets" value={currentPlayer.wickets} />
                        {currentPlayer.economy && <StatPill label="Eco" value={currentPlayer.economy.toFixed(2)} />}
                        {currentPlayer.bestBowling && <StatPill label="Best" value={currentPlayer.bestBowling} />}
                      </>
                    )}
                  </div>
                )}

                {/* Base price */}
                <p className="text-muted-foreground text-sm mb-1">Base Price</p>
                <p className="text-lg font-semibold mb-4">₹{currentPlayer.basePriceCrore} Cr</p>

                {/* Current bid */}
                <div className={`text-5xl md:text-6xl font-black mb-1 ${isMyBid ? "text-green-400" : "text-primary"}`}>
                  ₹{currentBid} Cr
                </div>
                {auctionState?.currentBidderTeamName ? (
                  <p className={`text-sm mb-2 font-semibold ${isMyBid ? "text-green-300" : "text-muted-foreground"}`}>
                    {isMyBid ? "🎉 Your bid leads!" : `Highest: ${auctionState.currentBidderTeamName}`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-2">No bids yet — open at base price</p>
                )}

                {/* Timer */}
                {timer !== null && (
                  <div className={`text-3xl font-mono font-bold mb-6 ${timerDanger ? "text-red-400 animate-pulse" : timerWarn ? "text-yellow-400" : "text-muted-foreground"}`}>
                    {timer}s
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                  {myTeam && (
                    <Button
                      size="lg"
                      className="h-14 px-8 text-lg font-bold flex-1"
                      style={{ backgroundColor: myTeam ? "#2563eb" : undefined }}
                      onClick={handleBid}
                      disabled={placeBid.isPending || isMyBid}
                    >
                      <Gavel className="w-5 h-5 mr-2" />
                      BID ₹{(currentBid + 0.5).toFixed(1)} Cr
                    </Button>
                  )}
                  {isHost && (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-14 border-green-500/50 text-green-400 hover:bg-green-500/10"
                        onClick={handleSold}
                        disabled={markSold.isPending || !auctionState?.currentBidderTeamId}
                      >
                        <Trophy className="w-5 h-5 mr-1" />
                        SOLD
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-14 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={handleUnsold}
                        disabled={markUnsold.isPending}
                      >
                        <X className="w-5 h-5 mr-1" />
                        Unsold
                      </Button>
                    </>
                  )}
                </div>

                {isHost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-muted-foreground hover:text-foreground"
                    onClick={handleNext}
                    disabled={nextPlayer.isPending}
                  >
                    <SkipForward className="w-4 h-4 mr-1" />
                    Next Player
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Team Budgets */}
        <div className="border-t lg:border-t-0 lg:border-l border-border overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Team Budgets
            </h2>
            <div className="space-y-2">
              {(roomTeams ?? []).map((team) => {
                const spent = team.budgetSpentCrore;
                const total = spent + team.budgetRemainingCrore;
                const pct = total > 0 ? (spent / total) * 100 : 0;
                const isMyTeam = myTeam?.id === team.id;
                const isHighBidder = auctionState?.currentBidderTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isHighBidder
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                        : isMyTeam
                        ? "border-border bg-muted/30"
                        : "border-border/50 bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                          style={{ backgroundColor: team.primaryColor }}
                        >
                          {team.shortName.slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold">{team.shortName}</span>
                        {isMyTeam && <span className="text-[10px] text-primary font-medium">(You)</span>}
                        {isHighBidder && <Zap className="w-3.5 h-3.5 text-yellow-400" />}
                      </div>
                      <span className={`text-xs font-mono font-bold ${team.budgetRemainingCrore < 10 ? "text-red-400" : "text-green-400"}`}>
                        ₹{team.budgetRemainingCrore.toFixed(1)}Cr
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: team.primaryColor }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>₹{spent.toFixed(1)} spent</span>
                      <span>₹{team.budgetRemainingCrore.toFixed(1)} left</span>
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
