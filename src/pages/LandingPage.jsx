import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, UploadCloud, FolderSearch, Network, CheckCircle, ArrowRight, Zap, Activity, Sun, Moon, LogOut, ArrowUp, MessageSquare, ScanText, Shield, Target, Users, Lightbulb, Sparkles, BookOpen, Lock } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const landingTranslations = {
  vi: {
    features: 'Tính năng',
    about: 'Về chúng tôi',
    guidelines: 'Hướng dẫn',
    pricing: 'Nâng cấp Pro',
    workspace: 'Vào Workspace',
    logout: 'Đăng xuất',
    login: 'Đăng nhập',
    register: 'Đăng ký miễn phí',
    logoutSuccess: 'Đăng xuất thành công!',
    title: 'Trợ lý AI phân tích và sàng lọc tài liệu thông minh vượt trội',
    subtitle: 'Arknote giúp bạn tự động số hóa, trích xuất dữ liệu OCR, gán nhãn tags tự động và thực hiện phân tích đa chiều tài liệu bằng công nghệ Vector Embedding và OpenAI tiên tiến.',
    freeTry: 'Trải nghiệm miễn phí ngay',
    loginWorkspace: 'Đăng nhập Workspace',
    dashboard: 'Đi đến Bảng tổng quan',
    ocrAcc: 'Độ chính xác OCR',
    ocrAccDesc: 'Nhận dạng ảnh quét cực tốt',
    docsProcessed: 'Tài liệu đã xử lý',
    docsProcessedDesc: 'Đồng hành cùng tri thức Việt',
    members: 'Thành viên tin dùng',
    membersDesc: 'Học sinh, giảng viên, chuyên gia',
    aiSupport: 'AI sẵn sàng hỗ trợ',
    aiSupportDesc: 'Tốc độ phản hồi dưới 1.5 giây',
    featuresTitle: 'Mọi công cụ bạn cần để làm chủ tri thức',
    featuresSubtitle: 'Arknote tích hợp trí tuệ nhân tạo vào từng bước quy trình xử lý tài liệu — từ số hóa đến phân tích ngữ nghĩa chuyên sâu.',
    
    // Feature items
    feat1Title: 'OCR thông minh & trích xuất văn bản',
    feat1Desc: 'Tự động nhận dạng và trích xuất nội dung từ PDF, ảnh scan, hình chụp tài liệu với độ chính xác cao sử dụng mô hình Tesseract OCR tích hợp AI.',
    feat2Title: 'Gán nhãn & tóm tắt tự động bằng AI',
    feat2Desc: 'Gemini AI tự động phân tích nội dung, đề xuất tags, phân loại chủ đề và tóm tắt tài liệu chỉ trong vài giây — không cần thao tác thủ công.',
    feat3Title: 'Chat AI ngữ nghĩa với tài liệu',
    feat3Desc: 'Đặt câu hỏi tự nhiên cho hệ thống AI và nhận câu trả lời chính xác trích dẫn từ nội dung tài liệu — riêng lẻ hoặc toàn bộ thư mục.',
    feat4Title: 'Knowledge Graph & Vector Similarity',
    feat4Desc: 'Trực quan hóa mạng lưới liên kết ngữ nghĩa giữa các tài liệu qua đồ thị tri thức tương tác, dựa trên cosine similarity của vector embedding 768 chiều.',
    feat5Title: 'Quiz & Flashcard ôn tập thông minh',
    feat5Desc: 'Tự động sinh bộ câu hỏi trắc nghiệm và flashcards từ nội dung tài liệu. Theo dõi tiến trình ôn luyện qua thuật toán Spaced Repetition SM-2.',
    feat6Title: 'Bảo mật & Chia sẻ kiểm soát',
    feat6Desc: 'Hệ thống phân quyền chia sẻ thư mục hai cấp (viewer/editor) kết hợp Row Level Security của Supabase, đảm bảo dữ liệu của bạn luôn được bảo vệ tuyệt đối.',

    // About section
    aboutSpan: 'Về Arknote',
    aboutTitle: 'Được xây dựng bởi những người đam mê tri thức',
    aboutDesc1: 'Arknote ra đời từ một bài toán thực tế: tài liệu ngày càng nhiều, nhưng khả năng tiếp cận và khai thác chúng vẫn còn rất thủ công. Chúng tôi tin rằng công nghệ AI hiện đại có thể thay đổi hoàn toàn cách con người tương tác với tri thức.',
    aboutDesc2: 'Với nền tảng vector embedding, OCR thông minh và mô hình ngôn ngữ lớn (LLM), Arknote biến kho tài liệu tĩnh của bạn thành một hệ thống tri thức sống động — có thể truy vấn, phân tích và kết nối theo ngữ nghĩa theo thời gian thực.',
    mission: 'Sứ mệnh',
    missionDesc: 'Dân chủ hóa quyền truy cập tri thức thông qua AI — để mọi cá nhân và tổ chức có thể khai thác tối đa giá trị từ tài liệu của mình.',
    vision: 'Tầm nhìn',
    visionDesc: 'Trở thành nền tảng quản lý tri thức AI hàng đầu Đông Nam Á, phục vụ hàng triệu người dùng doanh nghiệp và cá nhân.',
    commitment: 'Cam kết của chúng tôi',
    commit1: 'Dữ liệu của bạn chỉ thuộc về bạn — không chia sẻ, không khai thác thương mại.',
    commit2: 'Cập nhật liên tục các mô hình AI mới nhất mà không tăng giá.',
    commit3: 'Hỗ trợ kỹ thuật phản hồi trong vòng 24 giờ.',
    commit4: 'Minh bạch về cách AI xử lý và sử dụng dữ liệu của bạn.',

    // How it works
    howItWorks: 'Hướng dẫn sử dụng hệ thống',
    howItWorksDesc: 'Arknote được thiết kế tinh giản, hỗ trợ tối đa quy trình làm việc tự động hóa. Hãy khám phá các bước cốt lõi.',
    step1Title: 'Tải tài liệu lên',
    step1Desc: 'Hỗ trợ các định dạng PDF, Hình ảnh, Văn bản. Hệ thống tự động trích xuất nội dung OCR chính xác.',
    step2Title: 'AI tự động phân loại',
    step2Desc: 'AI rà soát nội dung để gán nhãn, tóm tắt và đánh dấu độ tự tin tự động hoặc theo danh mục tùy chỉnh của bạn.',
    step3Title: 'Phân nhóm thư mục',
    step3Desc: 'Nhóm các tài liệu có liên đới vào thư mục và thực hiện Chat AI tổng hợp ngữ nghĩa trên toàn bộ thư mục đó.',
    step4Title: 'Knowledge Graph Map',
    step4Desc: 'Trải nghiệm đồ thị tri thức kết nối ngữ nghĩa giữa các tài liệu bằng Cosine Similarity trực quan hóa sinh động.',

    // Pricing
    pricingTitle: 'Gợi ý nâng cấp lên tài khoản PRO',
    freePlanTitle: 'Gói Căn Bản (Free)',
    freePlanSubtitle: 'Trải nghiệm hệ thống OCR & Sàng lọc tags cơ bản',
    freePrice: '0đ',
    freePerMonth: '/ tháng vĩnh viễn',
    freeFeature1: 'Giới hạn 10 yêu cầu AI mỗi ngày',
    freeFeature2: 'Dung lượng tải lên tối đa 10MB/tệp',
    freeFeature3: 'Trích xuất OCR và gán tags tự động',
    freeFeature4: 'AI đọc toàn bộ thư mục & tóm tắt chuyên sâu',
    freeBtnCurrent: 'Gói hiện tại (Đi tới Workspace)',
    freeBtnGo: 'Tiếp tục Workspace',
    freeBtnUse: 'Sử dụng miễn phí',
    proPlanTitle: 'Gói Chuyên Nghiệp (Pro)',
    proPlanSubtitle: 'Mở khóa toàn bộ khả năng AI, không giới hạn request',
    proPrice: '79.000đ',
    proPerMonth: '/ tháng',
    proFeature1: 'Không giới hạn số lượt request AI hàng ngày',
    proFeature2: 'Hỗ trợ tệp tin siêu dung lượng (Tối đa 100MB)',
    proFeature3: 'Mở khóa Chat AI Thư mục tổng hợp cao cấp',
    proFeature4: 'Ưu tiên băng thông & phản hồi AI siêu tốc',
    proBtnCurrent: 'Gói đang sử dụng (Vào Workspace)',
    proBtnUpgrade: 'Nâng cấp tài khoản Pro ngay',
    proBtnRecommended: 'Khuyên dùng',
    proBtnCurrentRibbon: 'GÓI HIỆN TẠI',
    activating: 'Đang kích hoạt...',

    // Footer
    footerDesc: 'Arknote. Toàn bộ bản quyền được bảo hộ. Công nghệ xử lý tri thức dựa trên AI tiên tiến.',
    terms: 'Điều khoản',
    privacy: 'Bảo mật',
    contact: 'Liên hệ',
  },
  en: {
    features: 'Features',
    about: 'About Us',
    guidelines: 'Guidelines',
    pricing: 'Upgrade Pro',
    workspace: 'Go to Workspace',
    logout: 'Logout',
    login: 'Login',
    register: 'Register Free',
    logoutSuccess: 'Logged out successfully!',
    title: 'Advanced AI Assistant for Storing & Screening Smart Documents',
    subtitle: 'Arknote helps you automatically digitize, extract OCR data, auto-tag, and perform multi-dimensional document analysis using advanced Vector Embedding and OpenAI technologies.',
    freeTry: 'Try for Free Now',
    loginWorkspace: 'Login to Workspace',
    dashboard: 'Go to Dashboard',
    ocrAcc: 'OCR Accuracy',
    ocrAccDesc: 'Excellent scanned document recognition',
    docsProcessed: 'Documents Processed',
    docsProcessedDesc: 'Accompanying Vietnamese intelligence',
    members: 'Active Members',
    membersDesc: 'Students, lecturers, and experts',
    aiSupport: 'AI Support Available',
    aiSupportDesc: 'Response time under 1.5 seconds',
    featuresTitle: 'Every Tool You Need to Master Knowledge',
    featuresSubtitle: 'Arknote integrates AI into every step of document processing — from digitization to deep semantic analysis.',
    
    // Feature items
    feat1Title: 'Smart OCR & Text Extraction',
    feat1Desc: 'Automatically recognize and extract content from PDFs, scanned images, and document captures with high accuracy using Tesseract OCR with AI filters.',
    feat2Title: 'Auto-Tagging & AI Summaries',
    feat2Desc: 'Gemini AI automatically analyzes content, suggests tags, categorizes subjects, and summarizes documents in seconds without manual work.',
    feat3Title: 'Semantic AI Chat with Documents',
    feat3Desc: 'Ask natural questions to the AI and receive accurate answers with citations from the document content — individually or across a folder.',
    feat4Title: 'Knowledge Graph & Vector Similarity',
    feat4Desc: 'Visualize semantic connection networks between documents via interactive graphs based on 768-dimensional vector embedding cosine similarity.',
    feat5Title: 'Smart Quiz & Flashcard Practice',
    feat5Desc: 'Automatically generate multiple-choice quizzes and flashcards from document content. Track study progress with Spaced Repetition SM-2.',
    feat6Title: 'Security & Controlled Sharing',
    feat6Desc: 'Two-tier folder sharing permissions (viewer/editor) combined with Supabase Row Level Security ensures your data is always protected.',

    // About section
    aboutSpan: 'About Arknote',
    aboutTitle: 'Built by Knowledge Enthusiasts',
    aboutDesc1: 'Arknote was born from a real-world problem: documents are increasing, but accessing and exploiting them remains highly manual. We believe AI can completely transform how humans interact with knowledge.',
    aboutDesc2: 'With vector embeddings, smart OCR, and large language models (LLM), Arknote turns your static document archive into a living, queryable, and semantically connected knowledge system.',
    mission: 'Our Mission',
    missionDesc: 'Democratize access to knowledge through AI — enabling every individual and organization to maximize value from their documents.',
    vision: 'Our Vision',
    visionDesc: 'Become the leading AI knowledge management platform in Southeast Asia, serving millions of business and personal users.',
    commitment: 'Our Commitment',
    commit1: 'Your data belongs only to you — no sharing, no commercial exploitation.',
    commit2: 'Continuously update the latest AI models without price increases.',
    commit3: 'Technical support response within 24 hours.',
    commit4: 'Transparent about how AI processes and uses your data.',

    // How it works
    howItWorks: 'System Usage Guidelines',
    howItWorksDesc: 'Arknote is streamlined to maximize work automation. Explore the core steps below.',
    step1Title: 'Upload Documents',
    step1Desc: 'Supports PDF, Image, and Text formats. The system automatically extracts precise OCR text.',
    step2Title: 'AI Auto-Classification',
    step2Desc: 'AI reviews content to assign tags, summarize, and score confidence automatically or based on your custom categories.',
    step3Title: 'Group into Folders',
    step3Desc: 'Group related documents into folders and perform AI Q&A across the entire folder.',
    step4Title: 'Knowledge Graph Map',
    step4Desc: 'Experience interactive knowledge maps representing document relations via Cosine Similarity.',

    // Pricing
    pricingTitle: 'Choose Your Pro Plan Upgrade',
    freePlanTitle: 'Basic Plan (Free)',
    freePlanSubtitle: 'Experience basic OCR & tag screening',
    freePrice: '$0',
    freePerMonth: '/ forever',
    freeFeature1: 'Limited to 10 AI requests daily',
    freeFeature2: 'Maximum upload size 10MB/file',
    freeFeature3: 'OCR extraction and auto-tagging',
    freeFeature4: 'AI reads folder & deep summary',
    freeBtnCurrent: 'Current Plan (Go to Workspace)',
    freeBtnGo: 'Continue to Workspace',
    freeBtnUse: 'Use for Free',
    proPlanTitle: 'Professional Plan (Pro)',
    proPlanSubtitle: 'Unlock all AI features with no daily limits',
    proPrice: '79,000 VND',
    proPerMonth: '/ month',
    proFeature1: 'Unlimited daily AI requests',
    proFeature2: 'Support large files (Up to 100MB)',
    proFeature3: 'Unlock Advanced Folder AI Q&A',
    proFeature4: 'Priority bandwidth & ultra-fast AI responses',
    proBtnCurrent: 'Current Plan (Go to Workspace)',
    proBtnUpgrade: 'Upgrade to Pro Account Now',
    proBtnRecommended: 'Recommended',
    proBtnCurrentRibbon: 'CURRENT PLAN',
    activating: 'Activating...',

    // Footer
    footerDesc: 'Arknote. All rights reserved. Powered by advanced AI knowledge processing technology.',
    terms: 'Terms',
    privacy: 'Privacy',
    contact: 'Contact',
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage } = useLanguage();
  const [upgrading, setUpgrading] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  const lt = (key) => landingTranslations[language]?.[key] || landingTranslations['vi']?.[key] || key;

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
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để thực hiện nâng cấp tài khoản Pro!' : 'Please log in to upgrade to a Pro account!');
      navigate('/login');
      return;
    }

    if (user.is_pro) {
      toast.success(language === 'vi' ? 'Tài khoản của bạn đã là PRO rồi! ✨' : 'Your account is already PRO! ✨');
      navigate('/dashboard');
      return;
    }

    setUpgrading(true);
    try {
      const res = await API.post('/payment/create-payment-link');
      if (res.data && res.data.checkoutUrl) {
        toast.success(language === 'vi' ? 'Đang kết nối cổng thanh toán PayOS...' : 'Connecting to PayOS gateway...');
        setTimeout(() => {
          window.location.href = res.data.checkoutUrl;
        }, 800);
      } else {
        throw new Error(language === 'vi' ? 'Không khởi tạo được link thanh toán' : 'Cannot initialize checkout link');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || (language === 'vi' ? 'Gặp sự cố khi kết nối hệ thống nâng cấp. Vui lòng thử lại sau.' : 'Failed to connect to the upgrade service. Please try again later.');
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

  const [statsData, setStatsData] = useState({
    usersCount: 0,
    documentsCount: 0,
    ocrAccuracy: 99.8,
    aiAvailability: "24/7"
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/public/stats');
        if (res.data) {
          setStatsData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch public stats:", err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { number: `${statsData.ocrAccuracy}%`, label: lt('ocrAcc'), desc: lt('ocrAccDesc') },
    { number: statsData.documentsCount >= 1000 ? `${(statsData.documentsCount / 1000).toFixed(1)}k+` : `${statsData.documentsCount}`, label: lt('docsProcessed'), desc: lt('docsProcessedDesc') },
    { number: statsData.usersCount >= 1000 ? `${(statsData.usersCount / 1000).toFixed(1)}k+` : `${statsData.usersCount}`, label: lt('members'), desc: lt('membersDesc') },
    { number: statsData.aiAvailability, label: lt('aiSupport'), desc: lt('aiSupportDesc') },
  ];

  const steps = [
    {
      title: lt('step1Title'),
      desc: lt('step1Desc'),
      icon: UploadCloud,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      title: lt('step2Title'),
      desc: lt('step2Desc'),
      icon: BrainCircuit,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    {
      title: lt('step3Title'),
      desc: lt('step3Desc'),
      icon: FolderSearch,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      title: lt('step4Title'),
      desc: lt('step4Desc'),
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
            title="Arknote - Home"
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
            <a href="#features" className="hover:text-primary transition-colors">{lt('features')}</a>
            <a href="#about" className="hover:text-primary transition-colors">{lt('about')}</a>
            <a href="#guidelines" className="hover:text-primary transition-colors">{lt('guidelines')}</a>
            <a href="#pricing" className="hover:text-primary transition-colors">{lt('pricing')}</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-background dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-text-primary focus:outline-none focus:border-primary cursor-pointer transition-all"
            >
              <option value="vi">VI 🇻🇳</option>
              <option value="en">EN 🇬🇧</option>
            </select>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${darkMode
                ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                }`}
              title="Light/Dark Mode Toggle"
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
                  <span>{lt('workspace')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    logout();
                    toast.success(lt('logoutSuccess'));
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center space-x-2"
                  title={lt('logout')}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{lt('logout')}</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-text-primary hover:text-primary text-sm font-bold cursor-pointer transition-colors hidden sm:block"
                >
                  {lt('login')}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all"
                >
                  {lt('register')}
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
            {lt('title').split(' tài liệu thông minh ')[0]} <span className="text-primary">{language === 'vi' ? 'tài liệu thông minh' : 'Smart Documents'}</span> {lt('title').split(' tài liệu thông minh ')[1] || lt('title').split('Smart Documents')[1] || ''}
          </h1>

          <p className="text-text-secondary text-base md:text-xl leading-relaxed max-w-3xl mx-auto mb-10">
            {lt('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-base flex items-center justify-center space-x-2"
              >
                <span>{lt('dashboard')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-base"
                >
                  {lt('freeTry')}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-surface border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-primary font-bold px-8 py-4 rounded-xl text-base transition-all cursor-pointer"
                >
                  {lt('loginWorkspace')}
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
            {stats.map((stat, idx) => (
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
              {lt('featuresTitle').split(' làm chủ tri thức ')[0]} <span className="text-primary">{language === 'vi' ? 'làm chủ tri thức' : 'Master Knowledge'}</span> {lt('featuresTitle').split(' làm chủ tri thức ')[1] || lt('featuresTitle').split('Master Knowledge')[1] || ''}
            </h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              {lt('featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ScanText,
                color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                title: lt('feat1Title'),
                desc: lt('feat1Desc')
              },
              {
                icon: BrainCircuit,
                color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                title: lt('feat2Title'),
                desc: lt('feat2Desc')
              },
              {
                icon: MessageSquare,
                color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
                title: lt('feat3Title'),
                desc: lt('feat3Desc')
              },
              {
                icon: Network,
                color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                title: lt('feat4Title'),
                desc: lt('feat4Desc')
              },
              {
                icon: BookOpen,
                color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                title: lt('feat5Title'),
                desc: lt('feat5Desc')
              },
              {
                icon: Lock,
                color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                title: lt('feat6Title'),
                desc: lt('feat6Desc')
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
                <span>{lt('aboutSpan')}</span>
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight mb-6 leading-tight">
                {lt('aboutTitle').split(' đam mê tri thức ')[0]} <span className="text-primary">{language === 'vi' ? 'đam mê tri thức' : 'Knowledge Enthusiasts'}</span> {lt('aboutTitle').split(' đam mê tri thức ')[1] || lt('aboutTitle').split('Knowledge Enthusiasts')[1] || ''}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {lt('aboutDesc1')}
              </p>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">
                {lt('aboutDesc2')}
              </p>

              <div className="space-y-4">
                {[
                  { icon: Lightbulb, title: lt('mission'), desc: lt('missionDesc') },
                  { icon: Target, title: lt('vision'), desc: lt('visionDesc') },
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
                <p className="text-xs font-extrabold text-primary uppercase tracking-wider mb-4">{lt('commitment')}</p>
                <ul className="space-y-3">
                  {[
                    lt('commit1'),
                    lt('commit2'),
                    lt('commit3'),
                    lt('commit4'),
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
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">{lt('howItWorks')}</h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              {lt('howItWorksDesc')}
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

      {/* ── 4. Pricing Section ── */}
      <section id="pricing" className="w-full py-20 border-b border-border relative">
        <div className="absolute top-1/2 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">{lt('pricingTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Standard Package */}
            <div className="bg-surface border border-border rounded-xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              {user && !user.is_pro && (
                <div className="absolute right-0 top-0 bg-[#52B788] text-white text-[9px] font-extrabold uppercase py-1.5 px-4 rounded-bl-xl tracking-wider">
                  {lt('proBtnCurrentRibbon')}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{lt('freePlanTitle')}</h3>
                <p className="text-xs text-text-secondary mb-6">{lt('freePlanSubtitle')}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-text-primary">{lt('freePrice')}</span>
                  <span className="text-xs text-text-secondary ml-2">{lt('freePerMonth')}</span>
                </div>

                <hr className="border-border mb-6" />

                <ul className="space-y-4 text-xs text-text-secondary mb-8">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lt('freeFeature1')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lt('freeFeature2')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{lt('freeFeature3')}</span>
                  </li>
                  <li className="flex items-center space-x-2 text-text-secondary/40">
                    <CheckCircle className="w-4 h-4 shrink-0 opacity-20" />
                    <span className="line-through">{lt('freeFeature4')}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => user ? navigate('/dashboard') : navigate('/register')}
                className="w-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-primary font-bold py-3 rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                {user && !user.is_pro ? lt('freeBtnCurrent') : user ? lt('freeBtnGo') : lt('freeBtnUse')}
              </button>
            </div>

            {/* Pro Upgrade Package */}
            <div className="bg-surface border-2 border-primary rounded-xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              {/* Premium ribbon */}
              {user?.is_pro ? (
                <div className="absolute right-0 top-0 bg-emerald-500 text-white text-[9px] font-extrabold uppercase py-1.5 px-4 rounded-bl-xl tracking-wider flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 animate-bounce" />
                  <span>{lt('proBtnCurrentRibbon')}</span>
                </div>
              ) : (
                <div className="absolute right-0 top-0 bg-primary text-white text-[10px] font-bold uppercase py-1 px-4 rounded-bl-xl tracking-wider flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>{lt('proBtnRecommended')}</span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">{lt('proPlanTitle')}</h3>
                <p className="text-xs text-text-secondary mb-6">{lt('proPlanSubtitle')}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-primary">{lt('proPrice')}</span>
                  <span className="text-xs text-text-secondary ml-2">{lt('proPerMonth')}</span>
                </div>

                <hr className="border-border mb-6" />

                <ul className="space-y-4 text-xs text-text-primary mb-8">
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>{lt('proFeature1')}</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>{lt('proFeature2')}</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>{lt('proFeature3')}</span>
                  </li>
                  <li className="flex items-center space-x-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>{lt('proFeature4')}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={user?.is_pro ? () => navigate('/dashboard') : handleUpgradeToPro}
                disabled={upgrading}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md text-center flex items-center justify-center space-x-2"
              >
                {upgrading ? lt('activating') : user?.is_pro ? lt('proBtnCurrent') : lt('proBtnUpgrade')}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Footer ── */}
      <footer className="w-full bg-surface border-t border-border mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div 
            onClick={scrollToTop} 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity"
            title="Scroll to Top"
          >
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">Arknote</span>
          </div>

          <p className="text-xs text-text-secondary text-center md:text-left">
            © {new Date().getFullYear()} {lt('footerDesc')}
          </p>

          <div className="flex items-center space-x-6 text-xs text-text-secondary">
            <NavLink to="/terms" className="hover:text-primary transition-colors">{lt('terms')}</NavLink>
            <NavLink to="/privacy" className="hover:text-primary transition-colors">{lt('privacy')}</NavLink>
            <a href="mailto:support@arknote.ai" className="hover:text-primary transition-colors">{lt('contact')}</a>
          </div>
        </div>
      </footer>

      {/* Floating scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[200] w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-primary/20 animate-scaleUp"
          title="Scroll to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
