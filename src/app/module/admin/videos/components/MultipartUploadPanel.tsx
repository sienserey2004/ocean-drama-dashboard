/**
 * ─── MultipartUploadPanel ─────────────────────────────────────────────────────
 * 
 * A premium, production-grade upload UI component that integrates with
 * the useMultipartUpload hook to provide:
 * 
 *   - Drag & drop file selection
 *   - File type selector (thumbnail / preview / full)
 *   - Real-time progress bar with percentage
 *   - Upload speed indicator (MB/s)
 *   - Estimated time remaining
 *   - Chunk progress visualization
 *   - Pause / Resume / Cancel controls
 *   - Status animations and transitions
 */

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload,
  Pause,
  PlayArrow,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Speed,
  Timer,
  DataUsage,
  Refresh,
  UploadFile,
  VideoFile,
  Image as ImageIcon,
} from "@mui/icons-material";
import {
  useMultipartUpload,
  type UploadProgress,
  type FileType,
} from "@/app/utils/useMultipartUpload";

// ─── Helper: format bytes ────────────────────────────────────────────────────

function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── Status colors ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  idle: "#64748b",
  uploading: "#6366f1",
  paused: "#f59e0b",
  completed: "#10b981",
  error: "#ef4444",
};

// ─── File type config ────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<
  FileType,
  { label: string; icon: React.ReactNode; accept: string; color: string }
