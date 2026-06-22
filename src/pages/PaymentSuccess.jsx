import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Loader2, ArrowRight, Home } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const verifiedRef = useRef(false);

  const orderCode = searchParams.get('orderCode');
  const code = searchParams.get('code');

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      if (!orderCode) {
        setLoading(false);
        setError('Không tìm thấy thông tin mã đơn hàng (orderCode) trong liên kết.');
        return;
      }

      // Check if user is already pro, but we still verify with backend to ensure backend data is updated
      try {
        const res = await API.post('/payment/verify-payment', { orderCode: Number(orderCode) });
        if (res.data && res.data.success) {
          setSuccess(true);
          const formattedAmount = res.data.amount 
            ? `${res.data.amount.toLocaleString('vi-VN')}đ` 
            : '79.000đ';
          setDetails({
            orderCode,
            status: res.data.status || 'PAID',
            amount: formattedAmount
          });
          
          // Update user info in AuthContext
          if (user) {
            login({ ...user, is_pro: true });
          }
          toast.success('Nâng cấp tài khoản PRO thành công! 🎉');
        } else {
          setError(res.data.message || 'Xác nhận thanh toán thất bại.');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Có lỗi xảy ra trong quá trình xác thực giao dịch.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [orderCode]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070b0d] relative overflow-hidden font-sans px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#52B788]/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-[#52B788]" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Đang xác thực giao dịch</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi chúng tôi xử lý hóa đơn của bạn...
            </p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center text-center">
            {/* Success Animation Container */}
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/5 ring-8 ring-emerald-500/5 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full mb-3">
              Giao dịch thành công
            </span>

            <h3 className="text-2xl font-black text-white mb-2">Chúc mừng!</h3>
            <p className="text-sm text-slate-300 mb-6">
              Bạn đã nâng cấp thành công lên tài khoản <strong className="text-primary">PRO</strong>. Hãy trải nghiệm tất cả tính năng cao cấp ngay bây giờ.
            </p>

            {/* Receipt details */}
            <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 mb-8 text-left space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Mã đơn hàng</span>
                <span className="text-slate-200 font-bold font-mono">#{orderCode}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Gói nâng cấp</span>
                <span className="text-primary font-bold">Arknote PRO (1 Tháng)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Tổng thanh toán</span>
                <span className="text-white font-extrabold text-sm">{details?.amount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Trạng thái</span>
                <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Đã thanh toán</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>Vào Workspace của bạn</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl text-red-500 font-black">!</span>
            </div>

            <span className="text-xs font-bold text-red-400 tracking-wider uppercase bg-red-500/10 px-3 py-1 rounded-full mb-3">
              Xác thực thất bại
            </span>

            <h3 className="text-xl font-bold text-white mb-2">Thanh toán chưa hoàn tất</h3>
            <p className="text-sm text-slate-400 mb-6">
              {error || 'Hệ thống chưa nhận được thông tin thanh toán hợp lệ của giao dịch này.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => navigate('/#pricing')}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all text-sm cursor-pointer"
              >
                Thử thanh toán lại
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer"
              >
                Quay về Bảng tổng quan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
