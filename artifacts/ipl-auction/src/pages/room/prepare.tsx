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
import { useUser } from "@clerk/react";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronRight, Shield, Info, ChevronDown } from "lucide-react";

// ─── Official IPL 2025 retention rules ────────────────────────────────────────
// Capped retentions: slots 1,2,3 then if also retaining more the cost resets
// Uncapped: ₹4 Cr each (max 2)
// Total max: 6 (any combination)
// Starting purse: ₹120 Cr

const MAX_RETENTIONS = 6;
const MAX_UNCAPPED_RETENTIONS = 2;
const CAPPED_RETENTION_COSTS = [18, 14, 11, 18, 14, 11]; // repeating pattern
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
  const { user } = useUser();
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

      // Check max retentions
      if (prev.length >= MAX_RETENTIONS) {
        toast({ title: `Max ${MAX_RETENTIONS} retentions allowed under official IPL rules` });
        return prev;
      }

      // Check uncapped limit
      if (!(player.isCapped ?? true)) {
        const uncappedCount = prev.filter((id) => {
          const p = seasonPlayers?.find((sp) => sp.id === id);
          return !(p?.isCapped ?? true);
        }).length;
        if (uncappedCount >= MAX_UNCAPPED_RETENTIONS) {
          toast({ title: `Max ${MAX_UNCAPPED_RETENTIONS} uncapped players can be retained` });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{room?.name ?? "Auction Room"}</h1>
          <p className="text-xs text-muted-foreground">
            Retention Phase · IPL {room?.seasonYear} Squads → {(room?.seasonYear ?? 2025) + 1} Auction
          </p>
        </div>
        {isHost && (
          <Button onClick={handleBeginAuction} disabled={startAuction.isPending}>
            {startAuction.isPending ? "Starting..." : "Begin Live Auction →"}
          </Button>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Retention rules toggle */}
          <button
            className="w-full flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left"
            onClick={() => setShowRules(!showRules)}
          >
            <div className="flex items-center gap-2 text-blue-300">
              <Info className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold">Official IPL Retention Rules</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-blue-400 transition-transform ${showRules ? "rotate-180" : ""}`} />
          </button>

          {showRules && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm space-y-3">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <p className="font-semibold text-blue-200 mb-1">Capped Player Costs</p>
                  {[1, 2, 3, 4, 5, 6].map((n, i) => (
                    <div key={n} className="flex justify-between text-muted-foreground">
                      <span>Retention #{n}</span>
                      <span className="text-foreground">₹{CAPPED_RETENTION_COSTS[i]} Cr</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-blue-200 mb-1">Rules Summary</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Max <strong className="text-foreground">6</strong> retentions total</li>
                    <li>Max <strong className="text-foreground">2</strong> uncapped players (₹4 Cr each)</li>
                    <li>Starting purse: <strong className="text-foreground">₹{startingBudget} Cr</strong></li>
                    <li>Released players enter auction pool</li>
                    <li>New players also enter the pool</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!myTeam ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-xl p-8 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Franchise Selected</h3>
              <p className="text-muted-foreground">You can still watch the auction. Retained players will be shown when the auction begins.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Franchise header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${myTeam.primaryColor}25, transparent)`, borderBottom: `1px solid ${myTeam.primaryColor}30` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                    style={{ backgroundColor: myTeam.primaryColor }}
                  >
                    {myTeam.shortName.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold">{myTeam.franchiseName}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{remainingAfterRetentions.toFixed(1)} Cr after retentions · {selectedIds.length}/{MAX_RETENTIONS} retained
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Purse deduction</p>
                  <p className="text-lg font-bold text-red-400">−₹{totalDeduction} Cr</p>
                </div>
              </div>

              {myTeam.retentionComplete ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Retentions Submitted!</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedIds.length} player(s) retained · ₹{totalDeduction} Cr deducted
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">Waiting for host to begin the auction.</p>
                </div>
              ) : (
                <>
                  {(seasonPlayers ?? []).length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No squad data found. All players will enter the auction pool.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {(seasonPlayers ?? []).map((player) => {
                        const isSelected = selectedIds.includes(player.id);
                        const retentionIdx = selectedIds.indexOf(player.id);
                        const retentionCost = retentionIdx >= 0 ? getRetentionCost(retentionIdx, player.isCapped ?? true) : null;
                        const rc = roleColor(player.role);

                        return (
                          <div
                            key={player.id}
                            onClick={() => togglePlayer(player)}
                            className={`flex items-start gap-4 px-6 py-3.5 cursor-pointer transition-colors group
                              ${isSelected ? "bg-primary/8 hover:bg-primary/12" : "hover:bg-muted/30"}`}
                          >
                            {/* Checkbox */}
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/50 group-hover:border-muted-foreground"}`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>

                            {/* Role indicator */}
                            <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: `${rc}60` }} />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{player.name}</span>
                                {!(player.isCapped ?? true) && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Uncapped</span>
                                )}
                                {player.isOverseas && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">Overseas</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                <span style={{ color: rc }}>{player.role}</span>
                                <span>·</span>
                                <span>{player.nationality}</span>
                                {player.age && <><span>·</span><span>Age {player.age}</span></>}
                                {player.matchesPlayed && (
                                  <>
                                    <span>·</span>
                                    <span>{player.matchesPlayed}M</span>
                                    {player.runs != null && <span>{player.runs} runs</span>}
                                    {player.wickets != null && <span>{player.wickets} wkts</span>}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Retention cost */}
                            <div className="text-right shrink-0">
                              {isSelected && retentionCost !== null ? (
                                <span className="text-sm font-bold text-red-400">−₹{retentionCost} Cr</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">₹{player.basePriceCrore} Cr base</span>
                              )}
                              {isSelected && (
                                <div className="text-[10px] text-muted-foreground">Slot #{retentionIdx + 1}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Submit bar */}
                  <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedIds.length === 0
                          ? "No players retained — full squad enters auction pool"
                          : `${selectedIds.length} retained · ₹${totalDeduction} Cr deducted`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Remaining purse: ₹{remainingAfterRetentions.toFixed(1)} Cr
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitRetentions}
                      disabled={retainPlayers.isPending}
                      size="sm"
                      className="shrink-0"
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
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold mb-3">Team Status</h2>
            <div className="space-y-2">
              {(roomTeams ?? []).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.shortName.slice(0, 2)}
                    </div>
                    <span className="font-medium">{team.shortName}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${team.retentionComplete ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {team.retentionComplete ? "✓ Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-sm">
            <h3 className="font-semibold mb-3">Retention Cost Guide</h3>
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5, 6].map((n, i) => (
                <div key={n} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Capped #{n}</span>
                  <span className="font-semibold">₹{CAPPED_RETENTION_COSTS[i]} Cr</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-1.5 flex justify-between items-center">
                <span className="text-muted-foreground">Uncapped (max 2)</span>
                <span className="font-semibold">₹{UNCAPPED_COST} Cr</span>
              </div>
            </div>
          </div>

          {isHost && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
              <p className="font-semibold text-blue-200 mb-1">Host: Begin Auction</p>
              <p>Click "Begin Live Auction" when all teams are done with retentions. Released players enter the auction pool automatically.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
