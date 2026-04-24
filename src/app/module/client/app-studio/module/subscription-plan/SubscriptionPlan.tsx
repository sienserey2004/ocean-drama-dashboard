import React, { useEffect, useState } from "react";
import { 
  Check, 
  Crown, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Play,
  Monitor,
  Heart,
  ChevronLeft
} from "lucide-react";
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  CircularProgress, 
  IconButton,
  Container,
  Grid,
  Paper,
  alpha
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { subscriptionApi } from "@/app/api/subscription.service";
import { SubscriptionPlan as ISubscriptionPlan } from "@/app/types";
import toast from "react-hot-toast";

const SubscriptionPlan: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await subscriptionApi.getPlans();
        setPlans(data);
      } catch (error) {
        toast.error("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: number) => {
    try {
      toast.loading("Processing your request...", { id: 'subscribe' });
      // In a real app, this would redirect to a payment gateway or open a modal
      // For now, we'll just simulate a success
      toast.success("Redirecting to secure payment...", { id: 'subscribe' });
      // navigate(`/checkout/${planId}`);
    } catch (error) {
      toast.error("Subscription process failed", { id: 'subscribe' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#08090C'
      }}>
        <CircularProgress color="error" thickness={5} />
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-white selection:bg-red-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Stack spacing={2} alignItems="center" mb={10} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              alignSelf: 'flex-start', 
              color: 'white/40', 
              mb: 4,
              '&:hover': { color: 'white', bgcolor: 'white/5' } 
            }}
          >
            <ChevronLeft size={24} />
          </IconButton>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            px: 3, 
            py: 1, 
            borderRadius: '100px', 
            bgcolor: 'rgba(229, 9, 20, 0.1)',
            border: '1px solid rgba(229, 9, 20, 0.2)',
            mb: 2
          }}>
            <Sparkles size={16} className="text-red-500" />
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'red-500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Premium Membership
            </Typography>
          </Box>

          <Typography variant="h2" sx={{ 
            fontWeight: 900, 
            textAlign: 'center',
            letterSpacing: '-2px',
            fontSize: { xs: '2.5rem', md: '4rem' },
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF66 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Unlock Full Access
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'white/50', 
            textAlign: 'center', 
            maxWidth: '600px',
            fontSize: '1.1rem',
            lineHeight: 1.6
          }}>
            Choose the perfect plan to boost your creative career. Start posting, earning, and growing your audience today.
          </Typography>
        </Stack>

        {/* Pricing Grid */}
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan, index) => {
            const isFeatured = plan.name.toLowerCase().includes('yearly');
            const isHovered = hoveredPlan === plan.planId;

            return (
              <Grid item xs={12} md={4} key={plan.planId}>
                <Paper
                  onMouseEnter={() => setHoveredPlan(plan.planId)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  elevation={0}
                  sx={{
                    p: 5,
                    height: '100%',
                    borderRadius: '40px',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: isHovered 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : (isFeatured ? 'rgba(229, 9, 20, 0.3)' : 'rgba(255, 255, 255, 0.05)'),
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isHovered ? 'translateY(-10px) scale(1.02)' : 'none',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Featured Badge */}
                  {isFeatured && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 24, 
                      right: -32, 
                      bgcolor: '#E50914', 
                      color: 'white',
                      px: 6,
                      py: 0.5,
                      transform: 'rotate(45deg)',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Best Value
                    </Box>
                  )}

                  <Stack spacing={4} sx={{ flex: 1 }}>
                    <Box>
                      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: '16px', 
                          bgcolor: isFeatured ? 'rgba(229, 9, 20, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: isFeatured ? '#E50914' : 'white'
                        }}>
                          {index === 0 ? <Zap size={24} /> : index === 1 ? <ShieldCheck size={24} /> : <Crown size={24} />}
                        </Box>
                        <Typography variant="h5" fontWeight={800}>{plan.name}</Typography>
                      </Stack>
                      <Typography variant="body2" color="white/40">
                        {plan.durationDays} Days of full creative power
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h2" fontWeight={900}>${plan.price}</Typography>
                      <Typography variant="subtitle1" color="white/30" fontWeight={600}>/{plan.currency}</Typography>
                    </Box>

                    <Stack spacing={2.5}>
                      {plan.benefits.map((benefit) => (
                        <Stack direction="row" spacing={2} key={benefit.benefitId} alignItems="center">
                          <Box sx={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(34, 197, 94, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Check size={14} className="text-emerald-500" strokeWidth={3} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'white/80' }}>
                            {formatBenefitKey(benefit.benefitKey)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>

                  <Button
                    onClick={() => handleSubscribe(plan.planId)}
                    variant="contained"
                    fullWidth
                    endIcon={<ArrowRight size={18} />}
                    sx={{
                      mt: 6,
                      py: 2.5,
                      borderRadius: '20px',
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '1rem',
                      bgcolor: isFeatured ? '#E50914' : 'white',
                      color: isFeatured ? 'white' : 'black',
                      boxShadow: isFeatured ? '0 10px 30px rgba(229, 9, 20, 0.3)' : 'none',
                      '&:hover': {
                        bgcolor: isFeatured ? '#B20710' : 'rgba(255, 255, 255, 0.9)',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    Select Plan
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Bottom Trust Section */}
        <Box sx={{ mt: 10, pt: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Grid container spacing={6}>
            {[
              { icon: <Monitor size={28} />, title: "Cross-Platform Access", desc: "Enjoy your membership on web, mobile, and tablet devices." },
              { icon: <ShieldCheck size={28} />, title: "Secure Payments", desc: "Your data is protected with industry-standard encryption." },
              { icon: <Heart size={28} />, title: "Direct Support", desc: "Get priority support from our dedicated creative team." }
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Box sx={{ color: 'red-500' }}>{item.icon}</Box>
                  <Typography variant="h6" fontWeight={800}>{item.title}</Typography>
                  <Typography variant="body2" color="white/40" sx={{ lineHeight: 1.6 }}>{item.desc}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const formatBenefitKey = (key: string) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default SubscriptionPlan;
