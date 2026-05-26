import React, { useState } from 'react';
import { BookOpen, Sun, Moon } from 'lucide-react';

const AuthLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex bg-cover bg-center relative transition-colors duration-300"
      style={{ backgroundImage: "url('/images/auth-bg-green.png')" }}
    >
      {/* Full screen overlay - slightly darker in dark mode */}
      <div className="absolute inset-0 bg-green-950/40 dark:bg-black/60 backdrop-blur-[2px] transition-colors duration-300" />

      {/* Dark mode toggle - top right corner */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-4 right-4 z-20 flex items-center px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-md ${
          darkMode
            ? 'bg-slate-800/90 border-slate-600 text-yellow-400 hover:bg-slate-700'
            : 'bg-white/80 border-white/60 text-gray-600 hover:bg-white'
        }`}
        title="Chuyển chế độ Sáng/Tối"
      >
        {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>

      <div className="relative z-10 flex w-full max-w-7xl mx-auto">
        {/* Left side - Visuals & Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center p-12 pr-24">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-2xl border border-white/40">
              <BookOpen className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">Arknote</span>
          </div>

          {/* Text */}
          <div>
            <h1 className="text-6xl font-black text-white mb-6 leading-[1.1] drop-shadow-2xl tracking-tight">
              Nâng tầm tri thức với <br />
              <span className="text-green-300">
                AI Tagging System
              </span>
            </h1>
            <p className="text-white/90 text-xl leading-relaxed font-medium drop-shadow-md max-w-lg">
              Hệ thống quản lý, phân tích và tìm kiếm tài liệu thông minh sử dụng trí tuệ nhân tạo. Tự động hóa quá trình phân loại và trích xuất thông tin.
            </p>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo on mobile only */}
            <div className="flex lg:hidden items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-white tracking-tight drop-shadow-lg">Arknote</span>
            </div>

            {/* Form card — uses CSS variable bg-surface which adapts to dark mode */}
            <div className="bg-surface/95 dark:bg-surface backdrop-blur-sm rounded-2xl shadow-2xl border border-border/60 dark:border-border transition-colors duration-300">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
