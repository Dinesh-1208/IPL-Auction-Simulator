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
import { Check, ChevronRight, Shield } from "lucide-react";

const RETENTION_PRICES = [18, 14, 11, 18, 14];

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

  const { data: seasonPlayers } = useListSeasonPlayers(
    room?.seasonYear ?? 2025,
    { teamId: myTeam?.franchiseId } as any,
    { query: { enabled: !!room?.seasonYear && !!myTeam, queryKey: [`/api/seasons/${room?.seasonYear ?? 2025}/players`, myTeam?.franchiseId] } }
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const retainPlayers = useRetainPlayers();
  const startAuction = useStartAuction();

  const isHost = room?.hostUserId === user?.id;
  const MAX_RETENTIONS = 5;

  useEffect(() => {
    if (!socket) return;
    const onStatusChanged = ({ status }: { status: string }) => {
      if (status === "auction") setLocation(`/room/${code}/auction`);
    };
    socket.on("room:status_changed", onStatusChanged);
    return () => { socket.off("room:status_changed", onStatusChanged); };
  }, [socket, code, setLocation]);

  const togglePlayer = (playerId: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= MAX_RETENTIONS) {
        toast({ title: `Max ${MAX_RETENTIONS} retentions allowed` });
        return prev;
      }
      return [...prev, playerId];
    });
  };

  const handleSubmitRetentions = () => {
    if (!myTeam) return;
    const retentionPricesCrore = selectedIds.map((_, i) => RETENTION_PRICES[i] ?? 5);
    retainPlayers.mutate(
      {
        code,
        teamId: myTeam.id,
        data: { playerIds: selectedIds, retentionPricesCrore },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomTeamsQueryKey(code) });
          toast({ title: "Retentions submitted!", description: `${selectedIds.length} player(s) retained` });
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
          <p className="text-xs text-muted-foreground">Retention Phase — Select players to keep</p>
        </div>
        {isHost && (
          <Button onClick={handleBeginAuction} disabled={startAuction.isPending}>
            {startAuction.isPending ? "Starting..." : "Begin Live Auction →"}
          </Button>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!myTeam ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-xl p-8 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Franchise Selected</h3>
              <p className="text-muted-foreground">You didn't select a franchise in the lobby. You can still participate in the auction.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${myTeam.primaryColor}30, transparent)`, borderBottom: `1px solid ${myTeam.primaryColor}40` }}
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
                    <p className="text-xs text-muted-foreground">Budget: ₹{myTeam.budgetRemainingCrore} Cr remaining</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length}/{MAX_RETENTIONS} retained
                </span>
              </div>

              {myTeam.retentionComplete ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Retentions Submitted</h3>
                  <p className="text-muted-foreground text-sm">{selectedIds.length} player(s) retained. Waiting for auction to begin.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {(seasonPlayers ?? []).length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No players found for this season. They will all enter the auction pool.
                    </div>
                  ) : (
                    (seasonPlayers ?? []).map((player) => {
                      const isSelected = selectedIds.includes(player.id);
                      const retentionIdx = selectedIds.indexOf(player.id);
                      const retentionCost = retentionIdx >= 0 ? RETENTION_PRICES[retentionIdx] : null;

                      return (
                        <div
                          key={player.id}
                          onClick={() => togglePlayer(player.id)}
                          className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors
                            ${isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40"}`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                            ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{player.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="px-1.5 py-0.5 bg-muted rounded">{player.role}</span>
                              <span>{player.nationality}</span>
                              {player.isOverseas && <span className="text-yellow-500">Overseas</span>}
                            </div>
                          </div>
                          {isSelected && retentionCost !== null && (
                            <span className="text-sm font-bold text-green-400 shrink-0">₹{retentionCost} Cr</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {!myTeam.retentionComplete && (
                <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Cost: ₹{selectedIds.reduce((sum, _, i) => sum + (RETENTION_PRICES[i] ?? 5), 0)} Cr deducted
                  </p>
                  <Button onClick={handleSubmitRetentions} disabled={retainPlayers.isPending} size="sm">
                    <ChevronRight className="w-4 h-4 mr-1" />
                    {retainPlayers.isPending ? "Submitting..." : "Lock In Retentions"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold mb-3">Team Status</h2>
            <div className="space-y-2">
              {(roomTeams ?? []).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.shortName.slice(0, 2)}
                    </div>
                    <span className="font-medium">{team.shortName}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${team.retentionComplete ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {team.retentionComplete ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-sm">
            <h3 className="font-semibold mb-2">Retention Prices</h3>
            <div className="space-y-1 text-muted-foreground">
              {RETENTION_PRICES.map((price, i) => (
                <div key={i} className="flex justify-between">
                  <span>Retention #{i + 1}</span>
                  <span className="text-foreground">₹{price} Cr</span>
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
              <p className="font-semibold text-blue-200 mb-1">Host: Start Auction</p>
              <p>Click "Begin Live Auction" when teams are ready. Players not retained will enter the auction pool.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
