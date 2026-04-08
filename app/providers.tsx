"use client";

import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import AuthGate from "@/app/components/AuthGate";
import AuthWatcher from "@/app/components/AuthWatcher";
import { GlobalModalViewport } from "@/app/components/GlobalModalViewport";
import { createQueryClient } from "@/app/lib/query-client";
import { useAppSelector } from "@/app/redux/hooks";
import { store } from "@/app/redux/store";

type ProvidersProps = {
  children: React.ReactNode;
};

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((module) => ({
      default: module.ReactQueryDevtools,
    })),
  { ssr: false },
);

function QueryAuthSync() {
  const queryClient = useQueryClient();
  const authStatus = useAppSelector((state) => state.auth.status);
  const userKey = useAppSelector((state) => state.auth.user?.userKey ?? null);
  const previousUserKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (authStatus === "out") {
      queryClient.clear();
    }
  }, [authStatus, queryClient]);

  useEffect(() => {
    const previousUserKey = previousUserKeyRef.current;
    if (previousUserKey && userKey && previousUserKey !== userKey) {
      queryClient.clear();
    }

    previousUserKeyRef.current = userKey;
  }, [queryClient, userKey]);

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryAuthSync />
        <MotionConfig reducedMotion="user">
          <AuthGate>{children}</AuthGate>
          <Suspense fallback={null}>
            <AuthWatcher />
          </Suspense>
          <GlobalModalViewport />
        </MotionConfig>
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        ) : null}
      </QueryClientProvider>
    </Provider>
  );
}
