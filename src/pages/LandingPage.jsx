import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, UploadCloud, FolderSearch, Network, CheckCircle, ArrowRight, Zap, Activity, Sun, Moon } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Sync dark mode toggle with localStorage / document class
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

  const steps = [
    {
      title: 'Tải tài liệu lên',
      desc: 'Hỗ trợ các định dạng PDF, Hình ảnh, Văn bản. Hệ thống tự động trích xuất nội dung OCR chính xác.',
      icon: UploadCloud,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      title: 'AI tự động phân loại',
      desc: 'AI rà soát nội dung để gán nhãn, tóm tắt và đánh dấu độ tự tin tự động hoặc theo danh mục tùy chỉnh của bạn.',
      icon: BrainCircuit,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    {
      title: 'Phân nhóm thư mục',
      desc: 'Nhóm các tài liệu có liên đới vào thư mục và thực hiện Chat AI tổng hợp ngữ nghĩa trên toàn bộ thư mục đó.',
      icon: FolderSearch,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      title: 'Knowledge Graph Map',
      desc: 'Trải nghiệm đồ thị tri thức kết nối ngữ nghĩa giữa các tài liệu bằng Cosine Similarity trực quan hóa sinh động.',
      icon: Network,
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300 flex flex-col font-sans">
      
      {/* ── 1. Header Navbar ── */}
      <header className="w-full h-18 bg-surface/90 backdrop-blur-md border-b border-border sticky top-0 z-[80] transition-colors duration-300">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-xl text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">
              Arknote
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Tính năng</a>
            <a href="#guidelines" className="hover:text-primary transition-colors">Hướng dẫn</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Nâng cấp Pro</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
              }`}
              title="Chuyển chế độ Sáng/Tối"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all flex items-center space-x-2"
              >
                <span>Vào Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="text-text-primary hover:text-primary text-sm font-bold cursor-pointer transition-colors hidden sm:block"
                >
                  Đăng nhập
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all"
                >
                  Đăng ký miễn phí
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative w-full py-20 md:py-32 overflow-hidden flex items-center justify-center border-b border-border">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 dark:bg-primary/15 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>ARKA ENGINE v2.0 - Phân Tích Bằng AI Sâu Sắc</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
            Trợ lý AI phân tích và sàng lọc <span className="text-primary">tài liệu thông minh</span> vượt trội
          </h1>

          <p className="text-text-secondary text-base md:text-xl leading-relaxed max-w-3xl mx-auto mb-10">
            Arknote giúp bạn tự động số hóa, trích xuất dữ liệu OCR, gán nhãn tags tự động và thực hiện phân tích đa chiều tài liệu bằng công nghệ Vector Embedding và OpenAI tiên tiến.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-base flex items-center justify-center space-x-2"
              >
                <span>Đi đến Bảng tổng quan</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-base"
                >
                  Trải nghiệm miễn phí ngay
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-surface border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-primary font-bold px-8 py-4 rounded-xl text-base transition-all cursor-pointer"
                >
                  Đăng nhập Workspace
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works Section ── */}
      <section id="guidelines" className="w-full py-20 bg-surface transition-colors duration-300 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">Hướng dẫn sử dụng hệ thống</h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Arknote được thiết kế tinh giản, hỗ trợ tối đa quy trình làm việc tự động hóa. Hãy khám phá 4 bước cốt lõi để nâng tầm quản trị tri thức.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div 
                key={idx}
                className="bg-background border border-border rounded-2xl p-6 hover:shadow-md dark:hover:shadow-black/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className={`p-3 rounded-xl border w-fit mb-6 group-hover:scale-110 transition-transform ${st.color}`}>
                    <st.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-text-primary mb-2 flex items-center space-x-2">
                    <span className="text-primary text-xs">0{idx + 1}.</span>
                    <span>{st.title}</span>
                  </h3>
                  <p className="text-text-secondary text-xs leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Pricing Section ── */}
      <section id="pricing" className="w-full py-20 border-b border-border relative">
        <div className="absolute top-1/2 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary tracking-wider uppercase bg-primary/10 dark:bg-primary/15 px-3 py-1 rounded-full mb-3 inline-block">Nâng Tầm Giới Hạn</span>
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">Gợi ý nâng cấp lên tài khoản PRO</h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Vượt qua mọi giới hạn về số lượng yêu cầu hàng ngày và quy mô tệp tin để khai phóng hoàn toàn sức mạnh của AI trong doanh nghiệp của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Standard Package */}
            <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Gói Căn Bản (Free)</h3>
                <p className="text-xs text-text-secondary mb-6">Trải nghiệm hệ thống OCR & Sàng lọc tags cơ bản</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-text-primary">0đ</span>
                  <span className="text-xs text-text-secondary ml-2">/ tháng vĩnh viễn</span>
                </div>
                
                <hr className="border-border mb-6" />

                <ul className="space-y-4 text-xs text-text-secondary mb-8">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Giới hạn 10 yêu cầu AI mỗi ngày</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Dung lượng tải lên tối đa 10MB/tệp</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Trích xuất OCR và gán tags tự động</span>
                  </li>
                  <li className="flex items-center space-x-2 text-text-secondary/40">
                    <CheckCircle className="w-4 h-4 shrink-0 opacity-20" />
                    <span className="line-through">AI đọc toàn bộ thư mục & tóm tắt chuyên sâu</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => user ? navigate('/dashboard') : navigate('/register')}
                className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-primary font-bold py-3 rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                {user ? 'Tiếp tục Workspace' : 'Sử dụng miễn phí'}
              </button>
            </div>

            {/* Pro Upgrade Package */}
            <div className="bg-surface border-2 border-primary rounded-3xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              {/* Premium ribbon */}
              <div className="absolute right-0 top-0 bg-primary text-white text-[10px] font-bold uppercase py-1 px-4 rounded-bl-xl tracking-wider flex items-center space-x-1">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Khuyên dùng</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Gói Chuyên Nghiệp (Pro)</h3>
                <p className="text-xs text-text-secondary mb-6">Mở khóa toàn bộ khả năng AI, không giới hạn request</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-primary">199.000đ</span>
                  <span className="text-xs text-text-secondary ml-2">/ tháng</span>
                </div>
                
                <hr className="border-border mb-6" />

                <ul className="space-y-4 text-xs text-text-primary mb-8">
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>Không giới hạn số lượt request AI hàng ngày</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>Hỗ trợ tệp tin siêu dung lượng (Tối đa 100MB)</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>Mở khóa Chat AI Thư mục tổng hợp cao cấp</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>Ưu tiên băng thông & phản hồi AI siêu tốc</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>Hỗ trợ chuyên gia 24/7 & khôi phục dữ liệu nâng cao</span>
                  </li>
                </ul>
              </div>

              <button 
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md text-center"
              >
                Nâng cấp tài khoản Pro ngay
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Footer ── */}
      <footer className="w-full bg-surface border-t border-border mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">Arknote</span>
          </div>

          <p className="text-xs text-text-secondary text-center md:text-left">
            © {new Date().getFullYear()} Arknote. Toàn bộ bản quyền được bảo hộ. Công nghệ xử lý tri thức dựa trên AI tiên tiến.
          </p>

          <div className="flex items-center space-x-6 text-xs text-text-secondary">
            <NavLink to="/terms" className="hover:text-primary transition-colors">Điều khoản</NavLink>
            <NavLink to="/privacy" className="hover:text-primary transition-colors">Bảo mật</NavLink>
            <a href="mailto:support@arknote.ai" className="hover:text-primary transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
