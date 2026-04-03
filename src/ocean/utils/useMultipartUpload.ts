/**
 * ─── useMultipartUpload Hook ──────────────────────────────────────────────────
 * 
 * Production-grade React hook for large file uploads via S3-compatible
 * multipart upload with presigned URLs.
 * 
 * Features:
 *   ✅ Chunked upload (configurable 5–10MB chunks)
 *   ✅ Parallel uploads (configurable 3–5 concurrent)
 *   ✅ Automatic retry with exponential backoff
 *   ✅ Pause / Resume support
 *   ✅ Cancel with AbortController
 *   ✅ Per-chunk + aggregate progress tracking (0–100%)
 *   ✅ Upload speed indicator (MB/s)
 *   ✅ Estimated time remaining
 *   ✅ ETag extraction from response headers
 *   ✅ Post-upload confirmation (DB save + HLS trigger)
 */

import { useState, useRef, useCallback } from "react";
import { multipartApi, type CompletePart } from "@/ocean/api/multipart.service";

// ─── Configuration ───────────────────────────────────────────────────────────

/** Default chunk size: 10MB (minimum 5MB for S3/MinIO) */
const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

/** Maximum parallel uploads */
const MAX_CONCURRENCY = 4;

/** Maximum retry attempts per chunk */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms) */
const RETRY_BASE_DELAY = 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

export type UploadStatus = "idle" | "uploading" | "paused" | "completed" | "error";

export type FileType = "thumbnail" | "preview" | "full";

export interface UploadProgress {
  /** Overall progress 0 → 100 */
  percentage: number;
  /** Bytes uploaded so far */
  bytesUploaded: number;
  /** Total file size in bytes */
  totalBytes: number;
  /** Current upload speed in bytes/sec */
  speed: number;
  /** Formatted speed string (e.g. "12.5 MB/s") */
  speedFormatted: string;
  /** Estimated seconds remaining */
  estimatedTimeRemaining: number;
  /** Formatted ETA (e.g. "2m 30s") */
  etaFormatted: string;
  /** Upload status */
  status: UploadStatus;
  /** Number of chunks completed */
  chunksCompleted: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Error message if status is "error" */
  errorMessage?: string;
  /** The object key after upload */
  key?: string;
}

interface ChunkState {
  index: number;
  partNumber: number; // 1-indexed for S3
  start: number;
  end: number;
  uploaded: boolean;
  bytesUploaded: number;
  size: number;
  etag?: string;
  retries: number;
}

// ─── Speed Tracker ───────────────────────────────────────────────────────────

class SpeedTracker {
  private samples: { time: number; bytes: number }[] = [];
  private windowMs = 3000; // 3-second rolling window

  addSample(bytes: number) {
    const now = Date.now();
    this.samples.push({ time: now, bytes });
    // Prune old samples
    this.samples = this.samples.filter((s) => now - s.time < this.windowMs);
  }

  getSpeed(): number {
    if (this.samples.length < 2) return 0;
    const oldest = this.samples[0];
    const newest = this.samples[this.samples.length - 1];
    const timeDiff = (newest.time - oldest.time) / 1000; // seconds
    if (timeDiff === 0) return 0;
    const totalBytes = this.samples.reduce((sum, s) => sum + s.bytes, 0);
    return totalBytes / timeDiff;
  }

