/**
 * ─── useProcessingStatus Hook ─────────────────────────────────────────────────
 *
 * Polls GET /api/episodes/:episode_id/processing-status every 2.5 seconds
 * until `is_ready === true` or an error occurs.
 *
 * Statuses: pending → DOWNLOADING → DOWNLOADED → PROCESSING → TRANSCODING → UPLOADING → READY
 */

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/app/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProcessingStatus =
  | "idle"
  | "PENDING"
  | "DOWNLOADING"
  | "TRANSCODING"
  | "UPLOADING"
  | "READY"
  | "FAILED";

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  isReady: boolean;
  hlsUrl: string | null;
  error: string | null;
  isPolling: boolean;
}

const POLL_INTERVAL_MS = 3000;

const INITIAL_STATE: ProcessingState = {
  status: "idle",
  progress: 0,
  isReady: false,
  hlsUrl: null,
  error: null,
  isPolling: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProcessingStatus() {
  const [state, setState] = useState<ProcessingState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const episodeIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, isPolling: false }));
    }
  }, []);

  const poll = useCallback(async (episodeId: number) => {
    try {
      const { data } = await api.get(`/episodes/${episodeId}/processing-status`);

      if (!isMountedRef.current) return;

      const newStatus = data.status as ProcessingStatus;
      const isReady = data.is_ready === true || newStatus === "READY";

      setState({
        status: newStatus,
        progress: data.progress ?? 0,
        isReady,
        hlsUrl: data.hls_url ?? null,
        error: null,
        isPolling: !isReady,
      });

      // Stop polling once ready
      if (isReady) {
        stopPolling();
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const msg =
        err?.response?.data?.message || err?.message || "Failed to fetch status";

      // Don't stop on transient errors — keep polling
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [stopPolling]);

  /**
   * Start polling for `episodeId`.
   * Call this immediately after `multipart/confirm` returns.
   */
  const startPolling = useCallback(
    (episodeId: number) => {
      // Avoid double-polling the same episode
      if (intervalRef.current && episodeIdRef.current === episodeId) return;

      episodeIdRef.current = episodeId;
      stopPolling();

      setState({
        status: "PENDING",
        progress: 0,
        isReady: false,
        hlsUrl: null,
        error: null,
        isPolling: true,
      });

      // Immediate first poll
      poll(episodeId);

      // Then every 2.5 seconds
      intervalRef.current = setInterval(() => {
        poll(episodeId);
      }, POLL_INTERVAL_MS);
    },
    [poll, stopPolling]
  );

  /** Manually stop polling without resetting state */
  const stop = useCallback(() => {
    stopPolling();
  }, [stopPolling]);

  /** Reset to idle */
  const reset = useCallback(() => {
    stopPolling();
    episodeIdRef.current = null;
    setState(INITIAL_STATE);
  }, [stopPolling]);

  return {
    ...state,
    startPolling,
    stop,
    reset,
  };
}
