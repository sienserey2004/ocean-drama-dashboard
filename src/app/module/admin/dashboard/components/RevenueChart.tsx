import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PlatformRevenueTrend } from "@/app/types";

interface RevenueChartProps {
  data: PlatformRevenueTrend[];
  loading: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const azure = "#0EA5E9";

  if (loading) {
    return (
      <Box
        sx={{
          height: 350,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={40} thickness={5} sx={{ color: azure }} />
      </Box>
    );
  }

  const months = data.map((d) => d.month);
  const revenues = data.map((d) => d.revenue);

  return (
    <Box sx={{ height: 350, width: "100%" }}>
      {data.length > 0 ? (
        <LineChart
          xAxis={[
            {
              data: months,
              scaleType: "band",
              disableTicks: true,
              stroke: alpha(theme.palette.divider, 0.5),
            },
          ]}
          yAxis={[
            {
              disableTicks: true,
              stroke: alpha(theme.palette.divider, 0.5),
              valueFormatter: (value) => `$${value}`,
            },
          ]}
          series={[
            {
              data: revenues,
              label: "Revenue Status ($)",
              color: azure,
              area: true,
              showMark: true,
            },
          ]}
          height={300}
          margin={{ left: 60, right: 30, top: 20, bottom: 40 }}
          sx={{
            ".MuiLineElement-root": {
              strokeWidth: 4,
            },
            ".MuiAreaElement-root": {
              fill: `url(#revenueGradient-${isDark ? 'dark' : 'light'})`,
              fillOpacity: 0.2,
            },
            ".MuiChartsAxis-tickLabel": {
              fill: theme.palette.text.secondary,
              fontWeight: 700,
              fontSize: 11,
            },
            ".MuiChartsAxis-line": {
              stroke: alpha(theme.palette.divider, 0.2)
            }
          }}
        >
          <defs>
            <linearGradient id={`revenueGradient-${isDark ? 'dark' : 'light'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={azure} stopOpacity={0.6} />
              <stop offset="95%" stopColor={azure} stopOpacity={0} />
            </linearGradient>
          </defs>
        </LineChart>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#000000", 0.02),
            borderRadius: '20px',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography color="text.secondary" variant="body2" fontWeight={700}>
             Metric synchronization pending
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RevenueChart;
