import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Edit3, Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/users/profile');
        setProfile(res.data);
        setNewName(res.data.name);
      } catch (error) {
        toast.error("Không thể tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error("Chỉ hỗ trợ định dạng hình ảnh");
    if (file.size > 5 * 1024 * 1024) return toast.error("Kích thước ảnh tối đa là 5MB");

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await API.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      login({ ...user, avatar_url: res.data.avatar_url });
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return toast.error("Tên không được để trống");

    setUpdating(true);
    try {
      const res = await API.put('/users/profile', { name: newName });
      setProfile(res.data);
      // Update AuthContext so header and other components reflect the change
      login({ ...user, name: res.data.name, avatar_url: res.data.avatar_url });
      setIsEditing(false);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  const getAvatarSource = () => {
    if (profile?.avatar_url) return `http://localhost:5000${profile.avatar_url}`;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-text-secondary mt-1">Quản lý thông tin tài khoản và tùy chỉnh cá nhân</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Left */}
        <div className="md:col-span-1">
          <div className="bg-surface border border-border rounded-3xl p-8 text-center shadow-xl relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="relative z-10">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-primary/5 group-hover:scale-105 transition-transform duration-500">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : getAvatarSource() ? (
                    <img src={getAvatarSource()} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-primary" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Edit3 className="w-3.5 h-3.5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                </label>
              </div>

              <h2 className="text-xl font-bold text-text-primary mb-1">{profile.name}</h2>
              <p className="text-sm text-text-secondary font-medium mb-6 uppercase tracking-wider">{profile.role}</p>

              <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#DCFCE7] text-[#16A34A] rounded-full text-[10px] font-bold border border-[#16A34A]/10">
                <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse"></span>
                <span>Active Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details and Edit Form Right */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-text-primary">Thông tin cơ bản</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all font-semibold text-sm border border-primary/20"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
              )}
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Display Name */}
              <div className="group">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Tên hiển thị</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={newName}
                    readOnly={!isEditing}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-background border rounded-2xl text-sm text-text-primary transition-all
                      ${isEditing ? 'border-primary ring-2 ring-primary/5 outline-none' : 'border-border'}`}
                  />
                </div>
              </div>

              {/* Email (Readonly always for now) */}
              <div className="opacity-70 cursor-not-allowed">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Địa chỉ Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-2xl text-sm text-text-primary"
                  />
                </div>
              </div>

              {/* Account Stats / Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-background border border-border rounded-2xl flex items-center space-x-4">
                  <div className="p-2 bg-text-secondary/5 rounded-lg text-text-secondary">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-tighter">Phân quyền</p>
                    <p className="text-sm font-bold text-text-primary capitalize">{profile.role}</p>
                  </div>
                </div>
                <div className="p-4 bg-background border border-border rounded-2xl flex items-center space-x-4">
                  <div className="p-2 bg-text-secondary/5 rounded-lg text-text-secondary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-tighter">Ngày gia nhập</p>
                    <p className="text-sm font-bold text-text-primary">{new Date(profile.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Lưu thay đổi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setNewName(profile.name);
                    }}
                    className="px-6 py-3 border border-border bg-background hover:bg-black/5 text-text-secondary font-bold text-sm rounded-2xl transition-all flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-3xl p-6 flex items-center justify-between group">
            <div className="flex items-center space-x-4">
              <div className="bg-[#EF4444]/10 p-3 rounded-2xl text-[#EF4444]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#991B1B]">Khu vực rủi ro</h4>
                <p className="text-xs text-[#B91C1C]">Các hành động tại đây không thể hoàn tác.</p>
              </div>
            </div>
            <button className="text-[11px] font-bold text-[#EF4444] border border-[#EF4444]/20 px-4 py-2 rounded-xl hover:bg-[#EF4444] hover:text-white transition-all uppercase tracking-wider">
              Yêu cầu xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