> = {
  thumbnail: {
    label: "Thumbnail",
    icon: <ImageIcon />,
    accept: "image/*",
    color: "#f59e0b",
  },
  preview: {
    label: "Preview Video",
    icon: <VideoFile />,
    accept: "video/*",
    color: "#10b981",
  },
  full: {
    label: "Full Video",
    icon: <CloudUpload />,
    accept: "video/*",
    color: "#6366f1",
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface MultipartUploadPanelProps {
  videoId: string | number;
  episodeId?: string | number;
  fileType: FileType;
  onUploadComplete?: (key: string) => void;
  onUploadError?: (error: string) => void;
  /** Compact mode for embedding in dialogs */
  compact?: boolean;
  /** Whether the upload is blocked (e.g. parent record not created yet) */
  disabled?: boolean;
  /** Custom hint to show when disabled */
  disabledHint?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MultipartUploadPanel({
  videoId,
  episodeId,
  fileType,
  onUploadComplete,
  onUploadError,
  compact = false,
  disabled = false,
  disabledHint = "Complete primary details first",
}: MultipartUploadPanelProps) {
  const { progress, startUpload, pause, resume, cancel, reset } =
    useMultipartUpload();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = FILE_TYPE_CONFIG[fileType];
  const isUploading =
    progress.status === "uploading" || progress.status === "paused";

  // Handle completion callback
  useEffect(() => {
    if (progress.status === "completed" && progress.key) {
      onUploadComplete?.(progress.key);
    }
    if (progress.status === "error" && progress.errorMessage) {
      onUploadError?.(progress.errorMessage);
    }
  }, [progress.status, progress.key, progress.errorMessage, onUploadComplete, onUploadError]);

  // ─── File selection ────────────────────────────────────────────────

  const handleFile = (f: File) => {
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ─── Start upload ─────────────────────────────────────────────────

  const handleStartUpload = async () => {
    if (!file) return;
    try {
      await startUpload(file, { videoId, episodeId, fileType });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Upload failed:", err);
      }
    }
  };

  // ─── Reset everything ──────────────────────────────────────────────

  const handleReset = () => {
    reset();
    setFile(null);
  };

  // ─── Progress bar color ────────────────────────────────────────────

  const progressColor =
    progress.status === "error"
      ? "error"
      : progress.status === "completed"
        ? "success"
        : progress.status === "paused"
          ? "warning"
          : "primary";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: compact ? "16px" : "24px",
        border: "1px solid",
        borderColor: isUploading
          ? `${STATUS_COLORS[progress.status]}40`
          : "divider",
        overflow: "hidden",
        transition: "all 0.3s ease",
        ...(isUploading && {
          boxShadow: `0 0 20px ${STATUS_COLORS[progress.status]}15`,
        }),
      }}
    >
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: compact ? 2 : 3,
          py: compact ? 1.5 : 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: `linear-gradient(135deg, ${config.color}08, transparent)`,
        }}
      >
        <Box
          sx={{
            p: 0.8,
            borderRadius: "10px",
            bgcolor: `${config.color}15`,
            color: config.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {config.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            {config.label} Upload
          </Typography>
          {!compact && (
            <Typography variant="caption" color="text.secondary">
              Multipart · Parallel chunks · Auto-retry
            </Typography>
          )}
        </Box>
        <Chip
          label={progress.status.toUpperCase()}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "0.65rem",
            letterSpacing: "0.5px",
            bgcolor: `${STATUS_COLORS[progress.status]}15`,
            color: STATUS_COLORS[progress.status],
            borderRadius: "8px",
          }}
        />
      </Box>

      <Box sx={{ px: compact ? 2 : 3, py: compact ? 2 : 2.5 }}>
        {/* ─── Drop Zone (shown when idle or no file) ─────────────────── */}
        {progress.status === "idle" && (
          <>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: dragging
                  ? config.color
                  : file
                    ? "success.main"
                    : "divider",
                borderRadius: "16px",
                p: compact ? 2 : 3,
                cursor: "pointer",
                transition: "all 0.2s ease",
                bgcolor: dragging
                  ? `${config.color}08`
                  : file
                    ? "success.lighter"
                    : "action.hover",
                "&:hover": {
                  borderColor: config.color,
                  bgcolor: `${config.color}08`,
                },
                textAlign: "center",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept={config.accept}
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />

              {file ? (
                <Stack spacing={1} alignItems="center">
                  <CheckCircle
                    sx={{ fontSize: 32, color: "success.main" }}
                  />
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmtBytes(file.size)} · Click to change
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="center">
                  <UploadFile
                    sx={{ fontSize: 40, color: config.color, opacity: 0.6 }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    Drag & drop or click to select
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {fileType === "thumbnail"
                      ? "JPG, PNG, WebP supported"
                      : "MP4, MOV, MKV supported · Up to 5GB"}
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Start button */}
            {file && (
              <Tooltip title={disabled ? disabledHint : ""} arrow>
                <Box sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={handleStartUpload}
                    disabled={disabled || !episodeId}
                    sx={{
                      py: 1.2,
                      borderRadius: "12px",
                      fontWeight: 800,
                      background: disabled ? "action.disabledBackground" : `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                      "&:hover": {
                        background: disabled ? "action.hover" : `linear-gradient(135deg, ${config.color}dd, ${config.color})`,
                      },
                    }}
                  >
                    {disabled ? "Waiting for Episode Details" : "Start Upload"}
                  </Button>
                </Box>
              </Tooltip>
            )}
          </>
        )}

        {/* ─── Upload Progress (shown during upload) ──────────────────── */}
        <Collapse in={isUploading || progress.status === "completed" || progress.status === "error"}>
          <Stack spacing={2}>
            {/* File info */}
            {file && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 0.5 }}
              >
                <VideoFile
                  sx={{ color: config.color, fontSize: 20, opacity: 0.8 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmtBytes(file.size)}
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* Progress bar */}
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.5}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={STATUS_COLORS[progress.status]}
                >
                  {progress.status === "completed"
                    ? "✅ Upload Complete"
                    : progress.status === "error"
                      ? "❌ Upload Failed"
                      : progress.status === "paused"
                        ? "⏸ Paused"
                        : "Uploading..."}
                </Typography>
                <Typography variant="caption" fontWeight={800}>
                  {progress.percentage}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={progress.percentage}
                color={progressColor}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    transition: "transform 0.3s ease",
                  },
                }}
              />

              {/* Bytes progress */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {fmtBytes(progress.bytesUploaded)} / {fmtBytes(progress.totalBytes)}
                {" · "}
                {progress.chunksCompleted}/{progress.totalChunks} chunks
              </Typography>
            </Box>

            {/* Speed + ETA stats */}
            {(progress.status === "uploading" ||
              progress.status === "paused") && (
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "action.hover",
                }}
              >
                <Tooltip title="Upload Speed" arrow>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <Speed
                      sx={{ fontSize: 16, color: "primary.main", opacity: 0.7 }}
                    />
                    <Typography variant="caption" fontWeight={700}>
                      {progress.speedFormatted}
                    </Typography>
                  </Stack>
                </Tooltip>

                <Tooltip title="Estimated Time Remaining" arrow>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <Timer
                      sx={{ fontSize: 16, color: "warning.main", opacity: 0.7 }}
                    />
                    <Typography variant="caption" fontWeight={700}>
                      {progress.etaFormatted}
                    </Typography>
                  </Stack>
                </Tooltip>

                <Tooltip title="Chunks" arrow>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <DataUsage
                      sx={{ fontSize: 16, color: "success.main", opacity: 0.7 }}
                    />
                    <Typography variant="caption" fontWeight={700}>
                      {progress.chunksCompleted}/{progress.totalChunks}
                    </Typography>
                  </Stack>
                </Tooltip>
              </Stack>
            )}

            {/* Error message */}
            {progress.status === "error" && progress.errorMessage && (
              <Paper
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  bgcolor: "error.lighter",
                  border: "1px solid",
                  borderColor: "error.light",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ErrorIcon sx={{ color: "error.main", fontSize: 18 }} />
                  <Typography
                    variant="caption"
                    color="error.main"
                    fontWeight={600}
                  >
                    {progress.errorMessage}
                  </Typography>
                </Stack>
              </Paper>
            )}

            {/* Action buttons */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {progress.status === "uploading" && (
                <Tooltip title="Pause Upload" arrow>
                  <IconButton
                    size="small"
                    onClick={pause}
                    sx={{
                      bgcolor: "warning.lighter",
                      color: "warning.main",
                      "&:hover": { bgcolor: "warning.light" },
                    }}
                  >
                    <Pause fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {progress.status === "paused" && (
                <Tooltip title="Resume Upload" arrow>
                  <IconButton
                    size="small"
                    onClick={resume}
                    sx={{
                      bgcolor: "success.lighter",
                      color: "success.main",
                      "&:hover": { bgcolor: "success.light" },
                    }}
                  >
                    <PlayArrow fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {isUploading && (
                <Tooltip title="Cancel Upload" arrow>
                  <IconButton
                    size="small"
                    onClick={cancel}
                    sx={{
                      bgcolor: "error.lighter",
                      color: "error.main",
                      "&:hover": { bgcolor: "error.light" },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {(progress.status === "completed" ||
                progress.status === "error") && (
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  sx={{ fontWeight: 700 }}
                >
                  Upload Another
                </Button>
              )}
            </Stack>
          </Stack>
        </Collapse>
      </Box>
    </Paper>
  );
}
