import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  LinearProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Refresh,
  Dns,
  Settings,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { episodeApi } from "@/app/api/episode.service";
import toast from "react-hot-toast";

interface ProcessingItem {
  episode_id: number;
  video_title: string;
  episode_title: string;
  status: string;
  progress: number;
  thumbnail_url: string;
  type: string;
}

const ProcessingQueue: React.FC = () => {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchQueue = useCallback(async () => {
    try {
      const res = await episodeApi.getProcessingQueue();
      setItems(res.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch processing queue", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "QUEUED":
        return "warning";
      case "TRANSCODING":
      case "PROCESSING":
        return "primary";
      case "COMPLETED":
      case "READY":
        return "success";
      case "FAILED":
      case "ERROR":
        return "error";
      default:
        return "info";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "QUEUED":
        return <CloudUpload sx={{ fontSize: 16 }} />;
      case "TRANSCODING":
      case "PROCESSING":
        return <Settings sx={{ fontSize: 16 }} className="animate-spin" />;
      case "COMPLETED":
      case "READY":
        return <CheckCircle sx={{ fontSize: 16 }} />;
      case "FAILED":
      case "ERROR":
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      default:
        return <Dns sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "24px",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Processing Queue
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => { setLoading(true); fetchQueue(); }} size="small">
            <Refresh fontSize="small" className={loading ? "animate-spin" : ""} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={2} sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        {items.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
              bgcolor: "action.hover",
              borderRadius: "16px",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Dns sx={{ fontSize: 40, color: "text.disabled", mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              No items in queue
            </Typography>
          </Box>
        ) : (
          items.map((item) => (
            <Box
              key={`${item.episode_id}-${item.status}`}
              sx={{
                p: 2.5,
                borderRadius: "20px",
                bgcolor: "action.hover",
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "background.paper",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Avatar
                  src={item.thumbnail_url}
                  variant="rounded"
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Dns />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", textTransform: "uppercase", letterSpacing: "1px", mb: 0.5, display: "block" }}>
                    Video Content
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>
                    {item.video_title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap display="block">
                    {item.episode_title}
                  </Typography>
                </Box>
                <Chip
                  label={item.status}
                  size="small"
                  color={getStatusColor(item.status) as any}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.65rem",
                    borderRadius: "8px",
                    height: 24,
                  }}
                />
              </Stack>

              <Stack spacing={2}>
                {/* Upload Status (Always 100% if it is in the processing queue) */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      Uploading to Server...
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      100%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={100}
                    color="success"
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "divider",
                      opacity: 0.8,
                    }}
                  />
                </Box>

                {/* Processing Status */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                        ⚙️ Processing: {item.status}...
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: item.status === 'FAILED' ? 'error.main' : 'primary.main' }}>
                      {item.progress}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    color={getStatusColor(item.status) as any}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "divider",
                      "& .MuiLinearProgress-bar": { borderRadius: 4 },
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          ))
        )}
      </Stack>
    </Paper>
  );
};

export default ProcessingQueue;
