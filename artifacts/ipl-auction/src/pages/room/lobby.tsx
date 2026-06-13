import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetRoom, getGetRoomQueryKey,
  useGetRoomMembers, getGetRoomMembersQueryKey,
  useGetRoomTeams, getGetRoomTeamsQueryKey,
  useGetSeasonTeams,
  useStartAuction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Check, Crown, Lock } from "lucide-react";

export default function RoomLobby() {
  const params = useParams();
  const code = params.code as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const socket = useSocket(code);
  const [copied, setCopied] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const { data: room, isLoading: roomLoading } = useGetRoom(code, {
    query: { queryKey: getGetRoomQueryKey(code) },
  });

  const { data: members } = useGetRoomMembers(code, {
    query: { queryKey: getGetRoomMembersQueryKey(code) },
  });

  const { data: roomTeams, refetch: refetchTeams } = useGetRoomTeams(code, {
    query: { queryKey: getGetRoomTeamsQueryKey(code) },
  });

  const { data: franchises } = useGetSeasonTeams(room?.seasonYear ?? 2025, {
    query: { enabled: !!room?.seasonYear, queryKey: [`/api/seasons/${room?.seasonYear ?? 2025}/teams`] },
  });

  const startAuction = useStartAuction();

  const isHost = room?.hostUserId === user?.id;

  const myTeam = roomTeams?.find((t) =>
    t.owners.some((o) => o.userId === user?.id)
  );

  useEffect(() => {
    if (!socket) return;
    const onFranchiseSelected = () => {
      queryClient.invalidateQueries({ queryKey: getGetRoomTeamsQueryKey(code) });
      queryClient.invalidateQueries({ queryKey: getGetRoomMembersQueryKey(code) });
    };
    const onMemberJoined = () => {
      queryClient.invalidateQueries({ queryKey: getGetRoomMembersQueryKey(code) });
    };
    const onStatusChanged = ({ status }: { status: string }) => {
      if (status === "preparation") setLocation(`/room/${code}/prepare`);
    };
    socket.on("room:franchise_selected", onFranchiseSelected);
    socket.on("room:member_joined", onMemberJoined);
    socket.on("room:status_changed", onStatusChanged);
    return () => {
      socket.off("room:franchise_selected", onFranchiseSelected);
      socket.off("room:member_joined", onMemberJoined);
      socket.off("room:status_changed", onStatusChanged);
    };
  }, [socket, code, queryClient, setLocation]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectFranchise = async (franchiseId: number) => {
    if (!user || myTeam) return;
    setSelectingId(franchiseId);
    try {
      const res = await fetch(`/api/rooms/${code}/teams/${franchiseId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          displayName: user.fullName || user.username || "Player",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Could not select franchise", description: err.error });
        return;
      }
      await refetchTeams();
      queryClient.invalidateQueries({ queryKey: getGetRoomMembersQueryKey(code) });
      toast({ title: "Franchise selected!" });
    } catch {
      toast({ variant: "destructive", title: "Error selecting franchise" });
    } finally {
      setSelectingId(null);
    }
  };

  const handleStart = () => {
    startAuction.mutate(
      { code },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
          setLocation(`/room/${code}/prepare`);
        },
        onError: () => toast({ variant: "destructive", title: "Failed to start" }),
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
  if (!room) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Room not found</div>;

  const takenFranchiseIds = new Set(roomTeams?.map((t) => t.franchiseId) ?? []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{room.name}</h1>
          <p className="text-xs text-muted-foreground">IPL {room.seasonYear} · {room.auctionType === "mega" ? "Mega" : "Mini"} Auction</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-mono font-bold"
          >
            {code}
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {isHost && (
            <Button onClick={handleStart} disabled={startAuction.isPending} size="sm">
              {startAuction.isPending ? "Starting..." : "Start → Retention"}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Select Your Franchise
              {myTeam && (
                <span className="text-sm font-normal text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                  You picked: {myTeam.shortName}
                </span>
              )}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(franchises ?? []).map((franchise) => {
                const isTaken = takenFranchiseIds.has(franchise.id);
                const isMine = myTeam?.franchiseId === franchise.id;
                const isSelecting = selectingId === franchise.id;
                const takenTeam = roomTeams?.find((t) => t.franchiseId === franchise.id);
                const isFull = takenTeam && takenTeam.owners.length >= room.maxOwnersPerTeam;
                const canJoin = isTaken && !isFull && !isMine && !myTeam && room.maxOwnersPerTeam > 1;

                return (
                  <button
                    key={franchise.id}
                    onClick={() => !isMine && !isFull && !myTeam || canJoin ? handleSelectFranchise(franchise.id) : undefined}
                    disabled={isSelecting || (isFull && !isMine) || (!!myTeam && !isMine)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                      ${isMine
                        ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                        : isFull && !canJoin
                        ? "border-border/30 bg-muted/30 opacity-50 cursor-not-allowed"
                        : myTeam && !isMine
                        ? "border-border/30 opacity-40 cursor-not-allowed"
                        : "border-border hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
                      }`}
                    style={{ borderColor: isMine ? franchise.primaryColor : isTaken && !canJoin ? undefined : undefined }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black"
                      style={{ backgroundColor: franchise.primaryColor }}
                    >
                      {franchise.shortName.slice(0, 2)}
                    </div>
                    <span className="text-xs font-bold">{franchise.shortName}</span>
                    {isFull && !isMine && (
                      <span className="absolute -top-1.5 -right-1.5 bg-muted rounded-full p-0.5">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </span>
                    )}
                    {isMine && (
                      <span className="absolute -top-1.5 -right-1.5 bg-green-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {takenTeam && !isFull && (
                      <span className="text-[10px] text-muted-foreground">
                        {takenTeam.owners.length}/{room.maxOwnersPerTeam}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players ({members?.length ?? 0})
            </h2>
            <div className="space-y-2">
              {members?.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: "#3b82f6" }}
                  >
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">{member.displayName}</p>
                      {room.hostUserId === member.userId && (
                        <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.teamName ?? "No franchise"}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${member.isOnline ? "bg-green-400" : "bg-muted-foreground"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 text-sm space-y-2 text-muted-foreground">
            <p className="font-semibold text-foreground">Room Settings</p>
            <div className="grid grid-cols-2 gap-1">
              <span>Budget</span><span className="text-foreground text-right">₹{room.budgetCrore} Cr</span>
              <span>Squad Size</span><span className="text-foreground text-right">{room.maxSquadSize}</span>
              <span>Overseas Limit</span><span className="text-foreground text-right">{room.maxOverseas}</span>
              <span>Speed</span><span className="text-foreground text-right capitalize">{room.auctionSpeed}</span>
            </div>
          </div>

          {isHost && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
              <p className="font-semibold text-blue-200 mb-1">Host Controls</p>
              <p>Click "Start → Retention" when all players have joined and selected their franchises.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
