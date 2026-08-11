import { mutationOptions } from "@tanstack/react-query";

import {
  createResourceAttachment,
  deleteResourceAttachment,
  type ResourceAttachmentType,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export function createResourceAttachmentMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: async (request: {
      resourceType: ResourceAttachmentType;
      resourceId: number;
      tempFileName: string;
      uploadToken: string;
      originalFileName: string;
    }) => requireApiData(
      await createResourceAttachment(clubId, request),
      "첨부파일을 등록하지 못했습니다.",
    ),
  });
}

export function deleteResourceAttachmentMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: async (attachmentId: number) => requireApiData(
      await deleteResourceAttachment(clubId, attachmentId),
      "첨부파일을 삭제하지 못했습니다.",
    ),
  });
}
