import React from 'react';
import { BookOpen } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div 
      className="min-h-screen w-full flex bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/auth-bg-green.png')" }}
    >
      {/* Full screen overlay for better text and form readability */}
      <div className="absolute inset-0 bg-green-950/40 backdrop-blur-[2px]"></div>

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

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
