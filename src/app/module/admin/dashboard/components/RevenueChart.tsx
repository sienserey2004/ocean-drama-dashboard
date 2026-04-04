import React from "react";
import {
  Card,
  CardContent,
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
        <Box
          sx={{
            height: 350,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      </Card>
    );
  }

  const months = data.map((d) => d.month);
  const revenues = data.map((d) => d.revenue);

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
      <CardContent sx={{ p: 3 }}>
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
                  label: "Revenue ($)",
                  color: theme.palette.primary.main,
                  area: true,
                  showMark: true,
                },
              ]}
              height={300}
              margin={{ left: 60, right: 30, top: 20, bottom: 40 }}
              sx={{
                ".MuiLineElement-root": {
                  strokeWidth: 3,
                },
                ".MuiAreaElement-root": {
                  fill: `url(#colorRevenue-${theme.palette.mode})`,
                  fillOpacity: 0.15,
                },
                ".MuiChartsAxis-label": {
                  fill: theme.palette.text.secondary,
                  fontWeight: 600,
                },
                ".MuiChartsAxis-tickLabel": {
                  fill: theme.palette.text.secondary,
                  fontWeight: 600,
                  fontSize: 12,
                },
              }}
            >
              <defs>
                <linearGradient
                  id={`colorRevenue-${theme.palette.mode}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0}
                  />
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
              }}
            >
              <Typography color="text.secondary" variant="body2">
                No data recorded for this period
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
