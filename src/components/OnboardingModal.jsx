import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import {
  Sparkles, Code, BarChart3, Stethoscope, Wrench, Globe, HelpCircle,
  MessageSquare, ShieldAlert, Laptop, BookOpen, Layers, DollarSign,
  ArrowLeft, ArrowRight, FolderHeart, FileText, CheckCircle
} from 'lucide-react';

const OnboardingModal = () => {
  const { user, login } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Survey states
  const [answers, setAnswers] = useState({
    major: '',
    majorOther: '',
    usedAiBefore: '',
    aiPurpose: [],
    storagePreference: [],
    documentTypes: [],
    featureOfInterest: '',
    pricingWillingness: ''
  });

  const handleSingleSelect = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setAnswers(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleNext = () => {
    // Basic validation
    if (step === 1 && !answers.major) {
      toast.error('Vui lòng chọn ngành học của bạn!');
      return;
    }
    if (step === 1 && answers.major === 'Khác' && !answers.majorOther.trim()) {
      toast.error('Vui lòng điền tên ngành học của bạn!');
      return;
    }
    if (step === 2 && !answers.usedAiBefore) {
      toast.error('Vui lòng chọn câu trả lời!');
      return;
    }
    if (step === 3 && answers.aiPurpose.length === 0) {
      toast.error('Vui lòng chọn ít nhất một mục đích!');
      return;
    }
    if (step === 4 && answers.storagePreference.length === 0) {
      toast.error('Vui lòng chọn ít nhất một câu trả lời!');
      return;
    }
    if (step === 5 && answers.documentTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại tài liệu!');
      return;
    }
    if (step === 6 && !answers.featureOfInterest) {
      toast.error('Vui lòng chọn câu trả lời!');
      return;
    }
    if (step === 7 && !answers.pricingWillingness) {
      toast.error('Vui lòng chọn câu trả lời!');
      return;
    }

    if (step < 7) {
      setStep(prev => prev + 1);
    } else {
      submitSurvey(answers);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // Skip submits an empty or basic survey response but marks onboarding completed
    submitSurvey(null);
  };

  const submitSurvey = async (surveyAnswers) => {
    setLoading(true);
    try {
      const res = await API.post('/users/onboarding', { answers: surveyAnswers });
      if (res.data) {
        // Sync context state
        login(res.data);
        toast.success(surveyAnswers ? 'Cảm ơn bạn đã hoàn thành khảo sát! 🎉' : 'Đăng ký hoàn tất!');
      }
    } catch (err) {
      console.error('Submit onboarding survey failed:', err);
      toast.error('Có lỗi xảy ra khi lưu khảo sát. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role === 'admin' || user.onboarding_completed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 select-none">
      <div className="relative w-full max-w-xl bg-surface/95 dark:bg-slate-900/95 border border-border p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 text-text-primary">

        {/* Decorative subtle ambient lights */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        {/* Modal Top Nav */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary dark:text-emerald-400 uppercase tracking-widest">
              Khảo sát • Bước {step} / 7
            </span>
            <div className="h-1.5 w-48 bg-border/40 dark:bg-white/10 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-primary dark:from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs text-text-secondary hover:text-primary dark:hover:text-emerald-400 hover:border-primary/50 dark:hover:border-emerald-500/50 border border-border px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all font-bold flex items-center space-x-1 cursor-pointer"
            title="Bỏ qua phần khảo sát này"
          >
            <span>Bỏ qua</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-6 min-h-[300px] flex flex-col justify-center">

          {/* STEP 1: Major */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Bạn đang học ngành gì? 🎓
                </h3>
                <p className="text-xs text-text-secondary mt-1">Chọn chuyên ngành để chúng tôi tối ưu gợi ý tài liệu học tập.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Công nghệ thông tin', icon: Code },
                  { label: 'Kinh tế / Quản trị', icon: BarChart3 },
                  { label: 'Y dược / Sinh học', icon: Stethoscope },
                  { label: 'Kỹ thuật / Vật lý', icon: Wrench },
                  { label: 'Ngôn ngữ / Xã hội', icon: Globe },
                  { label: 'Khác', icon: HelpCircle },
                ].map(opt => {
                  const IconComp = opt.icon;
                  const isSelected = answers.major === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSingleSelect('major', opt.label)}
                      className={`flex items-center space-x-3 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-emerald-400' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {answers.major === 'Khác' && (
                <div className="pt-2 animate-fadeIn">
                  <input
                    type="text"
                    value={answers.majorOther}
                    onChange={(e) => handleSingleSelect('majorOther', e.target.value)}
                    placeholder="Hãy điền chuyên ngành của bạn..."
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-background dark:bg-slate-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Used AI before */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Bạn đã từng dùng công cụ AI học tập chưa?
                </h3>
                <p className="text-xs text-text-secondary mt-1">Khảo sát về mức độ làm quen của bạn với trí tuệ nhân tạo.</p>
              </div>
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Chưa từng', desc: 'Tôi chưa dùng AI để phục vụ việc học bao giờ.', icon: ShieldAlert },
                  { label: 'Đã từng dùng một vài lần', desc: 'Tôi thỉnh thoảng hỏi đáp ChatGPT hoặc tương tự.', icon: MessageSquare },
                  { label: 'Đã và đang dùng thường xuyên', desc: 'Tôi sử dụng AI hàng ngày như một người trợ lý học tập đắc lực.', icon: Sparkles }
                ].map(opt => {
                  const IconComp = opt.icon;
                  const isSelected = answers.usedAiBefore === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSingleSelect('usedAiBefore', opt.label)}
                      className={`flex items-start space-x-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer w-full ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-emerald-400' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-text-primary">{opt.label}</p>
                        <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: AI Purposes */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Bạn thường dùng AI để làm gì?
                </h3>
                <p className="text-xs text-text-secondary mt-1">Chọn mọi mục đích áp dụng của bạn (Chọn nhiều mục).</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Giải bài tập / Viết code',
                  'Tóm tắt tài liệu / Sách',
                  'Dịch thuật ngôn ngữ',
                  'Soạn thảo / Viết tiểu luận',
                  'Luyện tập ngoại ngữ',
                  'Mục đích khác'
                ].map(opt => {
                  const isSelected = answers.aiPurpose.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMultiSelect('aiPurpose', opt)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'border-primary dark:border-emerald-500 bg-primary dark:bg-emerald-500 text-white' : 'border-border bg-white dark:bg-slate-800'
                        }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Storage */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Bạn thường lưu tài liệu học ở đâu?
                </h3>
                <p className="text-xs text-text-secondary mt-1">Đâu là nơi cất giữ tài liệu học tập của bạn? (Chọn nhiều mục).</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Thư mục máy tính / ĐT',
                  'Google Drive / OneDrive',
                  'Sách vở / Bản in giấy',
                  'Lưu trên web học tập',
                  'Nơi khác'
                ].map(opt => {
                  const isSelected = answers.storagePreference.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMultiSelect('storagePreference', opt)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'border-primary dark:border-emerald-500 bg-primary dark:bg-emerald-500 text-white' : 'border-border bg-white dark:bg-slate-800'
                        }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Document types */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Bạn hay dùng loại tài liệu nào?
                </h3>
                <p className="text-xs text-text-secondary mt-1">Định dạng file tài liệu bạn tiếp xúc nhiều nhất (Chọn nhiều mục).</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Tệp PDF',
                  'Tệp Word / PPT / Excel',
                  'Hình ảnh / Ảnh chụp',
                  'Video / Audio bài giảng',
                  'Khác'
                ].map(opt => {
                  const isSelected = answers.documentTypes.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMultiSelect('documentTypes', opt)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'border-primary dark:border-emerald-500 bg-primary dark:bg-emerald-500 text-white' : 'border-border bg-white dark:bg-slate-800'
                        }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Top features */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Tính năng nào bạn quan tâm nhất?
                </h3>
                <p className="text-xs text-text-secondary mt-1">Mục tiêu sử dụng cốt lõi của bạn đối với Arknote.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { label: 'Trích xuất chữ từ ảnh/PDF (OCR)', icon: FileText },
                  { label: 'Tự động gắn tag & phân loại tài liệu', icon: Laptop },
                  { label: 'Hỏi đáp Chat AI với tài liệu', icon: MessageSquare },
                  { label: 'Đồ thị tri thức (Knowledge Graph)', icon: Layers }
                ].map(opt => {
                  const IconComp = opt.icon;
                  const isSelected = answers.featureOfInterest === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSingleSelect('featureOfInterest', opt.label)}
                      className={`flex items-center space-x-3 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer w-full ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-emerald-400' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: Willingness to pay */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight leading-snug">
                  Bạn có sẵn sàng trả phí cho thêm dung lượng/AI credits không?
                </h3>
                <p className="text-xs text-text-secondary mt-1">Điều này giúp chúng tôi khảo sát định vị gói cước.</p>
              </div>
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Có, rất sẵn sàng nếu thực sự hữu ích', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
                  { label: 'Cần cân nhắc thêm tuỳ mức giá', icon: BookOpen, color: 'text-amber-500 bg-amber-500/10' },
                  { label: 'Không, tôi chỉ muốn dùng miễn phí', icon: ShieldAlert, color: 'text-slate-500 bg-slate-500/10' }
                ].map(opt => {
                  const IconComp = opt.icon;
                  const isSelected = answers.pricingWillingness === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSingleSelect('pricingWillingness', opt.label)}
                      className={`flex items-center space-x-3.5 p-4 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer w-full ${isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-emerald-400 shadow-md shadow-primary/10'
                        : 'border-border bg-surface hover:border-text-secondary/30 dark:bg-slate-800/40 text-text-primary'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-emerald-400' : opt.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Nav */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs text-text-secondary hover:text-text-primary transition-all font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>{step === 7 ? (loading ? 'Đang hoàn tất...' : 'Hoàn tất') : 'Tiếp tục'}</span>
            {step < 7 && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
