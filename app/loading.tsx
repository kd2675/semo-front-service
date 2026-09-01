import { SemoBrandMark } from "@/app/components/SemoBrandMark";

export default function RootLoading() {
  return (
    <main
      className="semo-user-theme flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm text-center">
        <SemoBrandMark className="mx-auto size-16 text-[var(--primary)]" animated />
        <p className="mt-5 text-base font-bold text-slate-900">SEMO를 준비하고 있습니다</p>
        <p className="mt-2 text-sm text-slate-500">잠시만 기다려주세요.</p>
      </div>
    </main>
  );
}
