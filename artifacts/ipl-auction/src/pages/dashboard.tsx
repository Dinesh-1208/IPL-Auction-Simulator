import { Link } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Clock, Trophy } from "lucide-react";

interface RoomSummary {
  id: number;
  code: string;
  name: string;
  status: string;
  seasonYear: number;
  auctionType: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  lobby: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  preparation: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  auction: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  lobby: "Lobby",
  preparation: "Retention Phase",
  auction: "Live Auction",
  completed: "Completed",
};

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();

  const { data: rooms = [], isLoading } = useQuery<RoomSummary[]>({
    queryKey: ["/api/rooms/my", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/rooms/my?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-10">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-primary transition-colors">
          IPL Auction
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/join">Join Room</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/create">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Room
            </Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Your Rooms</h2>
            <p className="text-muted-foreground mt-1">Join or manage your IPL auction rooms</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-card rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-xl border border-border">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No rooms yet</h3>
            <p className="text-muted-foreground mb-6">Create a room to start your IPL auction experience</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/join">Join with Code</Link>
              </Button>
              <Button asChild>
                <Link href="/create">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Room
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Link key={room.id} href={`/room/${room.code}`}>
                <div className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1 flex-1 mr-2">
                      {room.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 ${statusColors[room.status] || statusColors.completed}`}>
                      {statusLabels[room.status] || room.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span className="capitalize">{room.auctionType} Auction · IPL {room.seasonYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                      {room.code}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
