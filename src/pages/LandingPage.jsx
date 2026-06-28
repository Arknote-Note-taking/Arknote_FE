import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, UploadCloud, FolderSearch, Network, CheckCircle, ArrowRight, Zap, Activity, Sun, Moon, LogOut, ArrowUp, MessageSquare, ScanText, Shield, Target, Users, Lightbulb, Sparkles, BookOpen, BarChart3, Lock, HelpCircle } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useContext(AuthContext);
  const [upgrading, setUpgrading] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpgradeToPro = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thực hiện nâng cấp tài khoản Pro!');
      navigate('/login');
      return;
    }

    if (user.is_pro) {
      toast.success('Tài khoản của bạn đã là PRO rồi! ✨');
      navigate('/dashboard');
      return;
    }

    setUpgrading(true);
    try {
      const res = await API.post('/payment/create-payment-link');
      if (res.data && res.data.checkoutUrl) {
        toast.success('Đang kết nối cổng thanh toán PayOS...');
        setTimeout(() => {
          window.location.href = res.data.checkoutUrl;
        }, 800);
      } else {
        throw new Error('Không khởi tạo được link thanh toán');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gặp sự cố khi kết nối hệ thống nâng cấp. Vui lòng thử lại sau.';
      toast.error(errorMsg);
    } finally {
      setUpgrading(false);
    }
  };

  // Handle smooth scroll to hash pricing
  useEffect(() => {
    const handleHashScroll = () => {
      if (window.location.hash === '#pricing') {
        const el = document.getElementById('pricing');
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    };
    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

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
          <div 
            onClick={() => { navigate('/'); scrollToTop(); }} 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity"
            title="Arknote - Trang chủ"
          >
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
            <a href="#about" className="hover:text-primary transition-colors">Về chúng tôi</a>
            <a href="#guidelines" className="hover:text-primary transition-colors">Hướng dẫn</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Nâng cấp Pro</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${darkMode
                ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                }`}
              title="Chuyển chế độ Sáng/Tối"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                {user.is_pro ? (
                  <span className="text-[10px] bg-amber-500 text-white font-black px-3 py-1.5 rounded-xl shadow-md shadow-amber-500/20 uppercase tracking-wider animate-pulse hidden sm:inline-block">
                    PRO
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-500 text-white font-black px-3 py-1.5 rounded-xl shadow-md shadow-slate-500/25 uppercase tracking-wider hidden sm:inline-block">
                    FREE
                  </span>
                )}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all flex items-center space-x-2"
                >
                  <span>Vào Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    logout();
                    toast.success('Đăng xuất thành công!');
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center space-x-2"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
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

      {/* ── 2b. Stats Counter Section ── */}
      <section className="w-full bg-surface/50 border-b border-border py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '99.8%', label: 'Độ chính xác OCR', desc: 'Nhận dạng ảnh quét cực tốt' },
              { number: '10M+', label: 'Tài liệu đã xử lý', desc: 'Đồng hành cùng tri thức Việt' },
              { number: '50K+', label: 'Thành viên tin dùng', desc: 'Học sinh, giảng viên, chuyên gia' },
              { number: '24/7', label: 'AI sẵn sàng hỗ trợ', desc: 'Tốc độ phản hồi dưới 1.5 giây' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1 hover:scale-105 transition-transform duration-300">
                <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">
                  {stat.number}
                </p>
                <p className="text-sm font-extrabold text-text-primary">{stat.label}</p>
                <p className="text-xs text-text-secondary">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Features Section ── */}
      <section id="features" className="w-full py-20 border-b border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight mb-4">
              Mọi công cụ bạn cần để <span className="text-primary">làm chủ tri thức</span>
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Arknote tích hợp trí tuệ nhân tạo vào từng bước quy trình xử lý tài liệu — từ số hóa đến phân tích ngữ nghĩa chuyên sâu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ScanText,
                color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                title: 'OCR thông minh & trích xuất văn bản',
                desc: 'Tự động nhận dạng và trích xuất nội dung từ PDF, ảnh scan, hình chụp tài liệu với độ chính xác cao sử dụng mô hình Tesseract OCR tích hợp AI.'
              },
              {
                icon: BrainCircuit,
                color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                title: 'Gán nhãn & tóm tắt tự động bằng AI',
                desc: 'Gemini AI tự động phân tích nội dung, đề xuất tags, phân loại chủ đề và tóm tắt tài liệu chỉ trong vài giây — không cần thao tác thủ công.'
              },
              {
                icon: MessageSquare,
                color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
                title: 'Chat AI ngữ nghĩa với tài liệu',
                desc: 'Đặt câu hỏi tự nhiên cho hệ thống AI và nhận câu trả lời chính xác trích dẫn từ nội dung tài liệu — riêng lẻ hoặc toàn bộ thư mục.'
              },
              {
                icon: Network,
                color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                title: 'Knowledge Graph & Vector Similarity',
                desc: 'Trực quan hóa mạng lưới liên kết ngữ nghĩa giữa các tài liệu qua đồ thị tri thức tương tác, dựa trên cosine similarity của vector embedding 768 chiều.'
              },
              {
                icon: BookOpen,
                color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                title: 'Quiz & Flashcard ôn tập thông minh',
                desc: 'Tự động sinh bộ câu hỏi trắc nghiệm và flashcards từ nội dung tài liệu. Theo dõi tiến trình ôn luyện qua thuật toán Spaced Repetition SM-2.'
              },
              {
                icon: Lock,
                color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                title: 'Bảo mật & Chia sẻ kiểm soát',
                desc: 'Hệ thống phân quyền chia sẻ thư mục hai cấp (viewer/editor) kết hợp Row Level Security của Supabase, đảm bảo dữ liệu của bạn luôn được bảo vệ tuyệt đối.'
              }
            ].map((feat, i) => (
              <div
                key={i}
                className="group bg-surface border border-border hover:border-primary/30 rounded-xl p-6 transition-all hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-1"
              >
                <div className={`p-3 rounded-xl border w-fit mb-5 group-hover:scale-110 transition-transform ${feat.color}`}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-text-primary mb-2">{feat.title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. About Section ── */}
      <section id="about" className="w-full py-20 bg-surface border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Mission & Story */}
            <div>
              <span className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6">
                <Users className="w-3.5 h-3.5" />
                <span>Về Arknote</span>
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight mb-6 leading-tight">
                Được xây dựng bởi những người <span className="text-primary">đam mê tri thức</span>
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                Arknote ra đời từ một bài toán thực tế: tài liệu ngày càng nhiều, nhưng khả năng tiếp cận và khai thác chúng vẫn còn rất thủ công. Chúng tôi tin rằng công nghệ AI hiện đại có thể thay đổi hoàn toàn cách con người tương tác với tri thức.
              </p>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">
                Với nền tảng vector embedding, OCR thông minh và mô hình ngôn ngữ lớn (LLM), Arknote biến kho tài liệu tĩnh của bạn thành một hệ thống tri thức sống động — có thể truy vấn, phân tích và kết nối theo ngữ nghĩa theo thời gian thực.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Lightbulb, title: 'Sứ mệnh', desc: 'Dân chủ hóa quyền truy cập tri thức thông qua AI — để mọi cá nhân và tổ chức có thể khai thác tối đa giá trị từ tài liệu của mình.' },
                  { icon: Target, title: 'Tầm nhìn', desc: 'Trở thành nền tảng quản lý tri thức AI hàng đầu Đông Nam Á, phục vụ hàng triệu người dùng doanh nghiệp và cá nhân.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-text-primary mb-1">{item.title}</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Tech Stack & Values */}
            <div className="space-y-6">

              <div className="bg-gradient-to-br from-primary/5 to-emerald-500/10 border border-primary/20 rounded-xl p-6">
                <p className="text-xs font-extrabold text-primary uppercase tracking-wider mb-4">Cam kết của chúng tôi</p>
                <ul className="space-y-3">
                  {[
                    'Dữ liệu của bạn chỉ thuộc về bạn — không chia sẻ, không khai thác thương mại.',
                    'Cập nhật liên tục các mô hình AI mới nhất mà không tăng giá.',
                    'Hỗ trợ kỹ thuật phản hồi trong vòng 24 giờ.',
                    'Minh bạch về cách AI xử lý và sử dụng dữ liệu của bạn.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-2.5 text-xs text-text-secondary">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. How It Works Section ── */}
      <section id="guidelines" className="w-full py-20 bg-surface transition-colors duration-300 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">Hướng dẫn sử dụng hệ thống</h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Arknote được thiết kế tinh giản, hỗ trợ tối đa quy trình làm việc tự động hóa. Hãy khám phá các bước cốt lõi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="bg-background border border-border rounded-xl p-6 hover:shadow-md dark:hover:shadow-black/30 transition-all group flex flex-col justify-between"
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

      {/* ── 5b. Testimonials Section ── */}
      <section className="w-full py-20 border-b border-border bg-background relative overflow-hidden animate-fadeIn">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#52B788]/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Đánh giá khách hàng</span>
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary mb-4">
              Người dùng nói gì về <span className="text-primary">Arknote AI</span>
            </h2>
            <p className="text-text-secondary text-sm">
              Xem cảm nhận từ các sinh viên, giảng viên và chuyên gia nghiên cứu đã số hóa quy trình học tập cùng chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Nguyễn Văn Minh',
                role: 'Sinh viên Y khoa - Đại học Y Dược',
                rating: 5,
                comment: 'Arknote giúp mình quét hàng ngàn trang giáo trình PDF rồi sinh câu hỏi flashcards học rất nhanh. Thuật toán Spaced Repetition thực sự hiệu quả cho kỳ thi nội trú!',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
              },
              {
                name: 'TS. Trần Thị Mai',
                role: 'Giảng viên & Nhà nghiên cứu Khoa học',
                rating: 5,
                comment: 'Đồ thị tri thức Knowledge Graph là tính năng tuyệt vời nhất. Tôi có thể nhìn thấy sợi dây liên kết ngữ nghĩa giữa hàng trăm bài báo khoa học nghiên cứu của mình.',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
              },
              {
                name: 'Lê Hoàng Long',
                role: 'Trưởng phòng Nhân sự - TechCorp',
                rating: 5,
                comment: 'Việc tổ chức các tài liệu chính sách công ty vào thư mục rồi Chat AI để tổng hợp thông tin giúp tiết kiệm 80% thời gian tra cứu cho nhân viên mới. Cực kỳ khuyên dùng!',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              }
            ].map((testi, idx) => (
              <div key={idx} className="bg-surface border border-border hover:border-primary/30 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex text-amber-500">
                    {Array.from({ length: testi.rating }).map((_, rIdx) => (
                      <span key={rIdx} className="text-base">★</span>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed italic">
                    "{testi.comment}"
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-border/50">
                  <img
                    src={testi.avatar}
                    alt={testi.name}
                    className="w-10 h-10 rounded-full object-cover border border-primary/20 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{testi.name}</h4>
                    <p className="text-[10px] text-text-secondary">{testi.role}</p>
                  </div>
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
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">Gợi ý nâng cấp lên tài khoản PRO</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Standard Package */}
            <div className="bg-surface border border-border rounded-xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              {user && !user.is_pro && (
                <div className="absolute right-0 top-0 bg-[#52B788] text-white text-[9px] font-extrabold uppercase py-1.5 px-4 rounded-bl-xl tracking-wider">
                  GÓI HIỆN TẠI
                </div>
              )}
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
                {user && !user.is_pro ? 'Gói hiện tại (Đi tới Workspace)' : user ? 'Tiếp tục Workspace' : 'Sử dụng miễn phí'}
              </button>
            </div>

            {/* Pro Upgrade Package */}
            <div className="bg-surface border-2 border-primary rounded-xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              {/* Premium ribbon */}
              {user?.is_pro ? (
                <div className="absolute right-0 top-0 bg-emerald-500 text-white text-[9px] font-extrabold uppercase py-1.5 px-4 rounded-bl-xl tracking-wider flex items-center space-x-1">
                  <Zap className="w-3 h-3 animate-bounce" />
                  <span>GÓI HIỆN TẠI</span>
                </div>
              ) : (
                <div className="absolute right-0 top-0 bg-primary text-white text-[10px] font-bold uppercase py-1 px-4 rounded-bl-xl tracking-wider flex items-center space-x-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>Khuyên dùng</span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Gói Chuyên Nghiệp (Pro)</h3>
                <p className="text-xs text-text-secondary mb-6">Mở khóa toàn bộ khả năng AI, không giới hạn request</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-primary">79.000đ</span>
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
                </ul>
              </div>

              <button
                onClick={user?.is_pro ? () => navigate('/dashboard') : handleUpgradeToPro}
                disabled={upgrading}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md text-center flex items-center justify-center space-x-2"
              >
                {upgrading ? 'Đang kích hoạt...' : user?.is_pro ? 'Gói đang sử dụng (Vào Workspace)' : 'Nâng cấp tài khoản Pro ngay'}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4b. FAQ Section ── */}
      <section className="w-full py-20 bg-surface transition-colors duration-300 border-b border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Giải đáp thắc mắc</span>
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary mb-4">
              Câu hỏi thường gặp
            </h2>
            <p className="text-text-secondary text-sm">
              Tổng hợp những câu hỏi phổ biến nhất từ người dùng về cách hoạt động của Arknote.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Hệ thống hỗ trợ những định dạng tài liệu nào?',
                a: 'Arknote hỗ trợ các tệp tài liệu văn bản phổ biến như PDF (.pdf), Microsoft Word (.docx), tệp văn bản thuần túy (.txt) và các định dạng hình ảnh (.png, .jpg, .jpeg) để quét OCR.'
              },
              {
                q: 'Độ chính xác của tính năng nhận dạng chữ viết (OCR) là bao nhiêu?',
                a: 'Với việc tích hợp các mô hình OCR tiên tiến kết hợp bộ lọc xử lý nhiễu bằng AI, Arknote có thể đạt độ chính xác lên tới 99.8% đối với tài liệu in sạch và nhận dạng tốt chữ viết tay ở mức tương đối.'
              },
              {
                q: 'Dữ liệu và tài liệu của tôi có được bảo mật không?',
                a: 'Hoàn toàn bảo mật. Dữ liệu của bạn được lưu trữ trên nền tảng Supabase với cơ chế phân quyền Row Level Security (RLS) cực kỳ nghiêm ngặt. Chỉ bạn hoặc những người được bạn chia sẻ trực tiếp quyền xem mới có thể tiếp cận tài liệu.'
              },
              {
                q: 'Làm thế nào để chia sẻ Flashcard với bạn bè?',
                a: 'Rất đơn giản! Bạn chỉ cần vào mục Flashcard, nhấp vào biểu tượng Share trên bộ thẻ muốn chia sẻ, bật "Cho phép chia sẻ công khai" và sao chép liên kết gửi cho bạn bè. Họ có thể xem trước và lưu trực tiếp bộ thẻ đó vào thư viện cá nhân của họ.'
              },
              {
                q: 'Tín dụng AI hoạt động như thế nào?',
                a: 'Mỗi lượt gọi AI để tóm tắt, trò chuyện (Chat Q&A), sinh câu hỏi Quiz hoặc Flashcards sẽ tiêu tốn 1 lượt tín dụng AI. Gói FREE được cấp 30 lượt ban đầu, trong khi gói PRO nhận 500 lượt mỗi tháng và có tốc độ phản hồi tối ưu.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left font-bold text-sm text-text-primary flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-primary text-lg font-black transition-transform duration-200">
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === idx ? 'max-h-48 border-t border-border/40' : 'max-h-0'}`}
                >
                  <p className="p-6 text-xs text-text-secondary leading-relaxed bg-surface/30">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Footer ── */}
      <footer className="w-full bg-surface border-t border-border mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div 
            onClick={scrollToTop} 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity"
            title="Cuộn lên đầu trang"
          >
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

      {/* Floating scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[200] w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-primary/20 animate-scaleUp"
          title="Cuộn lên đầu trang"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
