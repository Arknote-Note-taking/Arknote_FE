import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data?.session) {
          // Send token to backend
          const res = await API.post('/auth/google-login', {
            access_token: data.session.access_token
          });
          
          if (res.data.needsPassword) {
            navigate('/set-password', { state: { tempUser: res.data } });
          } else {
            login(res.data);
            if (res.data.role === 'admin') {
              navigate('/dashboard');
            } else {
              navigate('/');
            }
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error during auth callback:', err);
        toast.error('Xác thực thất bại');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-secondary font-medium">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
