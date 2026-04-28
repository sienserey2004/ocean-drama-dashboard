import { useTheme, useMediaQuery, Dialog, Fade, IconButton, DialogContent, Stack, Typography, CircularProgress, Avatar, Divider, Button, Box } from "@mui/material";
import { X, RefreshCw, Check, Smartphone } from "lucide-react";

// Premium Payment Modal Component
const PaymentModal = ({ 
  open, 
  onClose, 
  qrCode, 
  amount, 
  planName,
  status,
  timeLeft 
}: { 
  open: boolean; 
  onClose: () => void; 
  qrCode: string | null;
  amount: string;
  planName: string;
  status: 'pending' | 'success' | 'expired';
  timeLeft: number;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      TransitionComponent={Fade}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#12141C',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundImage: 'none',
          position: 'relative',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <IconButton onClick={onClose} sx={{ color: 'white/40', '&:hover': { color: 'white' } }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 4, md: 5 } }}>
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Header */}
          <Box>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              {status === 'success' ? 'Payment Successful' : 'Scan to Pay'}
            </Typography>
            <Typography variant="body2" color="white/50">
              {planName} • ${amount}
            </Typography>
          </Box>

          {/* QR Container */}
          <Box sx={{ 
            position: 'relative',
            p: 2,
            bgcolor: 'white',
            borderRadius: '24px',
            width: '240px',
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            {qrCode && status !== 'expired' ? (
              <img 
                src={qrCode} 
                alt="Bakong KHQR" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  filter: (status === 'success') ? 'blur(4px) grayscale(100%)' : 'none',
                  opacity: (status === 'success') ? 0.3 : 1
                }} 
              />
            ) : status === 'expired' ? (
              <Stack alignItems="center" spacing={1} sx={{ color: '#E50914' }}>
                <RefreshCw size={40} />
                <Typography variant="caption" fontWeight={800}>Expired</Typography>
              </Stack>
            ) : (
              <CircularProgress color="error" />
            )}

            {status === 'success' && (
              <Fade in={true}>
                <Box sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Avatar sx={{ bgcolor: '#22C55E', width: 64, height: 64 }}>
                    <Check size={32} strokeWidth={3} />
                  </Avatar>
                </Box>
              </Fade>
            )}
          </Box>

          {/* Status Info */}
          <Stack spacing={2} width="100%">
            {status === 'pending' && (
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ color: '#E50914' }}>
                <RefreshCw size={16} className="animate-spin" />
                <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Typography>
              </Stack>
            )}

            {status === 'expired' && (
              <Typography variant="caption" color="error" fontWeight={700}>
                This QR code has expired. Please try again.
              </Typography>
            )}

            <Divider sx={{ borderColor: 'white/5' }} />

            <Stack direction="row" spacing={2} sx={{ textAlign: 'left' }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)', color: 'white/60' }}>
                <Smartphone size={20} />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} display="block">
                  How to pay?
                </Typography>
                <Typography variant="caption" color="white/40">
                  Open your bank app and scan the KHQR code to complete subscription
                </Typography>
              </Box>
            </Stack>
          </Stack>

          {status === 'success' && (
            <Button 
              fullWidth 
              variant="contained" 
              onClick={onClose}
              sx={{ 
                bgcolor: '#22C55E', 
                color: 'white', 
                borderRadius: '16px',
                py: 1.5,
                fontWeight: 800,
                '&:hover': { bgcolor: '#16A34A' }
              }}
            >
              Get Started
            </Button>
          )}

          {status === 'expired' && (
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={onClose}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                borderRadius: '16px',
                py: 1.5,
                fontWeight: 800,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'white/20' }
              }}
            >
              Close & Retry
            </Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
