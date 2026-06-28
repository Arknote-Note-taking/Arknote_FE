import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Home, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070b0d] relative overflow-hidden font-sans px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#52B788]/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />

        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-red-500/5 ring-8 ring-red-500/5 animate-pulse">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <span className="text-xs font-bold text-red-400 tracking-wider uppercase bg-red-500/10 px-3 py-1 rounded-full mb-3 inline-block">
          Giao dịch đã hủy
        </span>

        <h3 className="text-2xl font-black text-white mb-2">Đã hủy thanh toán</h3>
        <p className="text-sm text-slate-300 mb-8 max-w-xs mx-auto">
          Yêu cầu nâng cấp tài khoản PRO của bạn đã bị hủy bỏ. Tài khoản của bạn hiện tại vẫn giữ nguyên gói dịch vụ Free.
        </p>

        {/* Actions */}
        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => navigate('/#pricing')}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bảng giá & thử lại</span>
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Vào Workspace của bạn</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
