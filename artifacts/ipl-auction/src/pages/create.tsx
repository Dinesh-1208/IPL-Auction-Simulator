import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateRoom, RoomInputAuctionType, RoomInputAuctionSpeed } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  seasonYear: z.coerce.number().min(2008),
  auctionType: z.enum([RoomInputAuctionType.mega, RoomInputAuctionType.mini]),
  budgetCrore: z.coerce.number().min(1),
  maxSquadSize: z.coerce.number().min(15).max(25),
  maxOverseas: z.coerce.number().min(0).max(8),
  maxOwnersPerTeam: z.coerce.number().min(1).max(5),
  auctionSpeed: z.enum([RoomInputAuctionSpeed.slow, RoomInputAuctionSpeed.normal, RoomInputAuctionSpeed.fast]),
});

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createRoom = useCreateRoom();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "My IPL Auction",
      seasonYear: 2024,
      auctionType: "mega",
      budgetCrore: 100,
      maxSquadSize: 25,
      maxOverseas: 8,
      maxOwnersPerTeam: 1,
      auctionSpeed: "normal",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createRoom.mutate(
      { data: values },
      {
        onSuccess: (room) => {
          toast({ title: "Room created successfully!" });
          setLocation(`/room/${room.code}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create room" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Auction Room</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
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
                    <FormLabel>Budget (Crores)</FormLabel>
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
                      <Input type="number" {...field} />
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
                      <Input type="number" {...field} />
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
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select speed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={createRoom.isPending}>
              {createRoom.isPending ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}