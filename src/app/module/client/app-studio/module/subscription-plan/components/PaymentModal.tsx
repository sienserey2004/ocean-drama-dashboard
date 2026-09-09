import { X, RefreshCw, Check, Smartphone } from "lucide-react";
import { Modal, IconButton, Spinner, Button } from "@/_ocean/ui";

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
  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="absolute right-4 top-4 z-10">
        <IconButton size="sm" onClick={onClose} aria-label="Close">
          <X size={20} />
        </IconButton>
      </div>

      <div className="flex flex-col items-center gap-4 p-6 text-center md:p-8">
        {/* Header */}
        <div>
          <h3 className="mb-1 text-lg font-extrabold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
            {status === 'success' ? 'Payment Successful' : 'Scan to Pay'}
          </h3>
          <p className="text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
            {planName} • ${amount}
          </p>
        </div>

        {/* QR Container */}
        <div className="relative flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-4 shadow-soft">
          {qrCode && status !== 'expired' ? (
            <img
              src={qrCode}
              alt="Bakong KHQR"
              className="h-full w-full object-contain"
              style={{
                filter: status === 'success' ? 'blur(4px) grayscale(100%)' : 'none',
                opacity: status === 'success' ? 0.3 : 1
              }}
            />
          ) : status === 'expired' ? (
            <div className="flex flex-col items-center gap-1 text-danger">
              <RefreshCw size={40} />
              <span className="text-xs font-extrabold">Expired</span>
            </div>
          ) : (
            <Spinner size={36} className="text-primary" />
          )}

          {status === 'success' && (
            <div className="absolute inset-0 flex animate-fade-in items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
                <Check size={32} strokeWidth={3} />
              </span>
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className="flex w-full flex-col gap-4">
          {status === 'pending' && (
            <div className="flex items-center justify-center gap-1.5 text-primary">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wide">
                Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {status === 'expired' && (
            <p className="text-xs font-bold text-danger">
              This QR code has expired. Please try again.
            </p>
          )}

          <div className="h-px w-full bg-ocean-border-light dark:bg-ocean-border-dark" />

          <div className="flex gap-3 text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ocean-background-light text-ocean-text-secondary-light dark:bg-white/5 dark:text-ocean-text-secondary-dark">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="block text-xs font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                How to pay?
              </p>
              <p className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                Open your bank app and scan the KHQR code to complete subscription
              </p>
            </div>
          </div>
        </div>

        {status === 'success' && (
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-success py-3 text-sm font-extrabold text-white transition-colors hover:bg-success/90"
          >
            Get Started
          </button>
        )}

        {status === 'expired' && (
          <Button fullWidth variant="outlined" color="default" onClick={onClose} className="!rounded-2xl !py-3 font-extrabold">
            Close & Retry
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
