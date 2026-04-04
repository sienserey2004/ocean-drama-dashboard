import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRPaymentCardProps {
  name: string;
  amount: number;
  currency?: string;
  qrValue: string;
}

const QRPaymentCard: React.FC<QRPaymentCardProps> = ({
  name,
  amount,
  currency = 'KHR',
  qrValue,
}) => {
  // Format number with commas
  const formattedAmount = new Intl.NumberFormat('en-US').format(amount);

  return (
    <div className="flex items-center justify-center p-4 bg-[#F3F4F6] min-h-[500px] font-sans">
      <div className="w-full max-w-[350px] bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
        
        {/* Top Header Section with Curvature */}
        <div className="bg-[#E53935] pt-10 pb-12 rounded-b-[2.5rem] flex justify-center items-center shadow-md">
          <h1 className="text-white text-4xl font-black italic tracking-tighter uppercase">
            KH<span className="opacity-90 not-italic lowercase">qr</span>
          </h1>
        </div>

        {/* Info Area */}
        <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center">
          <p className="text-[#111827] text-xl font-medium mb-1">
            {name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[2.5rem] font-extrabold text-[#111827]">
              {formattedAmount}
            </span>
            <span className="text-xl font-bold text-[#111827]">
               {currency}
            </span>
          </div>
        </div>

        {/* Thin Dashed Separator */}
        <div className="px-10 py-4 w-full">
          <div className="border-t border-dashed border-gray-300 w-full opacity-60" />
        </div>

        {/* QR Code Container */}
        <div className="px-10 pb-14 flex flex-col items-center">
          <div className="p-1 bg-white relative">
             {qrValue.startsWith('data:') ? (
               <img 
                 src={qrValue} 
                 alt="Payment QR" 
                 className="w-48 h-48 object-contain"
               />
             ) : (
               <QRCodeSVG
                 value={qrValue}
                 size={200}
                 level="M"
                 includeMargin={false}
                 imageSettings={{
                    src: "/src/asset/images/logo.jpg",
                    height: 48,
                    width: 48,
                    excavate: true,
                 }}
               />
             )}
          </div>
          <p className="mt-8 text-[0.6rem] text-gray-400 font-bold uppercase tracking-[0.25em]">
             Scan to pay
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRPaymentCard;
