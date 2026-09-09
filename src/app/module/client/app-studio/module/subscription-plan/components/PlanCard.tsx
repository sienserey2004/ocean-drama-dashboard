import { useEffect, useState } from "react";
import { Check, Crown, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { formatBenefitKey } from "../utils/subscription";
import { SubscriptionPlan as ISubscriptionPlan } from "@/app/types";

// Matches MUI's old breakpoints.down('md') threshold (900px) so the isMobile-driven
// logic below (icon sizing, benefit truncation, hover-vs-tap gating) behaves exactly
// as it did before the MUI removal.
function useIsMobile(breakpointPx = 900) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpointPx);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 0.05}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpointPx]);

  return isMobile;
}

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
  const isMobile = useIsMobile(900);
  const isFeatured = plan.name.toLowerCase().includes('yearly');

  return (
    <div
      onMouseEnter={() => !isMobile && onHover(plan.planId)}
      onMouseLeave={() => !isMobile && onHover(null)}
      onTouchStart={() => isMobile && onHover(plan.planId)}
      className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border p-6 transition-all duration-300 sm:p-8 md:rounded-[40px] md:p-10 ${
        !isMobile && isHovered ? '-translate-y-2.5 scale-[1.02]' : ''
      } ${
        isHovered
          ? 'border-primary/40 bg-ocean-background-light dark:bg-white/[0.04]'
          : isFeatured
            ? 'border-primary/30 bg-ocean-card-light dark:bg-white/[0.02]'
            : 'border-ocean-border-light bg-ocean-card-light dark:border-white/5 dark:bg-white/[0.02]'
      }`}
    >
      {isFeatured && (
        <div className="absolute -right-7 top-4 whitespace-nowrap rotate-45 bg-primary px-8 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-white md:px-12 md:text-[0.7rem]">
          Best Value
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div
              className={`rounded-2xl p-2 md:p-3 ${
                isFeatured
                  ? 'bg-primary/10 text-primary'
                  : 'bg-ocean-background-light text-ocean-text-primary-light dark:bg-white/5 dark:text-white'
              }`}
            >
              {index === 0 ? <Zap size={isMobile ? 20 : 24} /> : index === 1 ? <ShieldCheck size={isMobile ? 20 : 24} /> : <Crown size={isMobile ? 20 : 24} />}
            </div>
            <h3 className="text-lg font-extrabold text-ocean-text-primary-light dark:text-white">{plan.name}</h3>
          </div>
          <p className="text-xs text-ocean-text-secondary-light dark:text-white/40">
            {plan.durationDays} Days • Full Access
          </p>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-ocean-text-primary-light dark:text-white md:text-4xl">${plan.price}</span>
          <span className="text-sm font-semibold text-ocean-text-secondary-light dark:text-white/30">/{plan.currency}</span>
        </div>

        <div className="flex flex-col gap-3">
          {plan.benefits.slice(0, isMobile ? 4 : undefined).map((benefit) => (
            <div key={benefit.benefitId} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                <Check size={12} strokeWidth={3} className="text-success" />
              </span>
              <span className="text-[0.8rem] font-medium text-ocean-text-secondary-light dark:text-white/80 md:text-sm">
                {formatBenefitKey(benefit.benefitKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSubscribe(plan.planId)}
        disabled={isActive}
        className={`mt-8 flex items-center justify-center gap-2 rounded-[20px] py-4 text-sm font-extrabold transition-all duration-200 disabled:cursor-not-allowed md:mt-10 md:py-5 md:text-base ${
          isActive
            ? 'border border-success text-success'
            : isFeatured
              ? 'bg-primary text-white hover:-translate-y-0.5 hover:bg-primary-dark active:scale-[0.98]'
              : 'bg-ocean-text-primary-light text-white hover:-translate-y-0.5 hover:bg-ocean-text-primary-light/90 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-white/90'
        }`}
      >
        {isActive ? "Current Plan" : "Select Plan"}
        {isActive ? <Check size={18} /> : <ArrowRight size={18} />}
      </button>
    </div>
  );
};

export default PlanCard;
