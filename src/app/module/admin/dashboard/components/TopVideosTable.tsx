import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { PlayArrow, TrendingUp } from "@mui/icons-material";
import { PlatformTopVideo } from "@/app/types";

interface TopVideosTableProps {
  data: PlatformTopVideo[];
  loading?: boolean;
}

const TopVideosTable: React.FC<TopVideosTableProps> = ({ data, loading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ p: 10, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={32} />
        </Box>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                Content
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                Yield
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.disabled">
                    No recordings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((video) => (
                <TableRow
                  key={video.video_id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: alpha(theme.palette.divider, 0.5),
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={video.thumbnail_url}
                        variant="rounded"
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "8px",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap fontWeight={700}>
                          {video.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: "block" }}
                        >
                          {(video.view_count ?? 0).toLocaleString()} sessions
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: alpha(theme.palette.divider, 0.5),
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      color="primary.main"
                    >
                      $
                      {(video.revenue ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default TopVideosTable;
