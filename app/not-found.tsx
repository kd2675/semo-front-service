import { RouterLink } from "@/app/components/RouterLink";
import { SemoBrandMark } from "@/app/components/SemoBrandMark";

export default function NotFound() {
  return (
    <main className="semo-user-theme flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <section className="semo-card w-full max-w-md p-6 text-center">
        <SemoBrandMark className="mx-auto size-14 text-slate-500" />
        <p className="mt-4 text-sm font-bold text-[var(--primary)]">404</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">주소가 변경되었거나 더 이상 제공되지 않는 화면입니다.</p>
        <RouterLink href="/" replace className="semo-control mt-6 inline-flex items-center justify-center bg-[var(--primary)] px-5 text-sm font-bold text-white">
          홈으로 이동
        </RouterLink>
      </section>
    </main>
  );
}
