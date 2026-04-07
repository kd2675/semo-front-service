"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MotionConfig } from "motion/react";
import { Provider } from "react-redux";
import { Suspense, useState } from "react";

import { store } from "@/app/store/store";
import AuthGate from "@/app/components/AuthGate";
import AuthWatcher from "@/app/components/AuthWatcher";
import { GlobalToast } from "@/app/components/GlobalToast";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <AuthGate>{children}</AuthGate>
          <GlobalToast />
          <Suspense fallback={null}>
            <AuthWatcher />
          </Suspense>
          {process.env.NODE_ENV === "development" ? (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          ) : null}
        </MotionConfig>
      </QueryClientProvider>
    </Provider>
  );
}
