const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "http://localhost:8081";

export type TempImageUploadResponse = {
  fileName: string;
  originalFileName: string;
  imageUrl: string;
  thumbnailUrl: string;
  temporary: boolean;
};

export type TempImageUploadResult = {
  data: TempImageUploadResponse | null;
  error?: string;
};

export async function uploadTempImage(file: File): Promise<TempImageUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${IMAGE_BASE}/upload/temp`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        data: null,
        error: response.statusText || "이미지 업로드에 실패했습니다.",
      };
    }

    const parsed = (await response.json()) as TempImageUploadResponse;
    if (!parsed?.fileName) {
      return {
        data: null,
        error: "이미지 업로드 응답이 올바르지 않습니다.",
      };
    }

    return {
      data: parsed,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: null,
      error: "알 수 없는 업로드 오류가 발생했습니다.",
    };
  }
}
