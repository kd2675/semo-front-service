"use client";

import { EphemeralToast } from "@/app/components/EphemeralToast";
import { RouterLink } from "@/app/components/RouterLink";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubPermissionGroup,
  ClubPositionDetailResponse,
  ClubPositionSummary,
} from "@/app/lib/clubs";
import { motion, useReducedMotion } from "motion/react";
import { Inter, Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ICON_OPTIONS = [
  "shield",
  "workspace_premium",
  "verified",
  "stars",
  "military_tech",
  "campaign",
  "calendar_month",
  "poll",
  "forum",
  "manage_accounts",
];
const COLOR_OPTIONS = ["#904e00", "#0053dd", "#49636f", "#a83836", "#0f172a", "#15803d", "#7c3aed"];

type RoleFormValue = {
  displayName: string;
  positionCode: string;
  description: string;
  iconName: string;
  colorHex: string;
  active: boolean;
  permissionKeys: string[];
};

type RoleEditorFormProps = {
  clubId: string;
  clubName: string;
  title: string;
  mode: "create" | "edit";
  permissionGroups: ClubPermissionGroup[];
  initialPosition?: ClubPositionSummary | null;
  onSubmit: (value: RoleFormValue) => Promise<{ success: boolean; nextHref?: string }>;
  onDelete?: () => Promise<boolean>;
};

function buildInitialValue(initialPosition?: ClubPositionSummary | null): RoleFormValue {
  return {
    displayName: initialPosition?.displayName ?? "",
    positionCode: initialPosition?.positionCode ?? "",
    description: initialPosition?.description ?? "",
    iconName: initialPosition?.iconName ?? "shield",
    colorHex: initialPosition?.colorHex ?? "#904e00",
    active: initialPosition?.active ?? true,
    permissionKeys: initialPosition?.permissionKeys ?? [],
  };
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
}

function createAutoPositionCode(displayName: string, clubId: string) {
  const normalized = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = normalized.length > 0 ? normalized : "CUSTOM_ROLE";
  const suffix = hashText(`${clubId}:${displayName.trim() || "role"}`);
  return `ROLE_${base}_${suffix}`.slice(0, 50);
}

function PermissionToggleCard({
  group,
  selectedKeys,
  onToggle,
}: {
  group: ClubPermissionGroup;
  selectedKeys: string[];
  onToggle: (permissionKey: string) => void;
}) {
  const activeCount = group.permissions.filter((permission) => selectedKeys.includes(permission.permissionKey)).length;

  return (
    <article className="overflow-hidden rounded-[24px] border-l-4 border-[var(--secondary)] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[14px] bg-[var(--secondary-soft)] text-[var(--secondary)]">
            <span className="material-symbols-outlined">{group.iconName}</span>
          </div>
          <div>
            <h3 className={`${manrope.className} text-xl font-bold text-slate-900`}>{group.displayName}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {group.description ?? `${group.permissions.length}개 세부 권한을 제어합니다.`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--secondary)]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--secondary)]">
          {activeCount} Active
        </span>
      </div>

      <div className="space-y-4">
        {group.permissions.map((permission) => {
          const selected = selectedKeys.includes(permission.permissionKey);
          return (
            <div
              key={permission.permissionKey}
              className="flex items-center justify-between gap-4 rounded-[18px] bg-[#f7fafc] p-4 ring-1 ring-[#edf2f5]"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{permission.displayName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {permission.description ?? "이 권한에 대한 설명이 없습니다."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={selected}
                onClick={() => onToggle(permission.permissionKey)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  selected ? "bg-[var(--secondary)]" : "bg-[#dbe4e8]"
                }`}
              >
                <span
                  className={`absolute left-[2px] size-5 rounded-full border border-slate-200 bg-white transition-transform ${
                    selected ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#eff4f7] pt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="material-symbols-outlined text-base text-[var(--secondary)]">verified_user</span>
          {activeCount} permissions enabled
        </div>
        <div className="text-[11px] font-semibold text-slate-400">{group.permissions.length} total</div>
      </div>
    </article>
  );
}

export function RoleEditorForm({
  clubId,
  title,
  mode,
  permissionGroups,
  initialPosition,
  onSubmit,
  onDelete,
}: RoleEditorFormProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [form, setForm] = useState(() => buildInitialValue(initialPosition));
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const generatedPositionCode = useMemo(
    () => createAutoPositionCode(form.displayName, clubId),
    [clubId, form.displayName],
  );

  const submittedPositionCode = mode === "create" ? generatedPositionCode : form.positionCode;

  const canSubmit = useMemo(() => {
    if (mode === "create") {
      return form.displayName.trim().length > 0;
    }
    return form.displayName.trim().length > 0 && form.positionCode.trim().length > 0;
  }, [form.displayName, form.positionCode, mode]);

  const togglePermission = (permissionKey: string) => {
    setForm((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((item) => item !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast(mode === "create" ? "직책 이름을 입력해주세요." : "직책 이름과 코드를 입력해주세요.", "error");
      return;
    }
    setSubmitting(true);
    clearToast();
    const result = await onSubmit({
      ...form,
      positionCode: submittedPositionCode,
    });
    setSubmitting(false);
    if (!result.success) {
      showToast("저장에 실패했습니다.", "error");
      return;
    }
    showToast("직책 저장이 완료되었습니다.", "success");
    if (result.nextHref) {
      router.replace(result.nextHref);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }
    const confirmed = window.confirm("이 직책을 삭제할까요?");
    if (!confirmed) {
      return;
    }
    setSubmitting(true);
    const success = await onDelete();
    setSubmitting(false);
    if (!success) {
      showToast("직책 삭제에 실패했습니다.", "error");
      return;
    }
    router.replace(`/clubs/${clubId}/admin/more/roles`);
  };

  if (mode === "create") {
    return (
      <div
        className={`${inter.className} min-h-screen bg-[#f7fafc] text-slate-900`}
        style={
          {
            "--secondary": form.colorHex || "#904e00",
            "--secondary-soft": "#ffdcc2",
          } as CSSProperties
        }
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,220,194,0.6),_transparent_34%),linear-gradient(180deg,_#f7fafc_0%,_#f1f5f7_100%)] pb-20">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <RouterLink
                  href={`/clubs/${clubId}/admin/more/roles`}
                  className="flex size-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-slate-500">arrow_back</span>
                </RouterLink>
                <h1 className={`${manrope.className} text-lg font-bold tracking-tight text-slate-900`}>
                  {title}
                </h1>
              </div>
              <div className={`${manrope.className} text-xl font-bold text-[#0762ff]`}>Club Admin</div>
            </div>
          </header>

          <main className="mx-auto max-w-4xl space-y-8 p-6">
            <motion.section className="space-y-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary)]">badge</span>
                <h2 className={`${manrope.className} text-xl font-bold text-slate-900`}>Role Basics</h2>
              </div>
              <div className="space-y-6 rounded-[22px] bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Role Name</span>
                    <input
                      value={form.displayName}
                      onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                      className="w-full rounded-xl bg-[#eff4f7] px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(144,78,0,0.22)]"
                      placeholder="예: 운영 총괄"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Internal Code</span>
                    <input
                      value={submittedPositionCode}
                      readOnly
                      className="w-full rounded-xl bg-[#eff4f7] px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                      placeholder="ROLE_CODE"
                    />
                    <span className="text-[11px] leading-5 text-slate-400">직책 이름을 기준으로 시스템이 자동 생성합니다.</span>
                  </label>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-[120px] w-full rounded-xl bg-[#eff4f7] px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(144,78,0,0.22)]"
                    placeholder="이 직책의 핵심 역할과 책임을 정리해주세요."
                  />
                </label>
              </div>
            </motion.section>

            <motion.section className="space-y-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary)]">security</span>
                <h2 className={`${manrope.className} text-xl font-bold text-slate-900`}>Permission Setup</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {permissionGroups.map((group) => (
                  <PermissionToggleCard
                    key={group.featureKey}
                    group={group}
                    selectedKeys={form.permissionKeys}
                    onToggle={togglePermission}
                  />
                ))}
              </div>
            </motion.section>

            <motion.section className="space-y-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--secondary)]">palette</span>
                <h2 className={`${manrope.className} text-xl font-bold text-slate-900`}>Visual Identity</h2>
              </div>
              <div className="grid grid-cols-1 gap-8 rounded-[22px] bg-white p-6 shadow-sm md:grid-cols-2">
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Representative Icon
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {ICON_OPTIONS.map((iconName) => {
                      const selected = form.iconName === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, iconName }))}
                          className={`flex size-12 items-center justify-center rounded-xl transition ${
                            selected
                              ? "bg-[var(--secondary)] text-white shadow-md ring-2 ring-[var(--secondary)]/30 ring-offset-2"
                              : "bg-[#eff4f7] text-slate-500 hover:bg-[#e4ecef]"
                          }`}
                        >
                          <span className="material-symbols-outlined">{iconName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Role Theme Color
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {COLOR_OPTIONS.map((colorHex) => {
                      const selected = form.colorHex === colorHex;
                      return (
                        <button
                          key={colorHex}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, colorHex }))}
                          className={`size-8 rounded-full ${selected ? "ring-2 ring-slate-900/15 ring-offset-2" : ""}`}
                          style={{ backgroundColor: colorHex }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.div className="rounded-[24px] bg-white p-6 shadow-sm" {...staggeredFadeUpMotion(3, reduceMotion)}>
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 items-center justify-center rounded-[18px] text-white shadow-sm"
                  style={{ backgroundColor: form.colorHex || "#904e00" }}
                >
                  <span className="material-symbols-outlined text-[28px]">{form.iconName}</span>
                </div>
                <div>
                  <p className={`${manrope.className} text-2xl font-extrabold tracking-tight text-slate-900`}>
                    {form.displayName || "새 직책"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {submittedPositionCode}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div className="pb-12 pt-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-[var(--secondary)] px-5 py-5 text-base font-bold text-white shadow-xl shadow-[rgba(144,78,0,0.2)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined">add_moderator</span>
                {submitting ? "직책 생성 중..." : "Create Role"}
              </button>
            </motion.div>
          </main>

          <EphemeralToast message={toast?.message ?? null} tone={toast?.tone} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${inter.className} min-h-screen bg-[#f7fafc] text-slate-900`}
      style={
        {
          "--secondary": form.colorHex || "#904e00",
          "--secondary-soft": "#ffdcc2",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,220,194,0.6),_transparent_34%),linear-gradient(180deg,_#f7fafc_0%,_#f1f5f7_100%)] pb-24">
        <header className="sticky top-0 z-50 border-b border-[#f0dfcf] bg-[#faf7f2]/85 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles`}
                className="flex size-10 items-center justify-center rounded-full transition hover:bg-[#fff1e4]"
              >
                <span className="material-symbols-outlined text-[var(--secondary)]">arrow_back</span>
              </RouterLink>
              <h1 className={`${manrope.className} text-xl font-black tracking-tight text-[var(--secondary)]`}>
                Edit Role Permissions
              </h1>
            </div>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded-xl bg-[var(--secondary)] px-5 py-2 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-xl space-y-8 px-4 pb-32 pt-6">
          <motion.section
            className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div>
              <span className={`${manrope.className} text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--secondary)] opacity-80`}>
                Configuration
              </span>
              <h2 className={`${manrope.className} mt-1 text-4xl font-extrabold text-slate-900`}>
                Role Permissions
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                {form.displayName || "선택한 직책"} 권한을 기능별 토글로 제어합니다. 필요한 동작만 켜고 바로 저장할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <RouterLink
                href={`/clubs/${clubId}/admin/more/roles`}
                className="rounded-xl bg-[#eff4f7] px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-[#e2e9ed]"
              >
                Discard
              </RouterLink>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="rounded-xl bg-[var(--secondary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[rgba(144,78,0,0.18)] transition active:scale-95 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.section>

          <motion.section className="space-y-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary)]">info</span>
              <h3 className={`${manrope.className} text-sm font-bold uppercase tracking-[0.18em] text-slate-500`}>
                Role Overview
              </h3>
            </div>

            <div className="rounded-[28px] bg-[#eff4f7] p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                <div className="md:col-span-4">
                  <div className="rounded-[24px] border-l-4 border-[var(--secondary)] bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex size-14 items-center justify-center rounded-[18px] text-white shadow-sm"
                        style={{ backgroundColor: form.colorHex }}
                      >
                        <span className="material-symbols-outlined text-[30px]">{form.iconName}</span>
                      </div>
                      <div>
                        <p className={`${manrope.className} text-2xl font-extrabold tracking-tight text-slate-900`}>
                          {form.displayName || "Role"}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {form.positionCode}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {form.description || "직책 설명을 입력하면 이 영역에 표시됩니다."}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Role Name</span>
                      <input
                        value={form.displayName}
                        onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                        className="w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                        placeholder="직책 이름"
                      />
                    </label>
                    <div className="rounded-xl border border-[var(--secondary)]/10 bg-[var(--secondary-soft)] p-4 text-xs italic text-[#7d4300]">
                      &quot;{form.positionCode}&quot; 코드를 사용하는 직책입니다.
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-[120px] w-full rounded-xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-[rgba(144,78,0,0.22)]"
                      placeholder="직책 설명"
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="space-y-4" {...staggeredFadeUpMotion(2, reduceMotion)}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary)]">rule_folder</span>
              <h3 className={`${manrope.className} text-sm font-bold uppercase tracking-[0.18em] text-slate-500`}>
                Permission Matrix
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {permissionGroups.map((group) => (
              <div key={group.featureKey}>
                <PermissionToggleCard
                  group={group}
                  selectedKeys={form.permissionKeys}
                  onToggle={togglePermission}
                />
              </div>
              ))}
            </div>
          </motion.section>

          <motion.section className="mt-8" {...staggeredFadeUpMotion(3, reduceMotion)}>
            <div className="relative overflow-hidden rounded-[32px] bg-[var(--secondary-soft)] p-6">
              <span className="material-symbols-outlined pointer-events-none absolute -right-4 -top-4 text-9xl text-[var(--secondary)]/10">
                shield
              </span>
              <div className="relative z-10">
                <p className={`${manrope.className} mb-2 text-lg font-extrabold leading-tight text-[#623300]`}>
                  Security Audit Active
                </p>
                <p className="text-sm text-[#8b4b00]">
                  활성 기능에 연결된 권한만 토글 대상에 포함됩니다. 저장 시 현재 화면 상태 그대로 직책 권한에 반영됩니다.
                </p>
              </div>
            </div>
          </motion.section>

          {onDelete ? (
            <motion.div className="flex justify-end" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={submitting}
                className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm disabled:opacity-60"
              >
                삭제
              </button>
            </motion.div>
          ) : null}
        </main>

        <EphemeralToast message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}

export function buildRoleEditorInitialPosition(detail: ClubPositionDetailResponse) {
  return detail.position;
}
