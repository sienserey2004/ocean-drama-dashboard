
import { Check, Crown, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Box, Typography, Stack, Button, Paper, useTheme, useMediaQuery } from "@mui/material";
import { formatBenefitKey } from "../utils/subscription";
import { SubscriptionPlan as ISubscriptionPlan } from "@/app/types";
// Mobile-optimized Plan Card Component
const PlanCard = ({ 
  plan, 
  index, 
  isHovered, 
  onHover, 
  onSubscribe,
  isActive
}: { 
  plan: ISubscriptionPlan; 
  index: number; 
  isHovered: boolean; 
  onHover: (id: number | null) => void; 
  onSubscribe: (id: number) => void;
  isActive?: boolean;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isFeatured = plan.name.toLowerCase().includes('yearly');

  return (
    <Paper
      onMouseEnter={() => !isMobile && onHover(plan.planId)}
      onMouseLeave={() => !isMobile && onHover(null)}
      onTouchStart={() => isMobile && onHover(plan.planId)}
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        height: '100%',
        borderRadius: { xs: '24px', md: '40px' },
        position: 'relative',
        overflow: 'hidden',
        bgcolor: isHovered 
          ? 'rgba(255, 255, 255, 0.04)' 
          : 'rgba(255, 255, 255, 0.02)',
        border: '1px solid',
        borderColor: isHovered 
          ? 'rgba(255, 255, 255, 0.15)' 
          : (isFeatured ? 'rgba(229, 9, 20, 0.3)' : 'rgba(255, 255, 255, 0.05)'),
        transition: isMobile ? 'none' : 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: (!isMobile && isHovered) ? 'translateY(-10px) scale(1.02)' : 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {isFeatured && (
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: -28, 
          bgcolor: '#E50914', 
          color: 'white',
          px: { xs: 4, md: 6 },
          py: 0.75,
          transform: 'rotate(45deg)',
          fontSize: { xs: '0.65rem', md: '0.7rem' },
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          whiteSpace: 'nowrap'
        }}>
          Best Value
        </Box>
      )}

      <Stack spacing={{ xs: 3, md: 4 }} sx={{ flex: 1 }}>
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <Box sx={{ 
              p: { xs: 1, md: 1.5 }, 
              borderRadius: '16px', 
              bgcolor: isFeatured ? 'rgba(229, 9, 20, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: isFeatured ? '#E50914' : 'white'
            }}>
              {index === 0 ? <Zap size={isMobile ? 20 : 24} /> : index === 1 ? <ShieldCheck size={isMobile ? 20 : 24} /> : <Crown size={isMobile ? 20 : 24} />}
            </Box>
            <Typography variant="h6" fontWeight={800}>{plan.name}</Typography>
          </Stack>
          <Typography variant="caption" color="white/40">
            {plan.durationDays} Days • Full Access
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h3" fontWeight={900}>${plan.price}</Typography>
          <Typography variant="subtitle2" color="white/30" fontWeight={600}>/{plan.currency}</Typography>
        </Box>

        <Stack spacing={2}>
          {plan.benefits.slice(0, isMobile ? 4 : undefined).map((benefit) => (
            <Stack direction="row" spacing={2} key={benefit.benefitId} alignItems="flex-start">
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                bgcolor: 'rgba(34, 197, 94, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25
              }}>
                <Check size={12} className="text-emerald-500" strokeWidth={3} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'white/80', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                {formatBenefitKey(benefit.benefitKey)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Button
        onClick={() => onSubscribe(plan.planId)}
        variant={isActive ? "outlined" : "contained"}
        fullWidth
        disabled={isActive}
        endIcon={isActive ? <Check size={18} /> : <ArrowRight size={18} />}
        sx={{
          mt: { xs: 4, md: 6 },
          py: { xs: 2, md: 2.5 },
          borderRadius: '20px',
          fontWeight: 800,
          textTransform: 'none',
          fontSize: { xs: '0.9rem', md: '1rem' },
          bgcolor: isActive ? 'transparent' : (isFeatured ? '#E50914' : 'white'),
          color: isActive ? '#22C55E' : (isFeatured ? 'white' : 'black'),
          borderColor: isActive ? '#22C55E' : 'transparent',
          boxShadow: (!isActive && isFeatured) ? '0 10px 20px rgba(229, 9, 20, 0.2)' : 'none',
          '&:active': {
            transform: isActive ? 'none' : 'scale(0.98)'
          },
          '&:hover': {
            bgcolor: isActive ? 'transparent' : (isFeatured ? '#B20710' : 'rgba(255, 255, 255, 0.9)'),
            transform: (isActive || isMobile) ? 'none' : 'scale(1.02)',
            borderColor: isActive ? '#22C55E' : 'transparent',
          },
          '&.Mui-disabled': {
            color: '#22C55E',
            borderColor: '#22C55E',
            opacity: 1
          }
        }}
      >
        {isActive ? "Current Plan" : "Select Plan"}
      </Button>
    </Paper>
  );
};

export default PlanCard;
