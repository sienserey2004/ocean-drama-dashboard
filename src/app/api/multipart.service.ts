/**
 * ─── Multipart Upload API Service ─────────────────────────────────────────────
 * 
 * Thin API layer that talks to the backend multipart endpoints.
 * No file data passes through here — only orchestration calls.
 */

import api from "./client";

export interface InitMultipartPayload {
  videoId: string | number;
  episodeId?: string | number;
  fileType: "thumbnail" | "preview" | "full";
  fileName: string;
  mimeType: string;
}

export interface InitMultipartResponse {
  uploadId: string;
  key: string;
}

export interface SignPartPayload {
  uploadId: string;
  key: string;
  partNumber: number;
}

export interface SignPartsBatchPayload {
  uploadId: string;
  key: string;
  partNumbers: number[];
}

export interface CompletePart {
  ETag: string;
  PartNumber: number;
}

export interface CompleteMultipartPayload {
  uploadId: string;
  key: string;
  parts: CompletePart[];
}

export interface ConfirmUploadPayload {
  videoId: string | number;
  episodeId?: string | number;
  fileType: string;
  key: string;
}

export const multipartApi = {
  /** Step 1: Initialize a multipart upload, get uploadId + key */
  init: (payload: InitMultipartPayload): Promise<InitMultipartResponse> =>
    api.post("/multipart/init", payload).then((r) => r.data),

  /** Step 2a: Get presigned URL for a single part */
  signPart: (payload: SignPartPayload): Promise<{ url: string }> =>
    api.post("/multipart/sign-part", payload).then((r) => r.data),

  /** Step 2b: Get presigned URLs for multiple parts (batch) */
  signPartsBatch: (
    payload: SignPartsBatchPayload
  ): Promise<{ urls: { partNumber: number; url: string }[] }> =>
    api.post("/multipart/sign-parts", payload).then((r) => r.data),

  /** Step 3: Complete the multipart upload */
  complete: (payload: CompleteMultipartPayload) =>
    api.post("/multipart/complete", payload).then((r) => r.data),

  /** Step 4: Abort an in-progress upload */
  abort: (payload: { uploadId: string; key: string }) =>
    api.post("/multipart/abort", payload).then((r) => r.data),

  /** Step 5: Confirm upload, save key to DB, trigger processing */
  confirm: (payload: ConfirmUploadPayload) =>
    api.post("/multipart/confirm", payload).then((r) => r.data),
};
