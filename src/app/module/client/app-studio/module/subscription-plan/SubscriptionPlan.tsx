import React, { useEffect, useState } from "react";
import { 
  Check, 
  ShieldCheck, 
  Sparkles,
  Monitor,
  Heart,
  ChevronLeft,
  X,
  RefreshCw,
  Smartphone
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
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  Fade,
  Avatar,
  Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { subscriptionApi } from "@/app/api/subscription.service";
import { SubscriptionPlan as ISubscriptionPlan } from "@/app/types";
import toast from "react-hot-toast";
import { useSubscriptionStore } from "@/app/stores/subscriptionStore";
import PlanCard from "./components/PlanCard";
import PaymentModal from "./components/PaymentModal";

const SubscriptionPlan: React.FC = () => {
  const { subscription } = useSubscriptionStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    qrCode: string | null;
    transactionId: string | null;
    amount: string;
    planName: string;
    status: 'pending' | 'success' | 'expired';
    expiresAt: Date | null;
  }>({
    open: false,
    qrCode: null,
    transactionId: null,
    amount: '',
    planName: '',
    status: 'pending',
    expiresAt: null
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    if (paymentModal.open && paymentModal.status === 'pending' && paymentModal.transactionId) {
      // 1. Check expiration timer
      timer = setInterval(() => {
        if (paymentModal.expiresAt) {
          const now = new Date();
          const diff = paymentModal.expiresAt.getTime() - now.getTime();
          if (diff <= 0) {
            setPaymentModal(prev => ({ ...prev, status: 'expired' }));
            setTimeLeft(0);
            clearInterval(timer);
            clearInterval(interval);
          } else {
            setTimeLeft(Math.floor(diff / 1000));
          }
        }
      }, 1000);

      // 2. Start polling for payment status
      interval = setInterval(async () => {
        try {
          const res = await subscriptionApi.verify(paymentModal.transactionId!);
          if (res.status === 'completed') {
            setPaymentModal(prev => ({ ...prev, status: 'success' }));
            toast.success("Subscription activated!", { id: 'payment-status' });
            clearInterval(interval);
            clearInterval(timer);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
        // verify pull my subscription
      }, 6000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timer) clearInterval(timer);
    };
  }, [paymentModal.open, paymentModal.status, paymentModal.transactionId, paymentModal.expiresAt]);

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
    const plan = plans.find(p => p.planId === planId);
    if (!plan) return;

    try {
      toast.loading("Initiating Bakong payment...", { id: 'subscribe' });
      
      const res = await subscriptionApi.subscribe(planId, 'bakong');
      
      setPaymentModal({
        open: true,
        qrCode: res.qr_code,
        transactionId: res.transaction_id,
        amount: plan.price.toString(),
        planName: plan.name,
        status: 'pending',
        expiresAt: new Date(res.expires_at)
      });

      toast.success("QR Code generated", { id: 'subscribe' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Subscription process failed", { id: 'subscribe' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2,
        background: '#08090C'
      }}>
        <CircularProgress color="error" thickness={4} size={40} />
        <Typography variant="body2" color="white/40">Loading premium plans...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#08090C', 
      color: 'white',
      pb: { xs: 6, md: 8 }
    }}>
      {/* Simplified Background Effects for Mobile */}
      <Box sx={{ 
        position: 'fixed', 
        inset: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none',
        display: { xs: 'none', md: 'block' }
      }}>
        <Box sx={{ 
          position: 'absolute', 
          top: '-10%', 
          left: '-10%', 
          width: '40%', 
          height: '40%', 
          bgcolor: 'rgba(229, 9, 20, 0.1)', 
          filter: 'blur(120px)', 
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        <Box sx={{ 
          position: 'absolute', 
          bottom: '-10%', 
          right: '-10%', 
          width: '40%', 
          height: '40%', 
          bgcolor: 'rgba(255, 100, 0, 0.1)', 
          filter: 'blur(120px)', 
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite 2s'
        }} />
      </Box>

      <Container maxWidth="lg" sx={{ 
        position: 'relative', 
        zIndex: 1,
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        {/* Header Section */}
        <Box sx={{ py: { xs: 3, md: 8 } }}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              color: 'rgba(255,255,255,0.4)', 
              mb: { xs: 2, md: 4 },
              p: { xs: 1, md: 1.5 },
              '&:active': { bgcolor: 'rgba(255,255,255,0.1)' },
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            <ChevronLeft size={isMobile ? 20 : 24} />
          </IconButton>

          <Stack spacing={{ xs: 1.5, md: 3 }} alignItems="center" textAlign="center">
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 1, 
              px: 2, 
              py: 0.75, 
              borderRadius: '100px', 
              bgcolor: 'rgba(229, 9, 20, 0.1)',
              border: '1px solid rgba(229, 9, 20, 0.2)'
            }}>
              <Sparkles size={14} className="text-red-500" />
              <Typography variant="caption" sx={{ 
                fontWeight: 800, 
                color: '#E50914', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                fontSize: { xs: '0.7rem', md: '0.75rem' }
              }}>
                Premium Membership
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ 
              fontWeight: 900, 
              letterSpacing: '-1.5px',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              maxWidth: '800px'
            }}>
              {subscription?.status === 'active' 
                ? "You're a Premium Member" 
                : (isMobile ? "Unlock Full Access" : "Unlock Full Creative Access")}
            </Typography>
            
            <Typography variant="body2" sx={{ 
              color: 'rgba(255,255,255,0.5)', 
              maxWidth: '500px',
              fontSize: { xs: '0.875rem', md: '1rem' },
              lineHeight: 1.6
            }}>
              {subscription?.status === 'active'
                ? `Your ${subscription.plan?.name} plan is currently active until ${new Date(subscription.endDate).toLocaleDateString()}.`
                : "Choose your perfect plan and start growing your creative career today"}
            </Typography>
          </Stack>
        </Box>

        {/* Pricing Grid */}
        <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              key={plan.planId}
              sx={{
                ...(isTablet && index === 2 && { sm: 'auto', width: '100%', maxWidth: '400px', mx: 'auto' })
              }}
            >
              <PlanCard
                plan={plan}
                index={index}
                isHovered={hoveredPlan === plan.planId}
                onHover={setHoveredPlan}
                onSubscribe={handleSubscribe}
                isActive={subscription?.planId === plan.planId}
              />
            </Grid>
          ))}
        </Grid>

        {/* Trust Section - Simplified for Mobile */}
        <Box sx={{ 
          mt: { xs: 6, md: 10 }, 
          pt: { xs: 6, md: 10 }, 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)' 
        }}>
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {[
              { icon: <Monitor size={isMobile ? 24 : 28} />, title: "Cross-Platform", desc: "Access on web, mobile & tablet" },
              { icon: <ShieldCheck size={isMobile ? 24 : 28} />, title: "Secure Payments", desc: "Bank-grade encryption" },
              { icon: <Heart size={isMobile ? 24 : 28} />, title: "Priority Support", desc: "24/7 dedicated team" }
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Stack spacing={{ xs: 1.5, md: 2 }} alignItems="center" textAlign="center">
                  <Box sx={{ 
                    color: '#E50914',
                    p: 1.5,
                    borderRadius: '16px',
                    bgcolor: 'rgba(229, 9, 20, 0.1)'
                  }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="white/40" sx={{ display: 'block' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      <PaymentModal 
        open={paymentModal.open}
        onClose={() => {
          if (paymentModal.status === 'success') {
            navigate('/app-studio'); // Redirect after success
          }
          setPaymentModal(prev => ({ ...prev, open: false }));
        }}
        qrCode={paymentModal.qrCode}
        amount={paymentModal.amount}
        planName={paymentModal.planName}
        status={paymentModal.status}
        timeLeft={timeLeft}
      />

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}
      </style>
    </Box>
  );
};

export default SubscriptionPlan;