  reset() {
    this.samples = [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "calculating...";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMultipartUpload() {
  const [progress, setProgress] = useState<UploadProgress>({
    percentage: 0,
    bytesUploaded: 0,
    totalBytes: 0,
    speed: 0,
    speedFormatted: "0 B/s",
    estimatedTimeRemaining: 0,
    etaFormatted: "calculating...",
    status: "idle",
    chunksCompleted: 0,
    totalChunks: 0,
  });

  // Refs for mutable state that shouldn't trigger re-renders
  const chunksRef = useRef<ChunkState[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const uploadIdRef = useRef<string>("");
  const keyRef = useRef<string>("");
  const fileRef = useRef<File | null>(null);
  const speedTrackerRef = useRef(new SpeedTracker());
  const completedPartsRef = useRef<CompletePart[]>([]);

  // ─── Update progress state ─────────────────────────────────────────

  const updateProgress = useCallback(
    (chunks: ChunkState[], status: UploadStatus, totalBytes: number, errorMessage?: string) => {
      const bytesUploaded = chunks.reduce((sum, c) => sum + c.bytesUploaded, 0);
      const percentage = totalBytes > 0 ? Math.min(Math.round((bytesUploaded / totalBytes) * 100), 100) : 0;
      const speed = speedTrackerRef.current.getSpeed();
      const remaining = totalBytes - bytesUploaded;
      const eta = speed > 0 ? remaining / speed : 0;
      const chunksCompleted = chunks.filter((c) => c.uploaded).length;

      setProgress({
        percentage,
        bytesUploaded,
        totalBytes,
        speed,
        speedFormatted: formatSpeed(speed),
        estimatedTimeRemaining: eta,
        etaFormatted: formatEta(eta),
        status,
        chunksCompleted,
        totalChunks: chunks.length,
        errorMessage,
        key: keyRef.current || undefined,
      });
    },
    []
  );

  // ─── Upload a single chunk via XHR (for progress tracking) ─────────

  const uploadChunk = useCallback(
    (
      chunk: ChunkState,
      presignedUrl: string,
      fileSlice: Blob,
      abortSignal: AbortSignal
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Wire up abort signal
        const onAbort = () => {
          xhr.abort();
          reject(new DOMException("Upload aborted", "AbortError"));
        };
        abortSignal.addEventListener("abort", onAbort, { once: true });

        xhr.open("PUT", presignedUrl, true);

        // Track per-chunk upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            chunk.bytesUploaded = event.loaded;
            speedTrackerRef.current.addSample(event.loaded - (chunk.bytesUploaded || 0));
            // Update aggregate progress
            updateProgress(chunksRef.current, "uploading", fileRef.current?.size || 0);
          }
        };

        xhr.onload = () => {
          abortSignal.removeEventListener("abort", onAbort);

          if (xhr.status >= 200 && xhr.status < 300) {
            // Extract ETag from response headers
            let etag = xhr.getResponseHeader("ETag");
            if (etag) {
              // Remove surrounding quotes if present
              etag = etag.replace(/"/g, "");
            }
            chunk.bytesUploaded = chunk.size;
            chunk.uploaded = true;
            chunk.etag = etag || "";
            resolve(etag || "");
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          abortSignal.removeEventListener("abort", onAbort);
          reject(new Error("Network error during chunk upload"));
        };

        xhr.ontimeout = () => {
          abortSignal.removeEventListener("abort", onAbort);
          reject(new Error("Upload timeout"));
        };

        // Set a generous timeout for large chunks
        xhr.timeout = 5 * 60 * 1000; // 5 minutes per chunk

        xhr.send(fileSlice);
      });
    },
    [updateProgress]
  );

  // ─── Upload chunk with retry logic ─────────────────────────────────

  const uploadChunkWithRetry = useCallback(
    async (chunk: ChunkState, abortSignal: AbortSignal): Promise<CompletePart> => {
      const file = fileRef.current!;
      const fileSlice = file.slice(chunk.start, chunk.end);

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Check if paused — wait until resumed
          while (isPausedRef.current) {
            await new Promise((r) => setTimeout(r, 500));
            if (abortSignal.aborted) {
              throw new DOMException("Upload aborted", "AbortError");
            }
          }

          // Get a fresh presigned URL for this part
          const { url } = await multipartApi.signPart({
            uploadId: uploadIdRef.current,
            key: keyRef.current,
            partNumber: chunk.partNumber,
          });

          // Upload the chunk
          const etag = await uploadChunk(chunk, url, fileSlice, abortSignal);

          return { ETag: etag, PartNumber: chunk.partNumber };
        } catch (error: any) {
          // Don't retry on user-initiated abort
          if (error.name === "AbortError") throw error;

          if (attempt < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
            console.warn(
              `⚠️ Chunk ${chunk.partNumber} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms...`,
              error.message
            );
            await new Promise((r) => setTimeout(r, delay));
            // Reset chunk progress for retry
            chunk.bytesUploaded = 0;
            chunk.uploaded = false;
          } else {
            throw new Error(
              `Chunk ${chunk.partNumber} failed after ${MAX_RETRIES + 1} attempts: ${error.message}`
            );
          }
        }
      }

      // Should never reach here
      throw new Error(`Chunk ${chunk.partNumber} upload failed`);
    },
    [uploadChunk]
  );

  // ─── Parallel upload orchestrator ──────────────────────────────────

