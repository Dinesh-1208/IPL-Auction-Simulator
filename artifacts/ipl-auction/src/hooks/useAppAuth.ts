import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from "@clerk/react";

export function useAppAuth() {
  const isGuest = localStorage.getItem("ipl_guest_mode") === "true";
  const guestUserId = localStorage.getItem("ipl_guest_user_id");
  const clerkAuth = useClerkAuth();

  if (isGuest && guestUserId) {
    return {
      isLoaded: true,
      isSignedIn: true,
      userId: guestUserId,
      isGuest: true,
    };
  }

  return {
    isLoaded: clerkAuth.isLoaded,
    isSignedIn: clerkAuth.isSignedIn,
    userId: clerkAuth.userId,
    isGuest: false,
  };
}

export function useAppUser() {
  const isGuest = localStorage.getItem("ipl_guest_mode") === "true";
  const guestUserId = localStorage.getItem("ipl_guest_user_id");
  const guestUsername = localStorage.getItem("ipl_guest_username") || "Guest";
  const clerkUser = useClerkUser();

  if (isGuest && guestUserId) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: guestUserId,
        fullName: guestUsername,
        imageUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURI(guestUsername)}`,
        primaryEmailAddress: null,
      },
      isGuest: true,
    };
  }

  return {
    isLoaded: clerkUser.isLoaded,
    isSignedIn: clerkUser.isSignedIn,
    user: clerkUser.user ? {
      id: clerkUser.user.id,
      fullName: clerkUser.user.fullName,
      imageUrl: clerkUser.user.imageUrl,
      primaryEmailAddress: clerkUser.user.primaryEmailAddress,
    } : null,
    isGuest: false,
  };
}

export function useAppSignOut() {
  const { signOut } = useClerk();
  
  return async () => {
    const isGuest = localStorage.getItem("ipl_guest_mode") === "true";
    if (isGuest) {
      localStorage.removeItem("ipl_guest_mode");
      localStorage.removeItem("ipl_guest_user_id");
      localStorage.removeItem("ipl_guest_username");
      window.location.href = "/";
    } else {
      await signOut();
      window.location.href = "/";
    }
  };
}
