"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { onAuthExpired } from "@/app/lib/authEvents";
import { selectAuthStatus } from "@/app/store/authSlice";
import { useAppSelector } from "@/app/store/hooks";

export default function AuthWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const authStatus = useAppSelector(selectAuthStatus);
  const previousAuthStatusRef = useRef(authStatus);
  const skipNextSignedOutRedirectRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      skipNextSignedOutRedirectRef.current = true;
      queryClient.clear();
      if (pathname === "/login") {
        return;
      }

      router.push("/login?expired=1");
    });

    return () => {
      unsubscribe();
    };
  }, [pathname, queryClient, router]);

  useEffect(() => {
    const previousAuthStatus = previousAuthStatusRef.current;
    previousAuthStatusRef.current = authStatus;

    if (previousAuthStatus !== "in" || authStatus !== "out") {
      return;
    }

    queryClient.clear();
    if (skipNextSignedOutRedirectRef.current) {
      skipNextSignedOutRedirectRef.current = false;
      return;
    }
    if (pathname === "/login") {
      return;
    }

    router.replace("/login");
  }, [authStatus, pathname, queryClient, router]);

  return null;
}
