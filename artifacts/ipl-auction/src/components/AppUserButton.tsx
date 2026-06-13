import React from "react";
import { UserButton } from "@clerk/react";
import { useAppUser, useAppSignOut } from "@/hooks/useAppAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppUserButton() {
  const { user, isGuest } = useAppUser();
  const signOut = useAppSignOut();

  if (!user) return null;

  if (isGuest) {
    const initials = user.fullName ? user.fullName.slice(0, 2).toUpperCase() : "GS";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-primary/20 hover:opacity-80 transition-opacity">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.imageUrl} alt={user.fullName ?? "Guest"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">Guest Mode</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Exit Guest Mode</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return <UserButton />;
}