  const uploadAllChunks = useCallback(
    async (chunks: ChunkState[], abortSignal: AbortSignal): Promise<CompletePart[]> => {
      const pendingChunks = chunks.filter((c) => !c.uploaded);
      const results: CompletePart[] = [...completedPartsRef.current];
      let activeCount = 0;
      let chunkIndex = 0;

      return new Promise((resolve, reject) => {
        const processNext = () => {
          // Check abort
          if (abortSignal.aborted) {
            reject(new DOMException("Upload aborted", "AbortError"));
            return;
          }

          // All done?
          if (results.length === chunks.length) {
            resolve(results);
            return;
          }

          // Launch more uploads up to concurrency limit
          while (activeCount < MAX_CONCURRENCY && chunkIndex < pendingChunks.length) {
            const chunk = pendingChunks[chunkIndex++];
            activeCount++;

            uploadChunkWithRetry(chunk, abortSignal)
              .then((part) => {
                activeCount--;
                results.push(part);
                completedPartsRef.current.push(part);

                // Update progress
                updateProgress(chunksRef.current, "uploading", fileRef.current?.size || 0);

                processNext();
              })
              .catch((error) => {
                activeCount--;
                reject(error);
              });
          }
        };

        processNext();
      });
    },
    [uploadChunkWithRetry, updateProgress]
  );

  // ─── Main upload function ──────────────────────────────────────────

  const startUpload = useCallback(
    async (
      file: File,
      options: {
        videoId: string | number;
        episodeId?: string | number;
        fileType: FileType;
        chunkSize?: number;
      }
    ) => {
      const { videoId, episodeId, fileType, chunkSize = DEFAULT_CHUNK_SIZE } = options;

      // Reset state
      fileRef.current = file;
      isPausedRef.current = false;
      completedPartsRef.current = [];
      speedTrackerRef.current.reset();

      // Create abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Split file into chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      const chunks: ChunkState[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        chunks.push({
          index: i,
          partNumber: i + 1, // S3 parts are 1-indexed
          start,
          end,
          uploaded: false,
          bytesUploaded: 0,
          size: end - start,
          retries: 0,
        });
      }

      chunksRef.current = chunks;
      updateProgress(chunks, "uploading", file.size);

      try {
        // Step 1: Initialize multipart upload
        const { uploadId, key } = await multipartApi.init({
          videoId,
          episodeId,
          fileType,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
        });

        uploadIdRef.current = uploadId;
        keyRef.current = key;

        console.log(`🚀 Multipart upload started: ${key} (${totalChunks} chunks)`);

        // Step 2: Upload all chunks in parallel
        const parts = await uploadAllChunks(chunks, abortController.signal);

        // Step 3: Complete the multipart upload
        await multipartApi.complete({
          uploadId,
          key,
          parts,
        });

        console.log(`✅ Multipart upload completed: ${key}`);

        // Step 4: Confirm upload (save to DB, trigger HLS processing)
        await multipartApi.confirm({
          videoId,
          episodeId,
          fileType,
          key,
        });

        console.log(`📝 Upload confirmed in database: ${key}`);

        // Final state
        updateProgress(chunks, "completed", file.size);

        return { key, uploadId };
      } catch (error: any) {
        if (error.name === "AbortError") {
          // User cancelled — abort the multipart upload on the server
          if (uploadIdRef.current && keyRef.current) {
            try {
              await multipartApi.abort({
                uploadId: uploadIdRef.current,
                key: keyRef.current,
              });
            } catch (abortErr) {
              console.error("Failed to abort upload on server:", abortErr);
            }
          }
          updateProgress(chunks, "idle", file.size);
        } else {
          console.error("Upload failed:", error);
          updateProgress(chunks, "error", file.size, error.message);
        }
        throw error;
      }
    },
    [uploadAllChunks, updateProgress]
  );

  // ─── Pause ─────────────────────────────────────────────────────────

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setProgress((prev) => ({ ...prev, status: "paused" }));
  }, []);

  // ─── Resume ────────────────────────────────────────────────────────

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setProgress((prev) => ({ ...prev, status: "uploading" }));
  }, []);

  // ─── Cancel ────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    isPausedRef.current = false;
    setProgress({
      percentage: 0,
      bytesUploaded: 0,
      totalBytes: 0,
      speed: 0,
      speedFormatted: "0 B/s",
      estimatedTimeRemaining: 0,
      etaFormatted: "calculating...",
      status: "idle",
      chunksCompleted: 0,
      totalChunks: 0,
    });
  }, []);

  // ─── Reset ─────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    isPausedRef.current = false;
    chunksRef.current = [];
    completedPartsRef.current = [];
    uploadIdRef.current = "";
    keyRef.current = "";
    fileRef.current = null;
    speedTrackerRef.current.reset();
    setProgress({
      percentage: 0,
      bytesUploaded: 0,
      totalBytes: 0,
      speed: 0,
      speedFormatted: "0 B/s",
      estimatedTimeRemaining: 0,
      etaFormatted: "calculating...",
      status: "idle",
      chunksCompleted: 0,
      totalChunks: 0,
    });
  }, []);

  return {
    progress,
    startUpload,
    pause,
    resume,
    cancel,
    reset,
  };
}
