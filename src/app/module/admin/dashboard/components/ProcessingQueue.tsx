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
  useTheme,
  alpha
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
  
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const azure = "#0EA5E9";

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
        return "#F59E0B";
      case "TRANSCODING":
      case "PROCESSING":
        return azure;
      case "COMPLETED":
      case "READY":
        return "#10B981";
      case "FAILED":
      case "ERROR":
        return "#EF4444";
      default:
        return azure;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: "28px",
        bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#FFFFFF", 0.4),
        backdropFilter: "blur(12px)",
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
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Pipeline status
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Active Operations • {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => { setLoading(true); fetchQueue(); }} sx={{ bgcolor: alpha(azure, 0.1), color: azure }}>
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
              bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#000000", 0.02),
              borderRadius: "20px",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Dns sx={{ fontSize: 48, color: "text.disabled", mb: 2, opacity: 0.3 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={800}>
               No active processing tasks detected
            </Typography>
          </Box>
        ) : (
          items.map((item) => (
            <Box
              key={`${item.episode_id}-${item.status}`}
              sx={{
                p: 3,
                borderRadius: "24px",
                bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "white",
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  boxShadow: `0 12px 30px -10px ${alpha(getStatusColor(item.status), 0.2)}`,
                  transform: "translateX(4px)",
                },
              }}
            >
              <Stack direction="row" spacing={2.5} sx={{ mb: 2.5 }}>
                <Avatar
                  src={item.thumbnail_url}
                  variant="rounded"
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: "14px",
                    border: "2px solid",
                    borderColor: alpha(getStatusColor(item.status), 0.2),
                  }}
                >
                  <Dns />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: getStatusColor(item.status), textTransform: "uppercase", letterSpacing: "1px", mb: 0.5, display: "block" }}>
                    {item.status}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: "0.95rem" }} noWrap>
                    {item.video_title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} noWrap display="block">
                    {item.episode_title}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                   <Typography variant="h6" sx={{ fontWeight: 900, color: getStatusColor(item.status) }}>
                      {item.progress}%
                   </Typography>
                </Box>
              </Stack>

              <Box>
                <Box sx={{ width: '100%', height: 10, bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.05), borderRadius: 5 }}>
                   <Box sx={{ 
                     width: `${item.progress}%`, 
                     height: '100%', 
                     bgcolor: getStatusColor(item.status), 
                     borderRadius: 5, 
                     boxShadow: `0 0 12px ${alpha(getStatusColor(item.status), 0.5)}`,
                     transition: 'width 0.5s ease'
                   }} />
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Stack>
    </Paper>
  );
};

export default ProcessingQueue;
