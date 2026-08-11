import axios from "axios";

import { deleteJson, getBlob, getJson, postJson } from "@/app/lib/api";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "http://localhost:8081";
export const ATTACHMENT_MAX_SIZE_BYTES = 20 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = ".pdf,.txt,.csv,.docx,.xlsx,.pptx,.hwp,.hwpx,.zip";

export type ResourceAttachmentType = "TODO_ITEM" | "FINANCE_REQUEST" | "FINANCE_EXPENSE" | "FEEDBACK" | "HANDOVER_NOTE" | "DECISION_RECORD";

export type ResourceAttachment = {
  attachmentId: number;
  clubId: number;
  resourceType: ResourceAttachmentType;
  resourceId: number;
  uploaderClubProfileId: number;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  visibilityScope: "CLUB" | "OWNER_AND_OPERATORS" | "OWNER_AND_ADMIN" | "HANDOVER_OPERATORS" | "DECISION_OPERATORS";
  downloadUrl: string;
  createdAt: string | null;
};

export type TempAttachmentUpload = {
  fileName: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
  uploadToken: string;
  temporary: boolean;
};

export type DeleteResourceAttachmentResult = {
  attachmentId: number;
  deleted: boolean;
};

export function getResourceAttachments(
  clubId: string,
  resourceType: ResourceAttachmentType,
  resourceId: number,
) {
  const params = new URLSearchParams({
    resourceType,
    resourceId: String(resourceId),
  });
  return getJson<ResourceAttachment[]>(
    `/api/semo/v1/clubs/${clubId}/attachments?${params.toString()}`,
  );
}

export function createResourceAttachment(
  clubId: string,
  request: {
    resourceType: ResourceAttachmentType;
    resourceId: number;
    tempFileName: string;
    uploadToken: string;
    originalFileName: string;
  },
) {
  return postJson<ResourceAttachment>(`/api/semo/v1/clubs/${clubId}/attachments`, request);
}

export function deleteResourceAttachment(clubId: string, attachmentId: number) {
  return deleteJson<DeleteResourceAttachmentResult>(
    `/api/semo/v1/clubs/${clubId}/attachments/${attachmentId}`,
  );
}

export function downloadResourceAttachment(clubId: string, attachmentId: number) {
  return getBlob(`/api/semo/v1/clubs/${clubId}/attachments/${attachmentId}/download`);
}

export async function uploadTempAttachment(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<TempAttachmentUpload> {
  if (file.size < 1) {
    throw new Error("빈 파일은 첨부할 수 없습니다.");
  }
  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
    throw new Error("첨부파일은 20MB 이하여야 합니다.");
  }
  const formData = new FormData();
  formData.append("file", file);
  const { ensureAccessToken } = await import("@/app/lib/auth");
  const token = await ensureAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }
  const response = await axios.post<TempAttachmentUpload>(
    `${IMAGE_BASE}/upload/temp-file`,
    formData,
    {
      validateStatus: () => true,
      headers: { Authorization: `Bearer ${token}` },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    },
  );
  if (response.status < 200 || response.status >= 300 || !response.data?.fileName) {
    const responseMessage = typeof response.data === "string" ? response.data : null;
    throw new Error(responseMessage || "첨부파일 업로드에 실패했습니다.");
  }
  return response.data;
}
