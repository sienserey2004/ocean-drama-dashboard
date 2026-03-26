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
      <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  const months = data.map(d => d.month);
  const revenues = data.map(d => d.revenue);

  return (
    <Card sx={{ height: 400 }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Revenue Trends
        </Typography>
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {data.length > 0 ? (
            <LineChart
              xAxis={[{ data: months, scaleType: 'band' }]}
              series={[
                {
                  data: revenues,
                  label: 'Revenue ($)',
                  color: '#2196f3',
                  area: true,
                },
              ]}
              height={300}
              margin={{ left: 60, right: 30, top: 20, bottom: 40 }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">No data available for the selected period</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
