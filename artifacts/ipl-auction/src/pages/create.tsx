import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateRoom, RoomInputAuctionType, RoomInputAuctionSpeed } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  seasonYear: z.coerce.number().min(2008),
  auctionType: z.enum([RoomInputAuctionType.mega, RoomInputAuctionType.mini]),
  budgetCrore: z.coerce.number().min(1),
  maxSquadSize: z.coerce.number().min(15).max(25),
  maxOverseas: z.coerce.number().min(0).max(8),
  maxOwnersPerTeam: z.coerce.number().min(1).max(3),
  auctionSpeed: z.enum([RoomInputAuctionSpeed.slow, RoomInputAuctionSpeed.normal, RoomInputAuctionSpeed.fast]),
});

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const createRoom = useCreateRoom();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "My IPL Auction",
      seasonYear: 2025,
      auctionType: "mega",
      budgetCrore: 100,
      maxSquadSize: 25,
      maxOverseas: 8,
      maxOwnersPerTeam: 1,
      auctionSpeed: "normal",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    createRoom.mutate(
      {
        data: {
          ...values,
          hostUserId: user.id,
          displayName: user.fullName || user.username || "Host",
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Create Auction Room</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg bg-card border border-border rounded-xl p-8 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. The Ultimate Showdown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seasonYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season Year</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014].map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auctionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mega">Mega Auction</SelectItem>
                          <SelectItem value="mini">Mini Auction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetCrore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (Crores ₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxSquadSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Squad Size</FormLabel>
                      <FormControl>
                        <Input type="number" min={15} max={25} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxOverseas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Overseas Players</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxOwnersPerTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Owners per Team</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 (Solo)</SelectItem>
                          <SelectItem value="2">2 (Duo)</SelectItem>
                          <SelectItem value="3">3 (Trio)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auctionSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auction Speed</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="slow">Slow (45s timer)</SelectItem>
                          <SelectItem value="normal">Normal (30s timer)</SelectItem>
                          <SelectItem value="fast">Fast (15s timer)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={createRoom.isPending || !user}>
                {createRoom.isPending ? "Creating Room..." : "Create Room"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
