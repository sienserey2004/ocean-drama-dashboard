import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { PlatformRevenueTrend } from '@/types';

interface RevenueChartProps {
  data: PlatformRevenueTrend[];
  loading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card elevation={0} sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
        <CircularProgress />
      </Card>
    );
  }

  const months   = data.map(d => d.month);
  const revenues = data.map(d => d.revenue);

  return (
    <Card elevation={0} sx={{ height: 400, borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Revenue Performance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Monthly revenue analysis and trending
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {data.length > 0 ? (
            <LineChart
              xAxis={[{ data: months, scaleType: 'band' }]}
              series={[
                {
                  data: revenues,
                  label: 'Revenue ($)',
                  color: '#6366f1', // Modern Indigo
                  area: true,
                },
              ]}
              height={300}
              margin={{ left: 60, right: 30, top: 20, bottom: 40 }}
              sx={{
                '.MuiLineElement-root': {
                  strokeWidth: 3,
                },
                '.MuiAreaElement-root': {
                  fillOpacity: 0.1,
                }
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary" variant="body2">No data recorded for this period</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
