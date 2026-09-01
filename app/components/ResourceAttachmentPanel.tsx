"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useAppToast } from "@/app/hooks/useAppToast";
import {
  ATTACHMENT_ACCEPT,
  downloadResourceAttachment,
  type ResourceAttachmentType,
  uploadTempAttachment,
} from "@/app/lib/clubs";
import {
  createResourceAttachmentMutationOptions,
  deleteResourceAttachmentMutationOptions,
} from "@/app/lib/react-query/attachment/mutations";
import {
  attachmentQueryKeys,
  resourceAttachmentsQueryOptions,
} from "@/app/lib/react-query/attachment/queries";

type ResourceAttachmentPanelProps = {
  clubId: string;
  resourceType: ResourceAttachmentType;
  resourceId: number;
  canUpload: boolean;
  canDelete?: boolean;
  theme?: "user" | "admin";
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes}B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)}KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
}

function visibilityLabel(visibilityScope: string) {
  switch (visibilityScope) {
    case "CLUB":
      return "클럽 멤버 공개";
    case "OWNER_AND_OPERATORS":
      return "요청자·재정 운영진 공개";
    case "HANDOVER_OPERATORS":
      return "인수인계 운영진 공개";
    case "DECISION_OPERATORS":
      return "회의록·결정 운영진 공개";
    default:
      return "작성자·운영진 공개";
  }
}

export function ResourceAttachmentPanel({
  clubId,
  resourceType,
  resourceId,
  canUpload,
  canDelete = canUpload,
  theme = "user",
}: ResourceAttachmentPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const attachmentsQuery = useQuery(
    resourceAttachmentsQueryOptions(clubId, resourceType, resourceId),
  );
  const createMutation = useMutation(createResourceAttachmentMutationOptions(clubId));
  const deleteMutation = useMutation(deleteResourceAttachmentMutationOptions(clubId));
  const attachments = attachmentsQuery.data ?? [];
  const accentClassName = theme === "admin"
    ? "text-[var(--color-admin-primary)]"
    : "text-[var(--primary)]";

  const refresh = () => queryClient.invalidateQueries({
    queryKey: attachmentQueryKeys.resource(clubId, resourceType, resourceId),
  });

  const handleFile = async (file: File | null) => {
    if (!file || createMutation.isPending || uploadProgress != null) return;
    setUploadProgress(0);
    try {
      const temporary = await uploadTempAttachment(file, setUploadProgress);
      await createMutation.mutateAsync({
        resourceType,
        resourceId,
        tempFileName: temporary.fileName,
        uploadToken: temporary.uploadToken,
        originalFileName: file.name,
      });
      await refresh();
      showToast("첨부파일을 등록했습니다.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "첨부파일을 등록하지 못했습니다.", "error");
    } finally {
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(attachmentId);
      await refresh();
      showToast("첨부파일을 삭제했습니다.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "첨부파일을 삭제하지 못했습니다.", "error");
    }
  };

  const handleDownload = async (attachmentId: number, originalFileName: string) => {
    if (downloadingAttachmentId != null) return;
    setDownloadingAttachmentId(attachmentId);
    try {
      const result = await downloadResourceAttachment(clubId, attachmentId);
      if (!result.ok || !result.data) {
        throw new Error(result.message || "첨부파일을 다운로드하지 못했습니다.");
      }
      const objectUrl = URL.createObjectURL(result.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = originalFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "첨부파일을 다운로드하지 못했습니다.", "error");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4" aria-labelledby={`attachment-title-${resourceType}-${resourceId}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h5 id={`attachment-title-${resourceType}-${resourceId}`} className="text-sm font-bold text-slate-900">
            첨부파일
          </h5>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            PDF·문서·스프레드시트·HWP·ZIP, 파일당 최대 20MB
          </p>
        </div>
        {canUpload ? (
          <>
            <input
              ref={inputRef}
              type="file"
              aria-label="첨부파일 선택"
              accept={ATTACHMENT_ACCEPT}
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={attachments.length >= 10 || uploadProgress != null}
              className={`semo-control shrink-0 border border-slate-200 bg-white px-3 text-xs font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${accentClassName}`}
            >
              {uploadProgress != null ? `${uploadProgress}%` : "파일 추가"}
            </button>
          </>
        ) : null}
      </div>

      {attachmentsQuery.isPending ? (
        <div className="mt-4 h-16 animate-pulse rounded-2xl bg-slate-100" role="status" aria-label="첨부파일을 불러오는 중" />
      ) : attachmentsQuery.isError ? (
        <button
          type="button"
          onClick={() => void attachmentsQuery.refetch()}
          className="mt-4 w-full rounded-2xl bg-rose-50 px-4 py-3 text-left text-xs font-semibold text-rose-700"
        >
          첨부파일을 불러오지 못했습니다. 다시 시도
        </button>
      ) : attachments.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-xs text-slate-500">
          등록된 첨부파일이 없습니다.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.attachmentId} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <span className={`material-symbols-outlined text-[21px] ${accentClassName}`} aria-hidden="true">
                attach_file
              </span>
              <button
                type="button"
                onClick={() => void handleDownload(attachment.attachmentId, attachment.originalFileName)}
                disabled={downloadingAttachmentId != null}
                className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="block truncate text-xs font-bold text-slate-800">{attachment.originalFileName}</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {downloadingAttachmentId === attachment.attachmentId ? "다운로드 중..." : `${formatFileSize(attachment.sizeBytes)} · ${visibilityLabel(attachment.visibilityScope)}`}
                </span>
              </button>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => void handleDelete(attachment.attachmentId)}
                  disabled={deleteMutation.isPending}
                  className="semo-icon-control -mr-2 text-slate-400 transition hover:bg-white hover:text-rose-600 disabled:opacity-50"
                  aria-label={`${attachment.originalFileName} 삭제`}
                >
                  <span className="material-symbols-outlined text-[19px]" aria-hidden="true">delete</span>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
