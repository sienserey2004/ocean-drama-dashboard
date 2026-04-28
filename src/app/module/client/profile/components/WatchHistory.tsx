import React from 'react';
import { Box, Typography, Stack, LinearProgress } from '@mui/material';
import { ChevronRight, History, CheckCircle, PlayCircleOutline } from '@mui/icons-material';

interface WatchHistoryProps {
    isMobile: boolean;
    history: any[];
    loading: boolean;
}

const WatchHistory: React.FC<WatchHistoryProps> = ({ isMobile, history, loading }) => {
    return (
        <Box className={`${isMobile ? 'px-6' : ''} mb-10`}>
            <Box className="flex justify-between items-center mb-6">
                <Typography className="text-white text-lg font-black italic uppercase tracking-tighter">
                    Recently Watched
                </Typography>
                <Typography className="text-[#FF2D2D] text-xs font-bold cursor-pointer hover:underline items-center flex gap-1">
                    View All <ChevronRight sx={{ fontSize: 14 }} />
                </Typography>
            </Box>
            
            {loading && history.length === 0 ? (
                <LoadingState />
            ) : history.length === 0 ? (
                <EmptyState />
            ) : (
                <HistoryList history={history} />
            )}
        </Box>
    );
};

const LoadingState: React.FC = () => (
    <Box className="flex justify-center p-10">
        <LinearProgress sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#FF2D2D' } }} />
    </Box>
);

const EmptyState: React.FC = () => (
    <Box className="bg-[#1A1A22]/50 border border-dashed border-[#2A2A35] rounded-3xl p-10 flex flex-col items-center justify-center text-center opacity-50">
        <History sx={{ fontSize: 40, mb: 2, color: '#A1A1AA' }} />
        <Typography className="text-sm font-bold">No watch history yet</Typography>
        <Typography className="text-[10px]">Your recently watched dramas will appear here</Typography>
    </Box>
);

const HistoryList: React.FC<{ history: any[] }> = ({ history }) => (
    <Stack direction="row" spacing={3} className="overflow-x-auto pb-6 no-scrollbar">
        {history.map((item, idx) => (
            <HistoryItem key={idx} item={item} />
        ))}
    </Stack>
);

const HistoryItem: React.FC<{ item: any }> = ({ item }) => (
    <Box className="flex-shrink-0 w-[160px] group cursor-pointer">
        <Box className="relative w-[160px] h-[240px] rounded-2xl overflow-hidden border border-[#2A2A35] group-hover:border-[#FF2D2D] group-hover:scale-[1.02] transition-all duration-300 shadow-xl group-hover:shadow-[0_0_20px_rgba(255,45,45,0.2)]">
            <Box component="img" src={item.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            <Box className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
            
            <Box className="absolute bottom-3 left-3 right-3">
                <Box className="flex justify-between items-center mb-1">
                    <Typography sx={{ fontSize: '8px', fontWeight: 900, color: 'white', opacity: 0.8 }}>
                        EP {item.episode_number}
                    </Typography>
                    {item.completed && <CheckCircle sx={{ fontSize: 10, color: '#22C55E' }} />}
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={item.completed ? 100 : Math.min(100, item.watch_duration)}
                    sx={{
                        height: 4,
                        borderRadius: 99,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#FF2D2D' }
                    }}
                />
            </Box>

            <Box className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                <Box className="bg-[#FF2D2D] p-3 rounded-full shadow-[0_0_20px_rgba(255,45,45,0.8)]">
                    <PlayCircleOutline sx={{ color: 'white', fontSize: 32 }} />
                </Box>
            </Box>
        </Box>
        <Typography className="text-[11px] font-black text-white mt-3 group-hover:text-[#FF2D2D] truncate tracking-tight uppercase italic">
            {item.video_title}
        </Typography>
    </Box>
);

export default WatchHistory;