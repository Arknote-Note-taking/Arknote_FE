import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import { KeyRound, Mail, ArrowRight, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    if (!email) return toast.error('Vui lòng nhập email');
    setLoading(true);
    try {
      const res = await API.forgotPassword(email);
      toast.success(res.data.message || 'Mã xác nhận đã được gửi!');
      setStep(2);
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi gửi mã');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) return toast.error('Vui lòng nhập đủ thông tin');
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    
    setLoading(true);
    try {
      const res = await API.resetPassword(email, code, newPassword, confirmPassword);
      toast.success(res.data.message || 'Đổi mật khẩu thành công!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-text-primary mb-2 tracking-tight">Khôi phục mật khẩu</h2>
          <p className="text-center text-sm text-text-secondary font-medium mb-2">
            {step === 1 ? 'Nhập email của bạn để nhận mã xác nhận' : 'Nhập mã xác nhận và mật khẩu mới'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Email đăng ký</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary bg-transparent focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Mã xác nhận (OTP)</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary bg-transparent focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
                  placeholder="Nhập mã 6 số"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-text-primary bg-transparent focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  tabIndex="-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-text-primary bg-transparent focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-4 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
            
            <div className="pt-2 text-center">
              {countdown > 0 ? (
                <p className="text-sm text-text-secondary">
                  Gửi lại mã sau <span className="font-semibold text-primary">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                >
                  Chưa nhận được mã? Gửi lại
                </button>
              )}
            </div>
          </form>
        )}

        <p className="text-center text-[11px] font-medium text-text-primary mt-8">
          <Link to="/login" className="text-primary hover:underline font-semibold ml-1">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
