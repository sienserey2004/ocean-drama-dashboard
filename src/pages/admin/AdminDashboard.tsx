import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Box, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Divider, Paper, Stack,
  IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
  People, Slideshow, ShoppingCart, AttachMoney, Refresh,
  TrendingDown, TrendingUp, FilterList
} from '@mui/icons-material';
import OverviewCard from '@/components/OverviewCard';
import RevenueChart from '@/components/RevenueChart';
import TopVideosTable from '@/components/TopVideosTable';
import { adminAnalyticsApi } from '@/api/adminAnalytics.service';
import { PlatformOverview, PlatformRevenueTrend, PlatformTopVideo } from '@/types';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading]     = useState(true);
  const [overview, setOverview]   = useState<PlatformOverview | null>(null);
  const [revenue, setRevenue]     = useState<PlatformRevenueTrend[]>([]);
  const [topVideos, setTopVideos] = useState<PlatformTopVideo[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    revenuePeriod: 'year',
    videoSort: 'revenue' as 'views' | 'revenue',
    videoLimit: 5,
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovData, revData, vidData] = await Promise.all([
        adminAnalyticsApi.getOverview({ from: filters.from, to: filters.to }),
        adminAnalyticsApi.getRevenue({ period: filters.revenuePeriod }),
        adminAnalyticsApi.getTopVideos({ sort: filters.videoSort, limit: filters.videoLimit }),
      ]);
      setOverview(ovData);
      setRevenue(revData.data || []);
      setTopVideos(vidData.data || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formattedRevenue = (val?: number) => val !== undefined ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header & Main Filters */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography color="text.secondary">
            Insights and platform analytics for your drama application
          </Typography>
        </Box>

        <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
            />
            <TextField
              size="small"
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Tooltip title="Refresh Data">
            <IconButton color="primary" onClick={loadAllData} disabled={loading}>
              <Refresh className={loading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Total Users"
            value={overview?.total_users ?? 0}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Drama Titles"
            value={overview?.total_videos ?? 0}
            icon={<Slideshow />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Purchases"
            value={overview?.total_purchases ?? 0}
            icon={<ShoppingCart />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Revenue"
            value={formattedRevenue(overview?.total_revenue)}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Row */}
      <Grid container spacing={3}>
        {/* Revenue Chart Section */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600}>Revenue Forecast & History</Typography>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>View By</InputLabel>
              <Select
                value={filters.revenuePeriod}
                label="View By"
                onChange={(e) => handleFilterChange('revenuePeriod', e.target.value)}
              >
                <MenuItem value="year">Full year</MenuItem>
                <MenuItem value="month">Current month</MenuItem>
                <MenuItem value="week">Current week</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <RevenueChart data={revenue} loading={loading} />
        </Grid>

        {/* Top Videos Table Section */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600}>Trending Series</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={`Sorted by ${filters.videoSort}`}>
                <IconButton
                  size="small"
                  onClick={() => handleFilterChange('videoSort', filters.videoSort === 'views' ? 'revenue' : 'views')}
                >
                  <FilterList fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <TopVideosTable data={topVideos} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
}
