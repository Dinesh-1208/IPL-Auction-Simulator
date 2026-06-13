import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(1, "Room code is required").toUpperCase(),
});

export default function JoinRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    try {
      const res = await fetch(`/api/rooms/${values.code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          displayName: user.fullName || user.username || "Player",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Failed to join", description: err.error || "Room not found" });
        return;
      }

      toast({ title: "Joined room!", description: `Welcome to room ${values.code}` });
      setLocation(`/room/${values.code}`);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not connect to server" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Join Room</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Enter Room Code</h2>
            <p className="text-muted-foreground text-sm">Ask the host for the room code to join their auction</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. IPLXYZ123"
                        className="uppercase text-center text-xl font-mono tracking-widest h-14"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!user}>
                Join Room
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
