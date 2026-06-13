import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetRoom, getGetRoomQueryKey,
  useGetRoomTeams, getGetRoomTeamsQueryKey,
  useListSeasonPlayers,
  useRetainPlayers,
  useStartAuction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppUser } from "@/hooks/useAppAuth";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronRight, Shield, Info, ChevronDown, Trophy, Users, Calculator } from "lucide-react";

// Official/Custom IPL retention rules helper
const CAPPED_RETENTION_COSTS = [18, 14, 11, 18, 14, 11, 11, 11, 11, 11]; // repeating/fallback pattern
const UNCAPPED_COST = 4;

function getRetentionCost(idx: number, isCapped: boolean): number {
  if (!isCapped) return UNCAPPED_COST;
  return CAPPED_RETENTION_COSTS[idx] ?? 11;
}

type SeasonPlayer = {
  id: number;
  name: string;
  role: string;
  nationality: string;
  isOverseas: boolean;
  isCapped?: boolean;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  age?: number | null;
  basePriceCrore: number;
  franchiseId?: number | null;
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

export default function RoomPrepare() {
  const params = useParams();
  const code = params.code as string;
  const { user } = useAppUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const socket = useSocket(code);

  const { data: room, isLoading: roomLoading } = useGetRoom(code, {
    query: { queryKey: getGetRoomQueryKey(code) },
  });
  const { data: roomTeams } = useGetRoomTeams(code, {
    query: { queryKey: getGetRoomTeamsQueryKey(code) },
  });

  const myTeam = roomTeams?.find((t) => t.owners.some((o) => o.userId === user?.id));

  const { data: rawPlayers } = useListSeasonPlayers(
    room?.seasonYear ?? 2025,
    { teamId: myTeam?.franchiseId } as any,
    {
      query: {
        enabled: !!room?.seasonYear && !!myTeam,
        queryKey: [`/api/seasons/${room?.seasonYear ?? 2025}/players`, myTeam?.franchiseId],
      },
    }
  );
  const seasonPlayers = rawPlayers as SeasonPlayer[] | undefined;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showRules, setShowRules] = useState(false);
  const retainPlayers = useRetainPlayers();
  const startAuction = useStartAuction();
  const isHost = room?.hostUserId === user?.id;

  const maxRetentionsLimit = room?.maxRetentions ?? 6;
  const maxUncappedRetentions = 2;

  useEffect(() => {
    if (!socket) return;
    const onStatusChanged = ({ status }: { status: string }) => {
      if (status === "auction") setLocation(`/room/${code}/auction`);
    };
    socket.on("room:status_changed", onStatusChanged);
    return () => { socket.off("room:status_changed", onStatusChanged); };
  }, [socket, code, setLocation]);

  const togglePlayer = (player: SeasonPlayer) => {
    setSelectedIds((prev) => {
      if (prev.includes(player.id)) return prev.filter((id) => id !== player.id);

      // Check custom max retentions limit
      if (prev.length >= maxRetentionsLimit) {
        toast({ title: `Max ${maxRetentionsLimit} retentions allowed in this room` });
        return prev;
      }

      // Check uncapped limit
      if (!(player.isCapped ?? true)) {
        const uncappedCount = prev.filter((id) => {
          const p = seasonPlayers?.find((sp) => sp.id === id);
          return !(p?.isCapped ?? true);
        }).length;
        if (uncappedCount >= maxUncappedRetentions) {
          toast({ title: `Max ${maxUncappedRetentions} uncapped players can be retained` });
          return prev;
        }
      }

      return [...prev, player.id];
    });
  };

  // Calculate total purse deduction
  const totalDeduction = selectedIds.reduce((sum, id, idx) => {
    const player = seasonPlayers?.find((p) => p.id === id);
    return sum + getRetentionCost(idx, player?.isCapped ?? true);
  }, 0);

  const startingBudget = room ? parseFloat(String(room.budgetCrore)) : 120;
  const remainingAfterRetentions = startingBudget - totalDeduction;

  const handleSubmitRetentions = () => {
    if (!myTeam) return;
    const retentionPricesCrore = selectedIds.map((id, idx) => {
      const player = seasonPlayers?.find((p) => p.id === id);
      return getRetentionCost(idx, player?.isCapped ?? true);
    });
    retainPlayers.mutate(
      { code, teamId: myTeam.id, data: { playerIds: selectedIds, retentionPricesCrore } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomTeamsQueryKey(code) });
          toast({ title: "Retentions locked in!", description: `${selectedIds.length} player(s) retained · ₹${totalDeduction} Cr deducted` });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to submit retentions" }),
      }
    );
  };

  const handleBeginAuction = () => {
    startAuction.mutate(
      { code },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
          setLocation(`/room/${code}/auction`);
        },
        onError: () => toast({ variant: "destructive", title: "Failed to begin auction" }),
      }
    );
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-broadcast">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-broadcast text-foreground flex flex-col">
      <header className="px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {room?.name ?? "Auction Room"}
          </h1>
          <p className="text-xs text-slate-400">
            Retention Phase · IPL {room?.seasonYear} Squads → {(room?.seasonYear ?? 2025) + 1} Auction
          </p>
        </div>
        {isHost && (
          <Button 
            onClick={handleBeginAuction} 
            disabled={startAuction.isPending}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 shadow-lg hover:opacity-90 transition-all glow-green"
          >
            {startAuction.isPending ? "Starting..." : "Begin Live Auction →"}
          </Button>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 w-full relative z-10">
        <div className="lg:col-span-2 space-y-6">

          {/* Retention rules toggle */}
          <button
            className="w-full flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left hover:bg-blue-500/15 transition-all"
            onClick={() => setShowRules(!showRules)}
          >
            <div className="flex items-center gap-2 text-blue-300">
              <Info className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="text-sm font-semibold">Official IPL Retention & Purse Rules</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-blue-400 transition-transform ${showRules ? "rotate-180" : ""}`} />
          </button>

          {showRules && (
            <div className="glass-panel border-blue-500/20 rounded-xl p-6 text-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-blue-200 mb-2 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" />
                    Capped Player Cost Curve
                  </p>
                  <div className="space-y-1 bg-black/20 p-3 rounded-lg border border-white/5">
                    {[1, 2, 3, 4, 5, 6].map((n, i) => (
                      <div key={n} className="flex justify-between text-slate-300">
                        <span>Retention #{n}</span>
                        <span className="text-white font-mono font-semibold">₹{CAPPED_RETENTION_COSTS[i]} Cr</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-blue-200 mb-2">Rules Summary</p>
                  <ul className="space-y-2 text-slate-300 list-disc pl-4">
                    <li>Max <strong className="text-white">{maxRetentionsLimit}</strong> retentions allowed total</li>
                    <li>Max <strong className="text-white">{maxUncappedRetentions}</strong> uncapped players (₹4 Cr each)</li>
                    <li>Starting budget: <strong className="text-white">₹{startingBudget} Cr</strong></li>
                    <li>Released database players automatically populate the live bidding pool</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!myTeam ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] glass-panel border-white/10 rounded-2xl p-8 text-center space-y-4">
              <Shield className="w-16 h-16 text-slate-500 animate-pulse" />
              <h3 className="text-xl font-bold text-white">No Franchise Selected</h3>
              <p className="text-slate-400 max-w-sm">You are watching the prep room. Select a franchise or wait for the host to start the Live Auction.</p>
            </div>
          ) : (
            <div className="glass-panel border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Franchise header */}
              <div
                className="px-6 py-5 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${myTeam.primaryColor}20, transparent)`, borderBottom: `1px solid ${myTeam.primaryColor}25` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-base shadow-lg"
                    style={{ backgroundColor: myTeam.primaryColor, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                  >
                    {myTeam.shortName.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-extrabold text-lg text-white">{myTeam.franchiseName}</p>
                    <p className="text-xs text-slate-300 font-medium">
                      ₹{remainingAfterRetentions.toFixed(1)} Cr Left · {selectedIds.length}/{maxRetentionsLimit} Retained
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Locked-in Purse</p>
                  <p className="text-xl font-black text-glow-red text-rose-500">−₹{totalDeduction} Cr</p>
                </div>
              </div>

              {myTeam.retentionComplete ? (
                <div className="p-12 text-center space-y-4 bg-black/10">
                  <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/5 animate-bounce">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="font-extrabold text-xl text-white">Retentions Submitted!</h3>
                  <div className="text-sm text-slate-300 max-w-md mx-auto space-y-1">
                    <p>{selectedIds.length} player(s) secured for season squad.</p>
                    <p className="text-amber-400 font-semibold font-mono">₹{remainingAfterRetentions.toFixed(1)} Cr purse remains for live auction.</p>
                  </div>
                  <p className="text-xs text-slate-500 pt-2">Waiting for the coordinator/host to begin live bidding.</p>
                </div>
              ) : (
                <>
                  {(seasonPlayers ?? []).length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-black/10 font-medium">
                      No roster files detected for {myTeam.franchiseName} in IPL {room?.seasonYear}. <br />All matching players will go to the auction.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 bg-black/15 max-h-[600px] overflow-y-auto">
                      {(seasonPlayers ?? []).map((player) => {
                        const isSelected = selectedIds.includes(player.id);
                        const retentionIdx = selectedIds.indexOf(player.id);
                        const retentionCost = retentionIdx >= 0 ? getRetentionCost(retentionIdx, player.isCapped ?? true) : null;
                        const rc = roleColor(player.role);

                        return (
                          <div
                            key={player.id}
                            onClick={() => togglePlayer(player)}
                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-all duration-150 group
                              ${isSelected ? "bg-white/5 border-l-4" : "hover:bg-white/[0.03] border-l-4 border-l-transparent"}`}
                            style={{ borderLeftColor: isSelected ? myTeam.primaryColor : undefined }}
                          >
                            {/* Checkbox */}
                            <div className={`mt-1.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all
                              ${isSelected ? "border-amber-400 bg-amber-400" : "border-slate-600 group-hover:border-slate-400"}`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-black font-black" />}
                            </div>

                            {/* Color Tag */}
                            <div className="w-1.5 h-10 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: rc }} />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">{player.name}</span>
                                {!(player.isCapped ?? true) && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 rounded text-slate-400 uppercase tracking-wider">Uncapped</span>
                                )}
                                {player.isOverseas && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded uppercase tracking-wider">Overseas</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap font-medium">
                                <span style={{ color: rc }}>{player.role}</span>
                                <span>·</span>
                                <span>{player.nationality}</span>
                                {player.age && <><span>·</span><span>Age {player.age}</span></>}
                                {player.runs != null && player.runs > 0 && (
                                  <>
                                    <span>·</span>
                                    <span>{player.runs} Runs</span>
                                  </>
                                )}
                                {player.wickets != null && player.wickets > 0 && (
                                  <>
                                    <span>·</span>
                                    <span>{player.wickets} Wkts</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Retention cost */}
                            <div className="text-right shrink-0">
                              {isSelected && retentionCost !== null ? (
                                <span className="text-sm font-black text-rose-400 font-mono">−₹{retentionCost} Cr</span>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono">₹{player.basePriceCrore} Cr base</span>
                              )}
                              {isSelected && (
                                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Slot #{retentionIdx + 1}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Submit bar */}
                  <div className="px-6 py-5 border-t border-white/5 flex items-center justify-between bg-black/30">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {selectedIds.length === 0
                          ? "No retentions selected — entire squad enters pool"
                          : `${selectedIds.length} secured · ₹${totalDeduction} Cr locked`}
                      </p>
                      <p className="text-xs text-slate-400">
                        Remaining purse: ₹{remainingAfterRetentions.toFixed(1)} Cr
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitRetentions}
                      disabled={retainPlayers.isPending}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-5 py-2 shadow-md hover:opacity-90 transition-all glow-gold"
                    >
                      <ChevronRight className="w-4 h-4 mr-1" />
                      {retainPlayers.isPending ? "Submitting..." : "Lock In Retentions"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel border-white/10 rounded-2xl p-5 shadow-xl">
            <h2 className="font-extrabold text-white text-base mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Room Members
            </h2>
            <div className="space-y-3">
              {(roomTeams ?? []).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs shadow"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.shortName.slice(0, 3)}
                    </div>
                    <span className="font-bold text-white text-sm">{team.franchiseName}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider
                    ${team.retentionComplete ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-amber-500/15 text-amber-400 border-amber-500/25"}`}>
                    {team.retentionComplete ? "✓ Done" : "Drafting"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel border-white/10 rounded-2xl p-5 text-sm space-y-4">
            <h3 className="font-bold text-white text-base">Retention Price Guide</h3>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((n, i) => (
                <div key={n} className="flex justify-between items-center text-slate-300">
                  <span>Capped Securing Slot #{n}</span>
                  <span className="font-bold text-white font-mono">₹{CAPPED_RETENTION_COSTS[i]} Cr</span>
                </div>
              ))}
              <div className="border-t border-white/5 pt-2 flex justify-between items-center text-slate-300">
                <span>Uncapped Securing (Max 2)</span>
                <span className="font-bold text-white font-mono">₹{UNCAPPED_COST} Cr</span>
              </div>
            </div>
          </div>

          {isHost && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 text-sm text-amber-300 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                Host Control Room
              </p>
              <p className="text-slate-400">Click "Begin Live Auction" at the top once your friends have completed their lists. All remaining players will enter the bidding pool.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
