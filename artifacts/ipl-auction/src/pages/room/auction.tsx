import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetRoom, getGetRoomQueryKey,
  useGetRoomTeams, getGetRoomTeamsQueryKey,
  useGetCurrentAuctionPlayer, getGetCurrentAuctionPlayerQueryKey,
  usePlaceBid,
  useCompleteAuction,
  useMakeRtmDecision,
  useListAuctionPool,
  getListAuctionPoolQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/use-socket";
import { useAppUser } from "@/hooks/useAppAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Gavel, Trophy, SkipForward, X, Zap, Activity, MessageSquare, Timer, History, Award, AlertTriangle, Users } from "lucide-react";

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

type BidEvent = {
  teamName: string;
  amount: number;
  isRtm?: boolean;
  timestamp: string;
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
    <div className="flex flex-col items-center gap-0.5 bg-white/5 rounded-xl px-4 py-2.5 min-w-[70px] border border-white/5">
      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{label}</span>
      <span className="text-sm font-extrabold text-white">{value}</span>
    </div>
  );
}

export default function RoomAuction() {
  const params = useParams();
  const code = params.code as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAppUser();
  const socket = useSocket(code);

  const [timer, setTimer] = useState<number | null>(null);
  const [bidHistory, setBidHistory] = useState<BidEvent[]>([]);
  const [pulseBid, setPulseBid] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPlayerIdRef = useRef<number | null>(null);
  const prevBidderRef = useRef<number | null>(null);
  const prevBidRef = useRef<number>(0);

  const { data: room } = useGetRoom(code, { query: { queryKey: getGetRoomQueryKey(code) } });
  const { data: roomTeams } = useGetRoomTeams(code, { query: { queryKey: getGetRoomTeamsQueryKey(code) } });
  const { data: auctionState, isLoading: auctionLoading } = useGetCurrentAuctionPlayer(code, {
    query: { queryKey: getGetCurrentAuctionPlayerQueryKey(code) },
  });
  const { data: poolData } = useListAuctionPool(code, { status: "available" });

  const myTeam = roomTeams?.find((t) => t.owners.some((o) => o.userId === user?.id));
  const isHost = room?.hostUserId === user?.id;

  const placeBid = usePlaceBid();
  const completeAuction = useCompleteAuction();
  const makeRtmDecision = useMakeRtmDecision();

  const refreshAuction = () => {
    queryClient.invalidateQueries({ queryKey: getGetCurrentAuctionPlayerQueryKey(code) });
    queryClient.invalidateQueries({ queryKey: getListAuctionPoolQueryKey(code, { status: "available" }) });
  };
  const refreshTeams = () => queryClient.invalidateQueries({ queryKey: getGetRoomTeamsQueryKey(code) });

  const postAuctionAction = async (endpoint: "sold" | "unsold" | "next", body: any) => {
    setIsActionPending(true);
    try {
      const res = await fetch(`/api/rooms/${code}/auction/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      refreshAuction();
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Action failed", description: err.message });
    } finally {
      setIsActionPending(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onBid = (data: { teamName: string; bidAmountCrore: number }) => {
      setPulseBid(true);
      setTimeout(() => setPulseBid(false), 300);
      setBidHistory((prev) => [
        {
          teamName: data.teamName,
          amount: data.bidAmountCrore,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ]);
      refreshAuction();
      refreshTeams();
    };

    const onRtmPrompt = (data: { rtmPendingTeamId: number; bidAmountCrore: number; bidderTeamId: number }) => {
      setBidHistory((prev) => [
        {
          teamName: "SYSTEM ALERT",
          amount: data.bidAmountCrore,
          isRtm: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ]);
      refreshAuction();
      refreshTeams();
    };

    const onSold = (data: { teamName: string; soldPriceCrore: number; isRtmMatched: boolean }) => {
      toast({
        title: data.isRtmMatched ? "SOLD VIA RTM!" : "PLAYER SOLD!",
        description: `${data.teamName} secured player for ₹${data.soldPriceCrore} Cr`,
      });
      refreshAuction();
      refreshTeams();
    };

    const onUnsold = () => {
      toast({ title: "Player Unsold", description: "No bids were placed" });
      refreshAuction();
    };

    const onNext = () => {
      setBidHistory([]);
      refreshAuction();
    };

    const onComplete = () => {
      queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
      setLocation(`/room/${code}/results`);
    };

    socket.on("auction:bid", onBid);
    socket.on("auction:rtm_prompt", onRtmPrompt);
    socket.on("auction:sold", onSold);
    socket.on("auction:unsold", onUnsold);
    socket.on("auction:next", onNext);
    socket.on("auction:complete", onComplete);

    return () => {
      socket.off("auction:bid", onBid);
      socket.off("auction:rtm_prompt", onRtmPrompt);
      socket.off("auction:sold", onSold);
      socket.off("auction:unsold", onUnsold);
      socket.off("auction:next", onNext);
      socket.off("auction:complete", onComplete);
    };
  }, [socket, code, queryClient, setLocation, toast]);

  // Start/Reset timer when player changes or a bid is placed
  useEffect(() => {
    const currentId = (auctionState?.currentPlayer as any)?.playerId ?? null;
    if (currentId && auctionState?.timerSeconds) {
      const isNewPlayer = currentId !== prevPlayerIdRef.current;
      const isNewBid = auctionState?.currentBidderTeamId !== prevBidderRef.current || auctionState?.currentBidCrore !== prevBidRef.current;

      if (isNewPlayer || isNewBid) {
        prevPlayerIdRef.current = currentId;
        prevBidderRef.current = auctionState?.currentBidderTeamId ?? null;
        prevBidRef.current = auctionState?.currentBidCrore ?? 0;
        startTimer(auctionState.timerSeconds);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [
    (auctionState?.currentPlayer as any)?.playerId,
    auctionState?.currentBidderTeamId,
    auctionState?.currentBidCrore,
    auctionState?.timerSeconds
  ]);

  // Handle RTM timer reset or start
  useEffect(() => {
    if (auctionState?.status === "rtm") {
      startTimer(30); // 30 seconds for RTM matching choice
    }
  }, [auctionState?.status]);

  // Redirect if status is not auction
  useEffect(() => {
    if (room && room.status !== "auction") {
      if (room.status === "lobby") {
        setLocation(`/room/${code}/lobby`);
      } else if (room.status === "preparation") {
        setLocation(`/room/${code}/prepare`);
      } else if (room.status === "completed") {
        setLocation(`/room/${code}/results`);
      }
    }
  }, [room, code, setLocation]);

  // Auto-advance auction when timer hits 0
  useEffect(() => {
    if (timer === 0) {
      const activePlayerId = (auctionState?.currentPlayer as any)?.playerId;
      if (!activePlayerId) return;

      if (auctionState?.status === "bidding") {
        if (auctionState?.currentBidderTeamId) {
          handleSold(activePlayerId);
        } else {
          handleNext(activePlayerId);
        }
      } else if (auctionState?.status === "rtm") {
        handleRtmDecision(false);
      }
    }
  }, [timer, auctionState?.status, auctionState?.currentBidderTeamId, auctionState?.currentPlayer]);

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
    const nextBid = Math.round((currentBid + (currentBid < 10 ? 0.25 : 0.5)) * 100) / 100;
    if (nextBid > myTeam.budgetRemainingCrore) { toast({ variant: "destructive", title: "Insufficient budget remaining!" }); return; }
    
    placeBid.mutate(
      { code, data: { teamId: myTeam.id, bidAmountCrore: nextBid } },
      { onError: (err: any) => toast({ variant: "destructive", title: "Bid failed", description: err?.message }) }
    );
  };

  const handleRtmDecision = (useRtm: boolean) => {
    makeRtmDecision.mutate(
      { code, data: { useRtm } },
      {
        onSuccess: () => {
          toast({ title: useRtm ? "RTM matched!" : "RTM declined." });
          refreshAuction();
          refreshTeams();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "RTM decision failed", description: err?.message }),
      }
    );
  };

  const handleSold = (pId?: number) => {
    const activeId = pId ?? (auctionState?.currentPlayer as any)?.playerId;
    if (!activeId) return;
    postAuctionAction("sold", { playerId: activeId });
  };

  const handleUnsold = (pId?: number) => {
    const activeId = pId ?? (auctionState?.currentPlayer as any)?.playerId;
    if (!activeId) return;
    postAuctionAction("unsold", { playerId: activeId });
  };

  const handleNext = async (pId?: number) => {
    const activeId = pId ?? (auctionState?.currentPlayer as any)?.playerId;
    await postAuctionAction("next", { playerId: activeId });
    prevPlayerIdRef.current = null;
  };

  const handleComplete = () => completeAuction.mutate({ code }, { onSuccess: () => setLocation(`/room/${code}/results`) });

  const currentPlayer = auctionState?.currentPlayer as PlayerCard | null | undefined;
  const currentBid = auctionState?.currentBidCrore ?? 0;
  const isMyBid = auctionState?.currentBidderTeamId === myTeam?.id;
  const timerMax = auctionState?.status === "rtm" ? 30 : (auctionState?.timerSeconds ?? 30);
  const timerPct = timer !== null ? Math.max(0, (timer / timerMax) * 100) : 100;
  const timerDanger = timer !== null && timer <= 5;
  const timerWarn = timer !== null && timer <= 10 && !timerDanger;
  const color = roleColor(currentPlayer?.role ?? "");

  // RTM status flags
  const isRtmActive = auctionState?.status === "rtm";
  const isMyRtmPending = myTeam && auctionState?.rtmPendingTeamId === myTeam.id;

  return (
    <div className="min-h-screen bg-broadcast text-foreground flex flex-col relative overflow-hidden">
      {/* Background glow points */}
      <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]" />
      {currentPlayer && (
        <div
          className="absolute top-[-10%] left-[25%] w-[50%] h-[40%] rounded-full opacity-20 pointer-events-none blur-[120px] transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${color} 0%, transparent 80%)` }}
        />
      )}

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-black/30 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="font-extrabold text-lg tracking-wide text-white">{room?.name ?? "IPL Live Auction"}</h1>
          <p className="text-xs text-slate-400 font-mono">
            Room Code: <span className="text-amber-400 font-semibold">{code}</span> · {auctionState?.totalPlayersAuctioned ?? 0} Sold/Unsold · {auctionState?.totalPlayersRemaining ?? 0} Left
          </p>
        </div>
        <div className="flex items-center gap-4">
          {myTeam && (
            <div className="text-right bg-white/5 border border-white/5 rounded-xl px-4 py-1.5 shadow-inner">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{myTeam.franchiseName}</p>
              <p className="text-sm font-black text-emerald-400 font-mono">₹{myTeam.budgetRemainingCrore.toFixed(2)} Cr Purse</p>
            </div>
          )}
          {isHost && (
            <Button variant="outline" size="sm" className="glass-card hover:bg-rose-500/20 hover:text-rose-400 border-rose-500/30" onClick={handleComplete} disabled={completeAuction.isPending}>
              End Auction Session
            </Button>
          )}
        </div>
      </header>

      {/* Timer Bar */}
      <div className="h-1.5 bg-white/5 relative z-15">
        <div
          className={`h-full transition-all duration-1000 ${timerDanger ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : timerWarn ? "bg-yellow-500 shadow-[0_0_10px_#eab308]" : "bg-emerald-500"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 relative z-10 overflow-hidden">
        {/* Left Side / Center Side: Player & Bid Area (3/4 width) */}
        <div className="lg:col-span-3 flex flex-col p-6 gap-6 overflow-y-auto">
          <div
            className="flex-1 glass-panel border border-white/10 rounded-3xl p-8 shadow-2xl relative flex flex-col items-center justify-between min-h-[500px]"
            style={{ borderColor: currentPlayer ? `${color}30` : undefined }}
          >
            {auctionLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !currentPlayer ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md py-12">
                <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 glow-gold animate-bounce">
                  <Award className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-3">
                  {auctionState?.status === "completed" ? "AUCTION CONCLUDED!" : "WAITING TO DRAW"}
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {auctionState?.status === "completed"
                    ? "Congratulations! All players in the auction pool have been processed. View full results and squad listings."
                    : "The simulator is ready. Draw the first player card to start live multiplayer bidding."}
                </p>
                {isHost && auctionState?.status !== "completed" && (
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold h-12 px-8 rounded-xl glow-gold hover:scale-105 active:scale-95 transition-all" onClick={() => handleNext()} disabled={isActionPending}>
                    <Gavel className="w-5 h-5 mr-2" />
                    Draw First Player
                  </Button>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center relative">
                
                {/* RTM Choice Modal Overlay */}
                {isRtmActive && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl p-6">
                    <div className="glass-panel border-amber-500/30 glow-gold max-w-md w-full p-6 text-center space-y-6 rounded-2xl animate-in zoom-in-95 duration-200">
                      <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 animate-pulse border border-amber-500/30">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase text-white tracking-wider text-glow-yellow">Right to Match Active!</h3>
                        <p className="text-sm text-slate-300">
                          Former team <span className="font-extrabold text-amber-400">{auctionState.rtmPendingTeamName}</span> can match the current high bid of <span className="font-bold text-white">₹{currentBid} Cr</span> placed by {auctionState.currentBidderTeamName}.
                        </p>
                      </div>

                      {isMyRtmPending ? (
                        <div className="space-y-4">
                          <p className="text-xs text-amber-500 font-bold uppercase tracking-widest animate-pulse">Your team's decision is required</p>
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              onClick={() => handleRtmDecision(true)} 
                              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold h-12 shadow-lg glow-gold hover:opacity-90 transition-all"
                              disabled={makeRtmDecision.isPending}
                            >
                              MATCH (₹{currentBid} Cr)
                            </Button>
                            <Button 
                              onClick={() => handleRtmDecision(false)} 
                              variant="outline"
                              className="border-white/10 hover:bg-white/10 text-white font-bold h-12"
                              disabled={makeRtmDecision.isPending}
                            >
                              RELEASE
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-slate-400">Waiting for {auctionState.rtmPendingTeamName} to decide within {timer} seconds...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Player Profile Details */}
                <div className="w-full flex flex-col items-center">
                  
                  {/* Previous Team */}
                  {currentPlayer.previousTeamName && (
                    <div
                      className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                      style={{
                        backgroundColor: `${currentPlayer.previousTeamColor ?? "#374151"}15`,
                        color: currentPlayer.previousTeamColor ?? "#9ca3af",
                        border: `1px solid ${currentPlayer.previousTeamColor ?? "#374151"}25`,
                      }}
                    >
                      Former Franchise: {currentPlayer.previousTeamShortName ?? currentPlayer.previousTeamName}
                    </div>
                  )}

                  {/* Attributes Badges */}
                  <div className="flex items-center gap-2 flex-wrap justify-center mb-6">
                    <span className="px-3 py-1 rounded-full text-xs font-black text-white uppercase tracking-wider" style={{ backgroundColor: color }}>
                      {currentPlayer.role}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-slate-300">
                      {currentPlayer.nationality}
                    </span>
                    {currentPlayer.isOverseas && (
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        Overseas
                      </span>
                    )}
                    {currentPlayer.isCapped && (
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        Capped
                      </span>
                    )}
                    {currentPlayer.age && (
                      <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-full text-xs font-medium">
                        Age {currentPlayer.age}
                      </span>
                    )}
                  </div>

                  {/* Player Name */}
                  <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 leading-none uppercase">
                    {currentPlayer.name}
                  </h2>

                  {/* Skill Subtext */}
                  {(currentPlayer.battingStyle || currentPlayer.bowlingStyle) && (
                    <p className="text-sm text-slate-400 font-medium mb-6">
                      {currentPlayer.battingStyle}
                      {currentPlayer.battingStyle && currentPlayer.bowlingStyle && " · "}
                      {currentPlayer.bowlingStyle}
                    </p>
                  )}

                  {/* Dynamic Stats Grid */}
                  {currentPlayer.matchesPlayed && (
                    <div className="flex flex-wrap gap-2.5 justify-center mb-8">
                      <StatPill label="Matches" value={currentPlayer.matchesPlayed} />
                      {(currentPlayer.runs != null && currentPlayer.runs > 0) && (
                        <>
                          <StatPill label="Runs" value={currentPlayer.runs} />
                          {currentPlayer.highScore && <StatPill label="HS" value={currentPlayer.highScore} />}
                          {currentPlayer.strikeRate && <StatPill label="SR" value={currentPlayer.strikeRate.toFixed(1)} />}
                        </>
                      )}
                      {(currentPlayer.wickets != null && currentPlayer.wickets > 0) && (
                        <>
                          <StatPill label="Wkts" value={currentPlayer.wickets} />
                          {currentPlayer.economy && <StatPill label="Eco" value={currentPlayer.economy.toFixed(2)} />}
                          {currentPlayer.bestBowling && <StatPill label="Best" value={currentPlayer.bestBowling} />}
                        </>
                      )}
                    </div>
                  )}

                  {/* Price Section */}
                  <div className="w-full max-w-md bg-black/20 border border-white/5 rounded-2xl p-6 flex items-center justify-between mb-6">
                    <div className="text-left">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Base Price</p>
                      <p className="text-lg font-black text-white font-mono">₹ {currentPlayer.basePriceCrore} Cr</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Current Bid</p>
                      <div className={`text-3xl font-black font-mono transition-all duration-300 ${pulseBid ? 'scale-110 text-amber-400 animate-bid-pulse' : isMyBid ? 'text-emerald-400' : 'text-white'}`}>
                        ₹ {currentBid} Cr
                      </div>
                    </div>
                  </div>

                  {/* Leading Bidder Label */}
                  {auctionState?.currentBidderTeamName ? (
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4
                      ${isMyBid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                      <Zap className={`w-3.5 h-3.5 ${isMyBid ? 'text-emerald-400' : 'text-slate-400'}`} />
                      {isMyBid ? "YOUR TEAM LEADS THE BID" : `LATEST BIDDER: ${auctionState.currentBidderTeamName}`}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800/20 text-slate-400 border border-white/5 text-xs font-bold mb-4 uppercase tracking-wider">
                      No Bidding activity yet — open at base price
                    </div>
                  )}

                  {/* Timer display */}
                  {timer !== null && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                      <Timer className="w-4 h-4 text-slate-400" />
                      Countdown: <span className={`font-mono text-sm ml-1 ${timerDanger ? 'text-red-500 animate-pulse font-black' : 'text-white font-bold'}`}>{timer} seconds</span>
                    </div>
                  )}

                </div>

                {/* Controls Area */}
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg justify-center">
                    {myTeam && (
                      <Button
                        size="lg"
                        className="h-14 px-8 text-lg font-black uppercase tracking-wider flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl shadow-lg hover:opacity-90 transition-all glow-gold hover:scale-[1.01] active:scale-[0.99]"
                        onClick={handleBid}
                        disabled={placeBid.isPending || isMyBid || isRtmActive}
                      >
                        <Gavel className="w-5 h-5 mr-2" />
                        Place Bid (₹{(currentBid + (currentBid < 10 ? 0.25 : 0.5)).toFixed(2)} Cr)
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar split between Feed/Players (top) and Team Budgets (bottom) */}
        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/5 bg-black/10 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
          
          {/* Top Half: Tabs for Bidding Feed / Players Left */}
          <Tabs defaultValue="feed" className="flex-1 flex flex-col overflow-hidden border-b border-white/5 p-5">
            <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 p-1 mb-4 rounded-xl">
              <TabsTrigger value="feed" className="data-[state=active]:bg-white/10 text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg text-slate-400 data-[state=active]:text-white transition-all">
                Bidding Feed
              </TabsTrigger>
              <TabsTrigger value="players" className="data-[state=active]:bg-white/10 text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg text-slate-400 data-[state=active]:text-white transition-all">
                Players Left
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="flex-1 flex flex-col overflow-hidden mt-0">
              <h3 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-500" />
                Live Bidding Events
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {bidHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                    <p className="text-xs font-semibold">Feed is empty</p>
                    <p className="text-[10px] text-slate-600">Bids will appear here in real time</p>
                  </div>
                ) : (
                  bidHistory.map((bh, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all animate-in slide-in-from-top-1
                        ${bh.isRtm 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : idx === 0 
                          ? 'bg-white/5 border-white/10 text-white font-bold shadow-inner' 
                          : 'bg-black/20 border-white/5 text-slate-400'}`}
                    >
                      <div>
                        <span className="font-bold">{bh.teamName}</span>
                        {bh.isRtm && <span className="ml-1 text-[9px] font-black uppercase bg-amber-500/20 px-1 rounded">RTM</span>}
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-bold font-mono">₹{bh.amount.toFixed(2)} Cr</span>
                        <span className="text-[9px] text-slate-500 font-mono">{bh.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="players" className="flex-1 flex flex-col overflow-hidden mt-0">
              <h3 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Remaining Pool ({poolData?.length ?? 0})
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {!poolData || poolData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1">
                    <Users className="w-8 h-8 text-slate-600" />
                    <p className="text-xs font-semibold">No players left</p>
                    <p className="text-[10px] text-slate-600">All players have been drawn</p>
                  </div>
                ) : (
                  poolData.map((p) => {
                    const skillColor = roleColor(p.role);
                    return (
                      <div 
                        key={p.id} 
                        className="p-2.5 rounded-xl border bg-black/20 border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition-all"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-bold text-white uppercase truncate">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-1.5 h-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: skillColor }}
                            />
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{p.role}</span>
                            <span className="text-[10px] text-slate-500">· {p.nationality}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold font-mono text-amber-400 bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded-lg">
                            ₹{p.basePriceCrore.toFixed(2)} Cr
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Bottom Half: Team budgets */}
          <div className="flex-1 flex flex-col overflow-hidden p-5 bg-black/10">
            <h2 className="font-extrabold text-sm uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Squad Budgets
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(roomTeams ?? []).map((team) => {
                const spent = team.budgetSpentCrore;
                const remaining = team.budgetRemainingCrore;
                const total = spent + remaining;
                const pct = total > 0 ? (spent / total) * 100 : 0;
                const isMyTeam = myTeam?.id === team.id;
                const isHighBidder = auctionState?.currentBidderTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border transition-all duration-300
                      ${isHighBidder
                        ? "border-amber-400 bg-amber-500/5 shadow-md shadow-amber-500/5"
                        : isMyTeam
                        ? "border-white/15 bg-white/5"
                        : "border-white/5 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-black text-white text-[10px] shrink-0 shadow"
                          style={{ backgroundColor: team.primaryColor }}
                        >
                          {team.shortName.slice(0, 3)}
                        </div>
                        <span className="text-sm font-bold text-white truncate">{team.franchiseName}</span>
                        {isMyTeam && <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest shrink-0">(You)</span>}
                        {isHighBidder && <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />}
                      </div>
                      <span className={`text-xs font-mono font-bold shrink-0 ${remaining < 10 ? "text-rose-400" : "text-emerald-400"}`}>
                        ₹{remaining.toFixed(1)}Cr
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: team.primaryColor }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-medium font-mono">
                      <span>₹{spent.toFixed(1)} spent</span>
                      <span>₹{remaining.toFixed(1)} left</span>
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
