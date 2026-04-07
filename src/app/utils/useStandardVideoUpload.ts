/**
 * ─── useStandardVideoUpload Hook ──────────────────────────────────────────────
 * 
 * Simple React hook for standard multipart/form-data video uploads
 * for the new backend integration flow.
 * 
 * Flow:
 *  1. POST/PUT file to backend (standard multipart)
 *  2. Get episode_id
 *  3. Poll for processing status
 */

import { useState, useRef, useCallback } from "react";
import api from "@/app/api/client";
import { useProcessingStatus } from "./useProcessingStatus";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UploadStatus = "idle" | "uploading" | "completed" | "error";

export interface UploadState {
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
  speed: number;
  speedFormatted: string;
  estimatedTimeRemaining: number;
  etaFormatted: string;
  status: UploadStatus;
  errorMessage?: string;
  episodeId?: number;
}

const INITIAL_STATE: UploadState = {
  percentage: 0,
  bytesUploaded: 0,
  totalBytes: 0,
  speed: 0,
  speedFormatted: "0 B/s",
  estimatedTimeRemaining: 0,
  etaFormatted: "calculating...",
  status: "idle",
};

// ─── Speed Tracking Helpers ─────────────────────────────────────────

class SpeedTracker {
  private samples: { time: number; bytes: number }[] = [];
  private windowMs = 3000;

  addSample(bytes: number) {
    const now = Date.now();
    this.samples.push({ time: now, bytes });
    this.samples = this.samples.filter((s) => now - s.time < this.windowMs);
  }

  getSpeed(): number {
    if (this.samples.length < 2) return 0;
    const oldest = this.samples[0];
    const newest = this.samples[this.samples.length - 1];
    const timeDiff = (newest.time - oldest.time) / 1000;
    if (timeDiff <= 0) return 0;
    const totalBytes = this.samples.reduce((sum, s) => sum + s.bytes, 0) - oldest.bytes;
    return totalBytes / timeDiff;
  }

  reset() {
    this.samples = [];
  }
}

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

export function useStandardVideoUpload() {
  const [progress, setProgress] = useState<UploadState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speedTrackerRef = useRef(new SpeedTracker());
  const processingStatus = useProcessingStatus();

  const startUpload = useCallback(async (
    file: File,
    options: {
      videoId: string | number;
      episodeId?: string | number;
      fileType: "preview" | "full";
      onComplete?: (episodeId: number) => void;
    }
  ) => {
    const { videoId, episodeId, fileType, onComplete } = options;

    // Reset everything
    speedTrackerRef.current.reset();
    processingStatus.reset();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const updateState = (pct: number, loaded: number, total: number, status: UploadStatus, error?: string) => {
      const speed = speedTrackerRef.current.getSpeed();
      const remainingBytes = total - loaded;
      const eta = speed > 0 ? remainingBytes / speed : 0;

      setProgress((prev) => ({
        ...prev,
        percentage: pct,
        bytesUploaded: loaded,
        totalBytes: total,
        speed,
        speedFormatted: formatSpeed(speed),
        estimatedTimeRemaining: eta,
        etaFormatted: formatEta(eta),
        status,
        errorMessage: error,
      }));
    };

    updateState(0, 0, file.size, "uploading");

    const formData = new FormData();
    formData.append(fileType === "full" ? "full_video" : "preview_video", file);

    try {
      let response;
      if (episodeId) {
        // Updating existing episode
        response = await api.put<{ episode_id: number; message: string }>(
          `/episodes/${episodeId}`, 
          formData, 
          {
            signal: abortController.signal,
            onUploadProgress: (ev) => {
              if (ev.total) {
                const pct = Math.round((ev.loaded * 100) / ev.total);
                speedTrackerRef.current.addSample(ev.loaded);
                updateState(pct, ev.loaded, ev.total, "uploading");
              }
            }
          }
        );
      } else {
        // This case shouldn't normally happen in MultipartUploadPanel as it expects episodeId
        // But for completeness, we follow the guide's POST
        response = await api.post<{ episode_id: number; status: string; message: string }>(
          `/videos/${videoId}/episodes`, 
          formData, 
          {
            signal: abortController.signal,
            onUploadProgress: (ev) => {
              if (ev.total) {
                const pct = Math.round((ev.loaded * 100) / ev.total);
                speedTrackerRef.current.addSample(ev.loaded);
                updateState(pct, ev.loaded, ev.total, "uploading");
              }
            }
          }
        );
      }

      const returnedEpisodeId = response.data.episode_id;
      updateState(100, file.size, file.size, "completed");
      setProgress(prev => ({ ...prev, episodeId: returnedEpisodeId }));

      // Phase 2: Start polling
      processingStatus.startPolling(returnedEpisodeId);
      
      onComplete?.(returnedEpisodeId);

      return returnedEpisodeId;
    } catch (err: any) {
      if (err.name === "AbortError") {
        updateState(0, 0, file.size, "idle");
      } else {
        const msg = err.response?.data?.message || err.message || "Upload failed";
        updateState(0, 0, file.size, "error", msg);
        throw err;
      }
    }
  }, [processingStatus]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    cancel();
    setProgress(INITIAL_STATE);
    processingStatus.reset();
  }, [cancel, processingStatus]);

  return {
    progress,
    startUpload,
    cancel,
    reset,
    processingStatus,
  };
}
