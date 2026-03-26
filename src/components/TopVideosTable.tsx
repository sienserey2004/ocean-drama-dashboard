import React from 'react';
import {
  Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Tooltip
} from '@mui/material';
import { PlayArrow, TrendingUp } from '@mui/icons-material';
import { PlatformTopVideo } from '@/types';

interface TopVideosTableProps {
  data: PlatformTopVideo[];
  loading?: boolean;
}

const TopVideosTable: React.FC<TopVideosTableProps> = ({ data, loading }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Top Performing Videos
          </Typography>
          <TrendingUp color="primary" sx={{ fontSize: 24 }} />
        </Box>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Video Title</TableCell>
                <TableCell align="right">Views</TableCell>
                <TableCell align="right">Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    No videos found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((video) => (
                  <TableRow key={video.video_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 28, height: 28, fontSize: '0.75rem' }}>
                          <PlayArrow sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Tooltip title={video.title}>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                            {video.title}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{video.views.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`$${video.revenue.toFixed(2)}`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TopVideosTable;
