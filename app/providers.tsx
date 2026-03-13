"use client";

import { MotionConfig } from "motion/react";
import { Suspense } from "react";
import AuthGate from "@/app/components/AuthGate";
import AuthWatcher from "@/app/components/AuthWatcher";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthGate>{children}</AuthGate>
      <Suspense fallback={null}>
        <AuthWatcher />
      </Suspense>
    </MotionConfig>
  );
}
