import { Link } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
// Assuming useGetMyRooms exists as specified
// import { useGetMyRooms } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  
  // const { data: rooms, isLoading } = useGetMyRooms({ query: { enabled: !!userId } });
  const rooms: any[] = [];
  const isLoading = false;

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur">
        <h1 className="text-xl font-bold tracking-tighter">IPL Auction</h1>
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your Rooms</h2>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/join">Join Room</Link>
            </Button>
            <Button asChild>
              <Link href="/create">Create Room</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div>Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-2">No active rooms</h3>
            <p className="text-muted-foreground mb-6">Create a room to start your auction experience</p>
            <Button asChild>
              <Link href="/create">Create Room</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link key={room.id} href={`/room/${room.code}`}>
                <div className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{room.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Code: <span className="font-mono text-foreground">{room.code}</span></p>
                    <p>Status: <span className="capitalize">{room.status}</span></p>
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