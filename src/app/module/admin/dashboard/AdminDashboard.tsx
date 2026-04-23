import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
  Chip
} from "@mui/material";
import {
  People,
  Slideshow,
  ShoppingCart,
  AttachMoney,
  Refresh,
  TrendingUp,
  FilterList,
  Radar,
  AutoGraph,
  Sensors
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { adminAnalyticsApi } from "@/app/api/adminAnalytics.service";
import {
  PlatformOverview,
  PlatformRevenueTrend,
  PlatformTopVideo,
} from "@/app/types";
import OverviewCard from "./components/OverviewCard";
import RevenueChart from "./components/RevenueChart";
import TopVideosTable from "./components/TopVideosTable";
import ProcessingQueue from "./components/ProcessingQueue";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [revenue, setRevenue] = useState<PlatformRevenueTrend[]>([]);
  const [topVideos, setTopVideos] = useState<PlatformTopVideo[]>([]);

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const azure = "#0EA5E9";

  // Filters
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    revenuePeriod: "year",
    videoSort: "revenue" as "views" | "revenue",
    videoLimit: 5,
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovData, revData, vidData] = await Promise.all([
        adminAnalyticsApi.getOverview({ from: filters.from, to: filters.to }),
        adminAnalyticsApi.getRevenue({ period: filters.revenuePeriod }),
        adminAnalyticsApi.getTopVideos({
          sort: filters.videoSort,
          limit: filters.videoLimit,
        }),
      ]);
      setOverview(ovData);
      setRevenue(revData.data || []);
      setTopVideos(vidData.data || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formattedRevenue = (val?: number) =>
    val !== undefined
      ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$0.00";

  return (
    <Box>
      {/* Platform Header Section */}
      <Box
        sx={{
          mb: 6,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { md: "center" },
          gap: 3,
        }}
      >
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
             <Chip 
               icon={<Radar sx={{ fontSize: '14px !important' }} />} 
               label="Operational" 
               size="small" 
               sx={{ 
                 bgcolor: alpha(azure, 0.1), 
                 color: azure, 
                 fontWeight: 900, 
                 borderRadius: '8px',
                 px: 0.5
               }} 
             />
             <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                System ID: OD-HUB-01
             </Typography>
          </Stack>
          <Typography
            variant="h3"
            sx={{ fontWeight: 900, letterSpacing: "-2px", color: 'text.primary' }}
          >
            Control Center
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            display: "flex",
            gap: 2,
            alignItems: "center",
            bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#FFFFFF", 0.8),
            backdropFilter: 'blur(10px)',
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              label="Sync Date From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: '0.8rem' }, width: 160 }}
            />
            <TextField
              size="small"
              label="Sync Date To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: '0.8rem' }, width: 160 }}
            />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton
            sx={{ bgcolor: azure, color: "white", borderRadius: "10px", "&:hover": { bgcolor: alpha(azure, 0.8) } }}
            onClick={loadAllData}
            disabled={loading}
          >
            <Refresh className={loading ? "animate-spin" : ""} sx={{ fontSize: 20 }} />
          </IconButton>
        </Paper>
      </Box>

      {/* KPI Overlays */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Entity Count (Users)"
            value={(overview?.total_users ?? 0).toLocaleString()}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Media Volume"
            value={(overview?.total_videos ?? 0).toLocaleString()}
            icon={<Slideshow />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Transaction Yield"
            value={(overview?.total_purchases ?? 0).toLocaleString()}
            icon={<ShoppingCart />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Equity Value"
            value={formattedRevenue(overview?.total_revenue)}
            icon={<AttachMoney />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Primary Intelligence Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: "28px",
              bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#FFFFFF", 0.4),
              border: "1px solid",
              borderColor: "divider",
              height: '100%'
            }}
          >
            <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                 <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>Revenue Performance</Typography>
                 <Typography variant="caption" color="text.secondary" fontWeight={600}>Financial Time-series Analysis</Typography>
              </Box>
              <FormControl size="small" sx={{ width: 150 }}>
                <Select
                  value={filters.revenuePeriod}
                  onChange={(e) => handleFilterChange("revenuePeriod", e.target.value)}
                  sx={{ borderRadius: "12px", bgcolor: isDark ? alpha("#FFFFFF", 0.05) : "white", fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <MenuItem value="year">Annual View</MenuItem>
                  <MenuItem value="month">Monthly View</MenuItem>
                  <MenuItem value="week">Weekly View</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <RevenueChart data={revenue} loading={loading} />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: "28px",
              bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#FFFFFF", 0.4),
              border: "1px solid",
              borderColor: "divider",
              height: '100%'
            }}
          >
            <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>Top Assets</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Engagement Ranking</Typography>
              </Box>
              <IconButton
                sx={{ bgcolor: "action.hover", borderRadius: "10px" }}
                onClick={() => handleFilterChange("videoSort", filters.videoSort === "views" ? "revenue" : "views")}
              >
                <FilterList sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
            <TopVideosTable data={topVideos} loading={loading} />
          </Paper>
        </Grid>
      </Grid>

      {/* System Operations Area */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Sensors sx={{ color: azure }} /> Operational Pipeline
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={7}>
            <ProcessingQueue />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: "28px",
                bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#FFFFFF", 0.4),
                border: "1px solid",
                borderColor: "divider",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ zIndex: 1 }}>
                 <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Resource Allocation</Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                    Global system resource monitoring and distribution.
                 </Typography>
                 
                 <Stack spacing={3}>
                    {[
                      { label: 'Cloud Storage', val: 74, color: azure },
                      { label: 'Compute Power', val: 32, color: '#F59E0B' },
                      { label: 'Bandwidth', val: 58, color: '#10B981' }
                    ].map(res => (
                      <Box key={res.label}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" fontWeight={800}>{res.label}</Typography>
                            <Typography variant="caption" fontWeight={900} color={res.color}>{res.val}%</Typography>
                         </Box>
                         <Box sx={{ width: '100%', height: 6, bgcolor: alpha(res.color, 0.1), borderRadius: 3 }}>
                            <Box sx={{ width: `${res.val}%`, height: '100%', bgcolor: res.color, borderRadius: 3, boxShadow: `0 0 10px ${res.color}` }} />
                         </Box>
                      </Box>
                    ))}
                 </Stack>
              </Box>
              
              <AutoGraph sx={{ position: 'absolute', bottom: -20, right: -20, fontSize: 160, color: alpha(azure, 0.05) }} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
