import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Edit3, Save, X, Loader2, Eye, EyeOff, Zap, ChevronRight, Settings, Bell, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New Profile fields states matching mockup
  const [activeTab, setActiveTab] = useState('profile');
  const [phone, setPhone] = useState(() => localStorage.getItem('profile_phone') || '');
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('profile_muted') === 'true');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef(null);

  // Theme & Language states
  const [language, setLanguage] = useState(() => localStorage.getItem('profile_lang') || 'vi');

  // Change Password State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/users/profile');
        setProfile(res.data);
        setNewName(res.data.name);
        login(res.data);
      } catch (error) {
        toast.error("Không thể tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLangChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('profile_lang', lang);
    toast.success(`Đã chuyển sang ${lang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}`);
  };

  const handleMuteToggle = (muted) => {
    setIsMuted(muted);
    localStorage.setItem('profile_muted', muted ? 'true' : 'false');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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
      // Save local phone to localStorage
      localStorage.setItem('profile_phone', phone);

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

  const handleSendOtp = async () => {
    setPassLoading(true);
    try {
      await API.post('/auth/forgot-password', { email: profile.email });
      toast.success('Mã OTP đã được gửi đến email của bạn');
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setPassLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    if (newPassword.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');

    setPassLoading(true);
    try {
      await API.post('/auth/reset-password', {
        email: profile.email,
        code: otp,
        newPassword,
        confirmPassword
      });
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setIsChangingPassword(false);
      setOtpSent(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setCountdown(0);
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Mã OTP không hợp lệ hoặc có lỗi xảy ra');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  const getAvatarSource = () => {
    if (!profile?.avatar_url) return null;
    if (profile.avatar_url.startsWith('http')) return profile.avatar_url;
    return `http://localhost:5000${profile.avatar_url}`;
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 pb-12 animate-fadeIn">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">Hồ sơ cá nhân</h1>
        <p className="text-text-secondary mt-1 text-sm">Quản lý thông tin tài khoản và tùy chỉnh cài đặt của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Menu Card */}
        <div className="lg:col-span-1 lg:h-full">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xl space-y-6 transition-all hover:shadow-2xl hover:border-primary/20 lg:h-full flex flex-col justify-between">
            {/* Upper Section */}
            <div className="space-y-6">
              {/* Header: User avatar + info */}
              <div className="flex items-center space-x-4 pb-4 border-b border-border/50">
                <div className="relative w-14 h-14 shrink-0">
                  <div className="w-full h-full bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : getAvatarSource() ? (
                      <img src={getAvatarSource()} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform">
                    <Edit3 className="w-3 h-3" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                  </label>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-text-primary truncate">{profile.name}</h3>
                  <p className="text-[10px] text-text-secondary truncate">{profile.email}</p>
                </div>
              </div>

              {/* Menu Links - Top Portion */}
              <div className="space-y-2">
                {/* My Profile Link */}
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsEditing(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all group cursor-pointer ${activeTab === 'profile'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-primary border border-transparent'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-primary" />
                    <span>Hồ sơ của tôi</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Change Password Link */}
                <button
                  onClick={() => {
                    setActiveTab('password');
                    setIsChangingPassword(true);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all group cursor-pointer ${activeTab === 'password'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-primary border border-transparent'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Thay đổi mật khẩu</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Language item */}
                <div className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-text-primary border border-transparent">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-4 h-4 text-primary" />
                    <span>Ngôn ngữ</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => handleLangChange(e.target.value)}
                    className="bg-background border border-border rounded-xl px-2.5 py-1 text-[10px] text-text-primary focus:outline-none focus:border-primary cursor-pointer font-bold"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                  </select>
                </div>

                {/* Notifications item */}
                <div className="flex items-center justify-between p-3 rounded-xl text-xs font-bold text-text-primary border border-transparent">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-primary" />
                    <span>Thông báo</span>
                  </div>
                  <div className="relative" ref={notifDropdownRef}>
                    <button
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-primary/20 transition-all uppercase"
                    >
                      {isMuted ? 'Mute' : 'Allow'}
                    </button>
                    {showNotifDropdown && (
                      <div className="absolute right-0 top-full mt-1.5 w-24 bg-surface border border-border rounded-xl shadow-lg py-1 z-20">
                        <button
                          onClick={() => { handleMuteToggle(false); setShowNotifDropdown(false); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-text-primary cursor-pointer"
                        >
                          Allow
                        </button>
                        <button
                          onClick={() => { handleMuteToggle(true); setShowNotifDropdown(false); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-text-primary cursor-pointer"
                        >
                          Mute
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Log out at the bottom */}
            <div className="pt-4 border-t border-border/50">
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-500 font-bold transition-all cursor-pointer border border-transparent"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Panel Card */}
        <div className="lg:col-span-2 lg:h-full">
          {activeTab === 'profile' ? (
            /* CASE A: PROFILE INFO / EDIT CARD */
            <div className="bg-surface border border-border rounded-xl p-8 shadow-xl transition-all hover:shadow-2xl hover:border-primary/20 animate-fadeIn lg:h-full flex flex-col justify-between">
              {/* Upper Section */}
              <div className="flex-1 flex flex-col justify-between">
                {/* Header: User avatar, name, email, edit state triggers, close button */}
                <div className="flex items-center justify-between pb-6 border-b border-border/50 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 shrink-0">
                      <div className="w-full h-full bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : getAvatarSource() ? (
                          <img src={getAvatarSource()} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform">
                        <Edit3 className="w-3 h-3" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                      </label>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-text-primary tracking-tight leading-snug">{profile.name}</h2>
                      <p className="text-xs text-text-secondary">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 text-primary hover:bg-primary/5 bg-primary/5 hover:border-primary/40 px-4 py-2 rounded-xl transition-all font-semibold text-sm border border-primary/20 cursor-pointer animate-fadeIn"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Chỉnh sửa</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/')}
                      className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      title="Đóng trang hồ sơ"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleUpdate} className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Display name */}
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Tên hiển thị</label>
                      <input
                        type="text"
                        value={newName}
                        readOnly={!isEditing}
                        onChange={(e) => setNewName(e.target.value)}
                        className={`w-full px-4 py-3 bg-background border rounded-xl text-sm transition-all font-semibold ${isEditing
                          ? 'border-primary focus:ring-4 focus:ring-primary/10 outline-none text-text-primary'
                          : 'border-border text-text-secondary cursor-not-allowed opacity-80'
                          }`}
                        placeholder="Nhập tên hiển thị"
                      />
                    </div>

                    {/* Email account */}
                    <div className="opacity-80">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Địa chỉ Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-text-secondary cursor-not-allowed font-semibold"
                      />
                    </div>

                    {/* Mobile number */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={phone}
                        readOnly={!isEditing}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={isEditing ? "Nhập số điện thoại của bạn..." : "Chưa cung cấp số điện thoại"}
                        className={`w-full px-4 py-3 bg-background border rounded-xl text-sm transition-all font-semibold ${isEditing
                          ? 'border-primary focus:ring-4 focus:ring-primary/10 outline-none text-text-primary'
                          : 'border-border text-text-secondary cursor-not-allowed opacity-80'
                          }`}
                      />
                    </div>
                  </div>

                  {/* Extra Account Stats / Metadata Grid */}
                  <div className="space-y-6 pt-4">
                    <div className={`grid grid-cols-1 ${profile?.role === 'admin' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
                      <div className="p-4 bg-background border border-border hover:border-primary/20 rounded-xl flex items-center space-x-4 transition-all duration-300">
                        <div className="p-2.5 bg-primary/5 text-primary rounded-xl border border-primary/10">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Phân quyền</p>
                          <p className="text-sm font-black text-text-primary capitalize mt-0.5">{profile.role}</p>
                        </div>
                      </div>
                      {profile?.role !== 'admin' && (
                        <div className="p-4 bg-background border border-border hover:border-primary/20 rounded-xl flex items-center space-x-4 transition-all duration-300">
                          <div className="p-2.5 bg-amber-500/5 text-amber-500 rounded-xl border border-amber-500/10">
                            <Zap className="w-5 h-5 animate-pulse text-amber-500" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">Gói tài khoản</p>
                            <div className="flex items-center space-x-2">
                              {profile?.is_pro ? (
                                <span className="text-[10px] bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-lg shadow-md shadow-amber-500/20 uppercase tracking-wider animate-pulse">
                                  PRO
                                </span>
                              ) : (
                                <>
                                  <span className="text-[10px] bg-slate-500 text-white font-black px-2.5 py-0.5 rounded-lg shadow-md shadow-slate-500/25 uppercase tracking-wider">
                                    FREE
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => navigate('/#pricing')}
                                    className="text-[10px] text-primary hover:text-primary-dark font-extrabold cursor-pointer hover:underline animate-pulse"
                                  >
                                    Nâng cấp
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="p-4 bg-background border border-border hover:border-primary/20 rounded-xl flex items-center space-x-4 transition-all duration-300">
                        <div className="p-2.5 bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/10">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Gia nhập ngày</p>
                          <p className="text-sm font-black text-text-primary mt-0.5">{new Date(profile.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Save changes and cancel buttons */}
                    {isEditing && (
                      <div className="pt-2 flex items-center space-x-3 animate-fadeIn">
                        <button
                          type="submit"
                          disabled={updating}
                          className="bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>Lưu thay đổi (Save Change)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setNewName(profile.name);
                          }}
                          className="px-6 py-3 border border-border bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary font-bold text-sm rounded-xl transition-all cursor-pointer text-center"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* CASE B: CHANGE PASSWORD CARD */
            <div className="bg-surface border border-border rounded-xl p-8 shadow-xl transition-all hover:shadow-2xl hover:border-primary/20 animate-fadeIn font-bold text-sm lg:h-full flex flex-col justify-between">
              {/* Upper Portion */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-border/50">
                  <div>
                    <h3 className="text-lg font-extrabold text-text-primary flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-primary animate-pulse" />
                      <span>Thay đổi mật khẩu</span>
                    </h3>
                    <p className="text-xs text-text-secondary font-medium mt-1">Cập nhật mật khẩu mới để bảo vệ an toàn cho tài khoản của bạn</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsChangingPassword(false);
                    }}
                    className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    title="Quay lại Hồ sơ"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!otpSent ? (
                  <div className="space-y-4 bg-background border border-border p-5 rounded-xl animate-fadeIn flex-1 flex flex-col justify-center">
                    <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                      Chúng tôi sẽ gửi một mã xác minh OTP gồm 6 chữ số đến địa chỉ email đăng ký của bạn <strong>{profile.email}</strong> để đảm bảo bạn chính là người thực hiện yêu cầu này.
                    </p>
                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        onClick={handleSendOtp}
                        disabled={passLoading}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        <span>Gửi mã OTP qua Email</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 bg-background border border-border p-5 rounded-xl animate-fadeIn flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Mã xác nhận (OTP)</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Nhập 6 số OTP từ email"
                          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Ít nhất 6 ký tự"
                            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all pr-12 font-semibold"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                            tabIndex="-1"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Xác nhận mật khẩu</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all pr-12 font-semibold"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                            tabIndex="-1"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border/50">
                      <button
                        type="submit"
                        disabled={passLoading}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Xác nhận đổi mật khẩu</span>
                      </button>
                      <button
                        type="button"
                        disabled={countdown > 0 || passLoading}
                        onClick={handleSendOtp}
                        className="px-6 py-3 border border-primary/20 text-primary hover:bg-primary/5 disabled:opacity-50 font-bold text-sm rounded-xl transition-all whitespace-nowrap flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại mã'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setOtpSent(false);
                          setOtp('');
                          setCountdown(0);
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                          setActiveTab('profile');
                        }}
                        className="px-6 py-3 border border-border bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary font-bold text-sm rounded-xl transition-all cursor-pointer text-center"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
