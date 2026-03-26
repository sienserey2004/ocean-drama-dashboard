import React from 'react';
import {
  Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Tooltip,
  CircularProgress
} from '@mui/material';
import { PlayArrow, TrendingUp } from '@mui/icons-material';
import { PlatformTopVideo } from '@/types';

interface TopVideosTableProps {
  data: PlatformTopVideo[];
  loading?: boolean;
}

const TopVideosTable: React.FC<TopVideosTableProps> = ({ data, loading }) => {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Top Performing
            </Typography>
            <Typography variant="caption" color="text.secondary">
              By views and revenue
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40, borderRadius: '12px' }}>
            <TrendingUp fontSize="small" />
          </Avatar>
        </Box>

        <TableContainer sx={{ border: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', py: 1.5 }}>Video Series</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Views</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Earnings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.disabled">No recordings found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((video) => (
                  <TableRow key={video.video_id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.2s' }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar variant="rounded" sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 32, height: 32, borderRadius: '8px' }}>
                          <PlayArrow sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Tooltip title={video.title}>
                          <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 160 }} noWrap>
                            {video.title}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>{video.views.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`$${video.revenue.toFixed(2)}`}
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          bgcolor: 'success.light', 
                          color: 'success.dark',
                          borderRadius: '8px'
                        }}
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
