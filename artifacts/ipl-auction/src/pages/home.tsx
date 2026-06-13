import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trophy, Play, Users, Settings, Sparkles, Shield, User } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [guestName, setGuestName] = useState("");
  const [open, setOpen] = useState(false);

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const randomId = "guest_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("ipl_guest_mode", "true");
    localStorage.setItem("ipl_guest_user_id", randomId);
    localStorage.setItem("ipl_guest_username", guestName.trim());

    // Redirect to dashboard
    setLocation("/dashboard");
    // Reload page to trigger state updates in App.tsx / Clerk
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-broadcast flex flex-col relative overflow-hidden">
      {/* Visual background enhancements */}
      <div className="absolute inset-0 bg-grid-white/[0.015] bg-[size:30px_30px]" />
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/10 blur-[120px]" />
      
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/20 relative z-10">
        <h1 className="text-xl font-black tracking-wider uppercase ipl-gradient-text">
          IPL Auction
        </h1>
        <div className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all rounded-md">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 relative z-10 max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/25 bg-amber-500/5 text-amber-400 text-xs font-semibold uppercase tracking-wider animate-neon-pulse glow-gold">
          <Sparkles className="w-3.5 h-3.5" />
          Live Multiplayer Auction Simulator
        </div>

        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.15]">
          The Ultimate <br className="hidden sm:inline" />
          <span className="text-glow-yellow text-amber-400">IPL Auction</span> Experience
        </h2>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Step into the auction room. Create rooms, claim your franchise, manage retentions, bid on historical players (2014-2025), and match bids with RTM.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md pt-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 w-full sm:w-auto px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold tracking-wide rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all glow-gold">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Play as Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-amber-400" />
                  Enter Guest Name
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Pick a display name to join and create rooms as a guest player.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGuestLogin} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    id="guestName"
                    placeholder="Enter your name (e.g. Dinesh)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    maxLength={20}
                    className="bg-black/40 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold">
                    Let's Play
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="h-12 w-full sm:w-auto px-8 glass-card border-white/10 hover:bg-white/10 text-white font-semibold transition-all">
              <Shield className="w-4 h-4 mr-2" />
              Sign In with Clerk
            </Button>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-2 hover:border-amber-500/20 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Historical Seasons</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Load real historical rosters and season stats from 2014 to 2025.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-2 hover:border-blue-500/20 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Real-time Multiplayer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Play with friends, run live bidding wars, and claim teams concurrently.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-2 hover:border-purple-500/20 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">RTM & Custom Rules</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Set maximum retentions, toggle RTM, customise budgets, and run the show.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}