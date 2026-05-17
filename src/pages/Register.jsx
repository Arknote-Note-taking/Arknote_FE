import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { useContext, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { supabase } from '../config/supabase';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp!');
      return;
    }
    try {
      const res = await API.post('/auth/register', { name, email, password });
      login(res.data);
      navigate('/');
    } catch (err) {
      let msg = err.response?.data?.error || 'Đăng ký thất bại';
      if (msg === 'Email already in use') {
        msg = 'Email này đã được sử dụng!';
      }
      toast.error(msg);
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
      <div className="bg-surface p-8 rounded-xl shadow-2xl border border-border/50">
        <h2 className="text-center text-3xl font-extrabold text-text-primary mb-8 tracking-tight">Get Started Now</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
              placeholder="Enter your name"
              required
            />
          </div>
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
            <label className="block text-xs font-semibold text-text-primary mb-1">Password</label>
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
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-text-secondary/50"
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

          <div className="flex items-center space-x-2 pt-2">
            <input type="checkbox" id="agree" className="rounded border-border text-primary focus:ring-primary rounded-sm" required />
            <label htmlFor="agree" className="text-[10px] text-text-secondary font-medium">
              I agree to the <Link to="/terms" className="font-bold border-b border-text-secondary hover:text-primary hover:border-primary transition-colors">terms</Link> & <Link to="/privacy" className="font-bold border-b border-text-secondary hover:text-primary hover:border-primary transition-colors">policy</Link>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-2"
          >
            Signup
          </button>
        </form>

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
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-2 border border-border rounded-lg py-2 hover:bg-black/5 transition-colors"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
            <span className="text-[10px] font-semibold text-text-primary">Sign in with Google</span>
          </button>
        </div>

        <p className="text-center text-[11px] font-medium text-text-primary mt-8">
          Have an account? <Link to="/login" className="text-primary hover:underline ml-1 font-semibold">Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
