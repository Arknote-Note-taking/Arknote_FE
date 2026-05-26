import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import API from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import { AuthContext } from '../context/AuthContext';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tempUser = location.state?.tempUser;
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (!tempUser) {
      navigate('/login');
    }
  }, [tempUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('Vui lòng nhập đầy đủ thông tin');
    if (password !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    if (password.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');

    setLoading(true);
    try {
      const response = await API.post('/auth/set-password', { 
        newPassword: password,
        name: tempUser.name,
        avatar_url: tempUser.avatar_url
      }, {
        headers: { Authorization: `Bearer ${tempUser.token}` }
      });
      toast.success('Thiết lập mật khẩu thành công!');
      login({ ...tempUser, needsPassword: false, token: response.data.token });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!tempUser) return null;

  return (
    <AuthLayout>
      <div className="p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-text-primary mb-2 tracking-tight">Thiết Lập Mật Khẩu</h2>
          <p className="text-center text-sm text-text-secondary font-medium">Bảo vệ tài khoản của bạn bằng mật khẩu an toàn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
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
            <label className="block text-xs font-semibold text-text-primary mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
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
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu mật khẩu & Tiếp tục'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-text-secondary hover:text-primary flex items-center justify-center w-full transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Quay lại đăng nhập
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SetPassword;
