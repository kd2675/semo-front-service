import { queryOptions } from "@tanstack/react-query";

import {
  getResourceAttachments,
  type ResourceAttachmentType,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const attachmentQueryKeys = {
  resource: (clubId: string, resourceType: ResourceAttachmentType, resourceId: number) =>
    ["semo", "clubs", clubId, "attachments", resourceType, resourceId] as const,
};

export function resourceAttachmentsQueryOptions(
  clubId: string,
  resourceType: ResourceAttachmentType,
  resourceId: number,
) {
  return queryOptions({
    queryKey: attachmentQueryKeys.resource(clubId, resourceType, resourceId),
    queryFn: async () => requireApiData(
      await getResourceAttachments(clubId, resourceType, resourceId),
      "첨부파일을 불러오지 못했습니다.",
    ),
  });
}
