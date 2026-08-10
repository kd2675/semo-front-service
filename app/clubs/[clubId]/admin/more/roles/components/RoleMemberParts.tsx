"use client";

import type { ClubAdminMember } from "@/app/lib/clubs";
import { getClubRoleLabel } from "@/app/lib/roleLabels";
import { getRoleMemberSubtitle, getRoleToneClass, makeInitials, DEFAULT_ROLE_COLOR } from "../utils/roleUtils";

type RoleMemberIdentityProps = {
  member: ClubAdminMember;
  showSelf?: boolean;
  avatarSizeClass?: string;
};

export function RoleMemberIdentity({
  member,
  showSelf = false,
  avatarSizeClass = "size-11",
}: RoleMemberIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {member.avatarImageUrl ? (
        <div
          className={`${avatarSizeClass} shrink-0 rounded-2xl bg-cover bg-center shadow-sm`}
          style={{ backgroundImage: `url('${member.avatarImageUrl}')` }}
        />
      ) : (
        <div
          className={`flex ${avatarSizeClass} shrink-0 items-center justify-center rounded-2xl bg-[#efe6d8] text-sm font-black text-[#8b4b00] shadow-sm`}
        >
          {makeInitials(member.displayName)}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{member.displayName}</p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${getRoleToneClass(member)}`}>
            {getClubRoleLabel(member.roleCode)}
          </span>
          {showSelf && member.self ? (
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              나
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">{getRoleMemberSubtitle(member)}</p>
      </div>
    </div>
  );
}

type RoleOtherPositionsProps = {
  member: ClubAdminMember;
  currentClubPositionId: number;
  titleTrackingClass?: string;
};

export function RoleOtherPositions({
  member,
  currentClubPositionId,
  titleTrackingClass = "tracking-[0.2em]",
}: RoleOtherPositionsProps) {
  const relatedPositions = member.positions.filter((position) => position.clubPositionId !== currentClubPositionId);
  if (relatedPositions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <p className={`text-xs font-bold text-slate-400 ${titleTrackingClass}`}>다른 직책</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {relatedPositions.map((position) => (
          <span
            key={`${member.clubMemberId}-${position.clubPositionId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600"
          >
            <span
              className="material-symbols-outlined text-[15px]"
              aria-hidden="true"
              style={{ color: position.colorHex ?? DEFAULT_ROLE_COLOR }}
            >
              {position.iconName ?? "badge"}
            </span>
            {position.displayName}
          </span>
        ))}
      </div>
    </div>
  );
}
