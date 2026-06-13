import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import { useAppUser } from "@/hooks/useAppAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(1, "Room code is required").toUpperCase(),
});

export default function JoinRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAppUser();

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
          displayName: user.fullName || "Player",
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
    <div className="min-h-screen bg-broadcast flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[100px]" />

      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/5 backdrop-blur bg-black/20 relative z-10">
        <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">Join Room</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl p-8 shadow-2xl glow-blue">
          <div className="text-center mb-8 space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Enter Room Code</h2>
            <p className="text-slate-400 text-sm">Ask the host for the room code to join their live auction</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Room Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. IPLXYZ123"
                        className="uppercase text-center text-2xl font-mono tracking-widest h-14 bg-black/30 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all glow-gold" 
                disabled={!user}
              >
                Join Room
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
