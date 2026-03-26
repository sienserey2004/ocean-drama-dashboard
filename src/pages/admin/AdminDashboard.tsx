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
    <Box>
      {/* Header & Main Filters */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-start' }, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1px' }}>
            System Analytics
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Real-time insights and monitoring for the platform
          </Typography>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: 1.5, 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            bgcolor: 'background.paper', 
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)'
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <TextField
              size="small"
              label="Starting"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <TextField
              size="small"
              label="Ending"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, my: 0.5 }} />
          <Tooltip title="Force Refresh">
            <IconButton 
              sx={{ bgcolor: 'action.hover', borderRadius: '10px' }} 
              onClick={loadAllData} 
              disabled={loading}
              color="primary"
            >
              <Refresh className={loading ? 'animate-spin' : ''} sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Registered Users"
            value={(overview?.total_users ?? 0).toLocaleString()}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Video Content"
            value={(overview?.total_videos ?? 0).toLocaleString()}
            icon={<Slideshow />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Total Sales"
            value={(overview?.total_purchases ?? 0).toLocaleString()}
            icon={<ShoppingCart />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OverviewCard
            title="Est. Revenue"
            value={formattedRevenue(overview?.total_revenue)}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Row */}
      <Grid container spacing={4}>
        {/* Revenue Chart Section */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Revenue Growth</Typography>
            <FormControl size="small" sx={{ width: 140 }}>
              <Select
                value={filters.revenuePeriod}
                onChange={(e) => handleFilterChange('revenuePeriod', e.target.value)}
                sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
              >
                <MenuItem value="year">Past Year</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <RevenueChart data={revenue} loading={loading} />
        </Grid>

        {/* Top Videos Table Section */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Best Performance</Typography>
            <IconButton
              sx={{ bgcolor: 'action.hover', borderRadius: '10px' }}
              onClick={() => handleFilterChange('videoSort', filters.videoSort === 'views' ? 'revenue' : 'views')}
            >
              <FilterList sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          <TopVideosTable data={topVideos} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
}
