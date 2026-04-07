"use client";

import { MotionConfig } from "motion/react";
import { Suspense } from "react";
import { Provider } from "react-redux";
import AuthGate from "@/app/components/AuthGate";
import AuthWatcher from "@/app/components/AuthWatcher";
import { store } from "@/app/redux/store";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <MotionConfig reducedMotion="user">
        <AuthGate>{children}</AuthGate>
        <Suspense fallback={null}>
          <AuthWatcher />
        </Suspense>
      </MotionConfig>
    </Provider>
  );
}
