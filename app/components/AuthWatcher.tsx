"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { clearAuthExpired } from "@/app/redux/slices/authSlice";

export default function AuthWatcher() {
  const dispatch = useAppDispatch();
  const expiredReason = useAppSelector((state) => state.auth.expiredReason);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!expiredReason) {
      return;
    }

    dispatch(clearAuthExpired());
    if (pathname !== "/login") {
      router.push("/login?expired=1");
    }
  }, [dispatch, expiredReason, pathname, router]);

  return null;
}
