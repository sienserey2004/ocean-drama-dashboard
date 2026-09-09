import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Monitor,
  Heart,
  ChevronLeft,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subscriptionApi } from "@/app/api/subscription.service";
import { SubscriptionPlan as ISubscriptionPlan } from "@/app/types";
import toast from "@/app/utils/toast";
import { useSubscriptionStore } from "@/app/stores/subscriptionStore";
import { IconButton, Spinner } from "@/_ocean/ui";
import PlanCard from "./components/PlanCard";
import PaymentModal from "./components/PaymentModal";

const SubscriptionPlan: React.FC = () => {
  const { subscription } = useSubscriptionStore();
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ocean-background-light dark:bg-ocean-background-dark">
        <Spinner size={40} className="text-primary" />
        <p className="text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Loading premium plans...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-ocean-background-light pb-16 text-ocean-text-primary-light dark:bg-ocean-background-dark dark:text-ocean-text-primary-dark md:pb-20">
      {/* Simplified Background Effects for Mobile */}
      <div className="pointer-events-none fixed inset-0 hidden overflow-hidden md:block">
        <div
          className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]"
          style={{ animation: 'sub-plan-pulse 4s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]"
          style={{ animation: 'sub-plan-pulse 4s ease-in-out infinite 2s' }}
        />
      </div>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
        {/* Header Section */}
        <div className="py-6 md:py-16">
          <IconButton onClick={() => navigate(-1)} className="mb-4 md:mb-8">
            <ChevronLeft size={20} className="md:hidden" />
            <ChevronLeft size={24} className="hidden md:block" />
          </IconButton>

          <div className="flex flex-col items-center gap-3 text-center md:gap-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[0.7rem] font-extrabold uppercase tracking-wide text-primary md:text-xs">
                Premium Membership
              </span>
            </div>

            <h1 className="max-w-3xl bg-gradient-to-br from-ocean-text-primary-light to-ocean-text-primary-light/70 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:to-white/70 sm:text-4xl md:text-6xl">
              {subscription?.status === 'active' ? (
                "You're a Premium Member"
              ) : (
                <>
                  <span className="md:hidden">Unlock Full Access</span>
                  <span className="hidden md:inline">Unlock Full Creative Access</span>
                </>
              )}
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark md:text-base">
              {subscription?.status === 'active'
                ? `Your ${subscription.plan?.name} plan is currently active until ${new Date(subscription.endDate).toLocaleDateString()}.`
                : "Choose your perfect plan and start growing your creative career today"}
            </p>
          </div>
        </div>

        {/* Pricing Grid. The nth-child(3):last-child rule centers a 3rd/odd-one-out plan
            card on the 2-column tablet layout (sm–lg) instead of stretching it half-width,
            mirroring the old MUI Grid's isTablet special-case — without needing JS. */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3 [&>*:nth-child(3):last-child]:sm:col-span-2 [&>*:nth-child(3):last-child]:sm:mx-auto [&>*:nth-child(3):last-child]:sm:w-full [&>*:nth-child(3):last-child]:sm:max-w-sm [&>*:nth-child(3):last-child]:lg:col-span-1 [&>*:nth-child(3):last-child]:lg:mx-0 [&>*:nth-child(3):last-child]:lg:max-w-none">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              index={index}
              isHovered={hoveredPlan === plan.planId}
              onHover={setHoveredPlan}
              onSubscribe={handleSubscribe}
              isActive={subscription?.planId === plan.planId}
            />
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-16 border-t border-ocean-border-light pt-16 dark:border-white/5 md:mt-24 md:pt-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {[
              { icon: <Monitor className="h-6 w-6 md:h-7 md:w-7" />, title: "Cross-Platform", desc: "Access on web, mobile & tablet" },
              { icon: <ShieldCheck className="h-6 w-6 md:h-7 md:w-7" />, title: "Secure Payments", desc: "Bank-grade encryption" },
              { icon: <Heart className="h-6 w-6 md:h-7 md:w-7" />, title: "Priority Support", desc: "24/7 dedicated team" }
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-3 text-center md:gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  {item.icon}
                </div>
                <div>
                  <p className="mb-1 text-base font-extrabold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{item.title}</p>
                  <p className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
          @keyframes sub-plan-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default SubscriptionPlan;
