import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { useState, useContext } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { supabase } from '../config/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showRestoreRequest, setShowRestoreRequest] = useState(false);
  const [requestingRestore, setRequestingRestore] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowRestoreRequest(false);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data);
      if (res.data.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || '';
      if (errorMsg.includes('vô hiệu hóa') || errorMsg.includes('xóa khỏi hệ thống')) {
        setShowRestoreRequest(true);
        toast.error(errorMsg);
      } else if (errorMsg === 'Invalid login credentials' || errorMsg.includes('email') || errorMsg.includes('password')) {
        toast.error('Email hoặc Password không chính xác');
      } else {
        toast.error(errorMsg || 'Đăng nhập thất bại');
      }
    }
  };

  const handleRequestRestoreAccount = async () => {
    setRequestingRestore(true);
    try {
      await API.post('/users/request-restore', { email });
      toast.success('Đã gửi yêu cầu khôi phục tài khoản tới Admin thành công! 🎉');
      setShowRestoreRequest(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gửi yêu cầu khôi phục thất bại.');
    } finally {
      setRequestingRestore(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error('Có lỗi xảy ra khi đăng nhập bằng Google');
      console.error(err);
    }
  };

  return (
    <AuthLayout>
      <div className="p-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center space-x-1.5 text-text-secondary hover:text-primary text-xs font-bold transition-all">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về trang chủ</span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-text-primary mb-2 tracking-tight">Welcome back!</h2>
        <p className="text-center text-sm text-text-secondary font-medium mb-8">Enter your Credentials to access your account</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-text-primary">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-primary hover:underline font-medium">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="remember" className="rounded border-border text-primary focus:ring-primary rounded-sm" />
            <label htmlFor="remember" className="text-[10px] text-text-secondary font-medium">Remember for 30 days</label>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-2"
          >
            Login
          </button>
        </form>

        {showRestoreRequest && (
          <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl space-y-2 mt-5 text-center animate-fadeIn">
            <p className="text-xs text-text-secondary leading-relaxed">
              Tài khoản của bạn đang ở trạng thái bị vô hiệu hóa. Bạn có muốn gửi yêu cầu khôi phục tới Admin không?
            </p>
            <button
              type="button"
              onClick={handleRequestRestoreAccount}
              disabled={requestingRestore}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center space-x-1.5"
            >
              <span>{requestingRestore ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu khôi phục'}</span>
            </button>
          </div>
        )}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-surface text-text-secondary">Or</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center space-x-2 border border-border rounded-lg py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
            <span className="text-[10px] font-semibold text-text-primary">Sign in with Google</span>
          </button>
        </div>

        <p className="text-center text-[11px] font-medium text-text-primary mt-8">
          Don't have an account? <Link to="/register" className="text-primary hover:underline font-semibold ml-1">Sign Up</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
