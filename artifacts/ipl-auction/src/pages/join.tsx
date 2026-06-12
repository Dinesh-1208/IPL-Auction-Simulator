import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useJoinRoom } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  code: z.string().min(1, "Room code is required"),
});

export default function JoinRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const joinRoom = useJoinRoom();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    
    joinRoom.mutate(
      { code: values.code, data: { userId: user.id, displayName: user.fullName || "Player" } },
      {
        onSuccess: () => {
          toast({ title: "Joined room successfully!" });
          setLocation(`/room/${values.code}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to join room" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Join Room</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 6-digit code" className="uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={joinRoom.isPending}>
              {joinRoom.isPending ? "Joining..." : "Join Room"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}