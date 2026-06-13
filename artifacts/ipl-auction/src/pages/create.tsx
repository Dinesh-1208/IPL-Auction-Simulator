import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateRoom, RoomInputAuctionType, RoomInputAuctionSpeed } from "@workspace/api-client-react";
import { useAppUser } from "@/hooks/useAppAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Settings2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  seasonYear: z.coerce.number().min(2008),
  auctionType: z.enum([RoomInputAuctionType.mega, RoomInputAuctionType.mini]),
  budgetCrore: z.coerce.number().min(10).max(200),
  maxSquadSize: z.coerce.number().min(15).max(30),
  maxOverseas: z.coerce.number().min(0).max(12),
  maxOwnersPerTeam: z.coerce.number().min(1).max(3),
  auctionSpeed: z.enum([RoomInputAuctionSpeed.slow, RoomInputAuctionSpeed.normal, RoomInputAuctionSpeed.fast]),
  rtmEnabled: z.boolean().default(true),
  maxRetentions: z.coerce.number().min(0).max(10).default(6),
});

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAppUser();
  const createRoom = useCreateRoom();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "My IPL Auction",
      seasonYear: 2025,
      auctionType: RoomInputAuctionType.mega,
      budgetCrore: 100,
      maxSquadSize: 25,
      maxOverseas: 8,
      maxOwnersPerTeam: 1,
      auctionSpeed: RoomInputAuctionSpeed.normal,
      rtmEnabled: true,
      maxRetentions: 6,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    createRoom.mutate(
      {
        data: {
          ...values,
          hostUserId: user.id,
          displayName: user.fullName || "Host",
        } as any,
      },
      {
        onSuccess: (room) => {
          toast({ title: "Room created!", description: `Code: ${room.code}` });
          setLocation(`/room/${room.code}`);
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Failed to create room", description: err?.message });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-broadcast flex flex-col relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[100px]" />

      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/5 backdrop-blur bg-black/20 sticky top-0 z-10">
        <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold tracking-tight text-white">Create Auction Room</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl glass-panel border border-white/10 rounded-2xl p-8 shadow-2xl glow-blue space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Configure Custom Rules
            </h2>
            <p className="text-sm text-slate-400">Set up the auction constraints and database details for your session</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Room Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel className="text-slate-200">Room Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g. IPL 2025 Mega Auction Showdown" 
                          className="bg-black/30 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Season Year */}
                <FormField
                  control={form.control}
                  name="seasonYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Database Season (Stats Year)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="bg-black/30 border-white/10 text-white focus:ring-amber-500">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-white/10 text-white bg-slate-900">
                          {[2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014].map(y => (
                            <SelectItem key={y} value={String(y)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10">IPL {y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Auction Type */}
                <FormField
                  control={form.control}
                  name="auctionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Auction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/30 border-white/10 text-white focus:ring-amber-500">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-white/10 text-white bg-slate-900">
                          <SelectItem value="mega" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">Mega Auction</SelectItem>
                          <SelectItem value="mini" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">Mini Auction (Released Only)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom Purse (Slider + Value display) */}
                <FormField
                  control={form.control}
                  name="budgetCrore"
                  render={({ field }) => (
                    <FormItem className="col-span-full space-y-3">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-slate-200">Team Budget (Purse)</FormLabel>
                        <span className="text-glow-yellow text-amber-400 font-bold font-mono text-base">
                          ₹ {field.value} Crores
                        </span>
                      </div>
                      <FormControl>
                        <div className="space-y-4">
                          <Slider
                            min={10}
                            max={200}
                            step={5}
                            value={[field.value]}
                            onValueChange={(val) => field.onChange(val[0])}
                            className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-500 [&_.bg-primary]:bg-amber-500 py-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Squad Size */}
                <FormField
                  control={form.control}
                  name="maxSquadSize"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-slate-200">Max Squad Size</FormLabel>
                        <span className="text-white font-bold font-mono">{field.value} players</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={15}
                          max={30}
                          step={1}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="py-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Overseas */}
                <FormField
                  control={form.control}
                  name="maxOverseas"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-slate-200">Max Overseas</FormLabel>
                        <span className="text-white font-bold font-mono">{field.value} players</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={12}
                          step={1}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="py-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RTM Toggle */}
                <FormField
                  control={form.control}
                  name="rtmEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/5 p-4 bg-black/20 col-span-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-slate-200 text-sm font-semibold">Right to Match (RTM)</FormLabel>
                        <FormDescription className="text-xs text-slate-400">
                          Allow former franchises to match the highest bid for a player they owned in the database
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Max Retentions */}
                <FormField
                  control={form.control}
                  name="maxRetentions"
                  render={({ field }) => (
                    <FormItem className="col-span-full space-y-3">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-slate-200">Max Pre-Auction Retentions</FormLabel>
                        <span className="text-white font-bold font-mono">{field.value} players</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          className="py-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Owners per Team */}
                <FormField
                  control={form.control}
                  name="maxOwnersPerTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Max Owners per Franchise</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="bg-black/30 border-white/10 text-white focus:ring-amber-500">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-white/10 text-white bg-slate-900">
                          <SelectItem value="1" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">1 (Solo ownership)</SelectItem>
                          <SelectItem value="2" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">2 (Co-ownership)</SelectItem>
                          <SelectItem value="3" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">3 (Multi-ownership)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Auction Speed */}
                <FormField
                  control={form.control}
                  name="auctionSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Bidding Speed (Timer)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/30 border-white/10 text-white focus:ring-amber-500">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-white/10 text-white bg-slate-900">
                          <SelectItem value="slow" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">Slow (45s bid timer)</SelectItem>
                          <SelectItem value="normal" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">Normal (30s bid timer)</SelectItem>
                          <SelectItem value="fast" className="hover:bg-white/10 cursor-pointer focus:bg-white/10">Fast (15s bid timer)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl shadow-lg hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all glow-gold"
                disabled={createRoom.isPending || !user}
              >
                {createRoom.isPending ? "Configuring Room..." : "Create Room"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
