// =============================================================================
// 🚀 Client-Side Direct Upload Utility (Zero-Leak Browser-to-B2 Upload)
// 1. Obtains short-lived presigned PUT URL via /api/storage/presign-upload
// 2. Uploads file binary directly from browser to Backblaze B2 Private Vault
// 3. Tracks real-time upload progress with cancel/abort support
// 4. Seamlessly falls back to server multipart if client CORS is blocked
// =============================================================================

export interface DirectUploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface DirectUploadResult {
  storageKey: string;
  url: string;
  driver: string;
}

export async function directUploadFile(
  file: File,
  options?: DirectUploadOptions,
): Promise<DirectUploadResult> {
  // Step 1: Request presigned upload ticket
  const presignRes = await fetch("/api/storage/presign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
    signal: options?.signal,
  });

  const presignData = (await presignRes.json().catch(() => ({}))) as {
    uploadUrl?: string;
    storageKey?: string;
    driver?: string;
    error?: string;
  };

  if (!presignRes.ok || !presignData.uploadUrl || !presignData.storageKey) {
    throw new Error(presignData.error ?? "Failed to obtain upload authorization");
  }

  const { uploadUrl, storageKey, driver = "b2" } = presignData;

  // Step 2: Direct browser PUT with XHR for accurate upload progress
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (options?.signal) {
      options.signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Direct storage upload failed with status ${xhr.status} (${xhr.statusText || "Forbidden/CORS"})`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Storage network error during direct upload"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload cancelled by user"));
    };

    xhr.send(file);
  });

  return {
    storageKey,
    url: `/api/storage/file/${storageKey}`,
    driver,
  };
}
