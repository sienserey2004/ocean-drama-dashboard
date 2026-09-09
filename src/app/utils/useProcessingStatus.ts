/**
 * ─── useProcessingStatus Hook ─────────────────────────────────────────────────
 *
 * Uses Socket.io for real-time progress updates with HTTP polling as a fallback.
 *
 * Statuses: pending → DOWNLOADING → DOWNLOADED → PROCESSING → TRANSCODING → UPLOADING → READY
 */

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/app/api/client";
import { socketService } from "@/app/lib/socket";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProcessingStatus =
  | "idle"
  | "PENDING"
  | "DOWNLOADING"
  | "DOWNLOADED"
  | "PROCESSING"
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

const POLL_INTERVAL_MS = 10000; // Slower fallback polling since we have sockets

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

  // Sync state helper
  const updateState = useCallback((data: any) => {
    if (!isMountedRef.current) return;

    const newStatus = data.status as ProcessingStatus;
    const isReady = data.is_ready === true || newStatus === "READY";

    setState((prev) => ({
      ...prev,
      status: newStatus,
      progress: data.progress ?? prev.progress,
      isReady,
      hlsUrl: data.hls_url ?? prev.hlsUrl,
      error: data.status === 'FAILED' ? (data.message || 'Processing failed') : null,
      isPolling: !isReady,
    }));

    if (isReady) {
      stopPolling();
    }
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

  const fetchStatus = useCallback(async (episodeId: number) => {
    try {
      const { data } = await api.get(`/episodes/${episodeId}/processing-status`);
      updateState(data);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch status";
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [updateState]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Subscribe to socket events
    const cleanupSocket = socketService.onProgress((data) => {
        if (data.episode_id === episodeIdRef.current) {
            console.log("⚡ Socket Update:", data);
            updateState(data);
        }
    });

    return () => {
      isMountedRef.current = false;
      stopPolling();
      cleanupSocket();
    };
  }, [updateState, stopPolling]);

  /**
   * Start tracking an episode
   */
  const startPolling = useCallback(
    (episodeId: number) => {
      episodeIdRef.current = episodeId;
      stopPolling();

      setState({
        ...INITIAL_STATE,
        status: "PENDING",
        isPolling: true,
      });

      // Join the socket room for this episode
      socketService.joinEpisode(episodeId);

      // Immediate fetch
      fetchStatus(episodeId);

      // Start fallback interval
      intervalRef.current = setInterval(() => {
        fetchStatus(episodeId);
      }, POLL_INTERVAL_MS);
    },
    [fetchStatus, stopPolling]
  );

  const stop = useCallback(() => {
    stopPolling();
    episodeIdRef.current = null;
  }, [stopPolling]);

  const reset = useCallback(() => {
    stop();
    setState(INITIAL_STATE);
  }, [stop]);

  return {
    ...state,
    startPolling,
    stop,
    reset,
    isPolling: state.isPolling
  };
}
