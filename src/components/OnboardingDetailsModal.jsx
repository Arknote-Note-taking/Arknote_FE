import React from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  FileText,
  Database,
  Layers,
  DollarSign,
  User,
  Mail,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OnboardingDetailsModal = ({ isOpen, onClose, user }) => {
  const { language } = useLanguage();

  if (!isOpen || !user) return null;

  const answers = user.onboarding_answers;

  // Formatting date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const questions = [
    {
      id: 'major',
      icon: GraduationCap,
      labelVi: 'Ngành học của bạn là gì?',
      labelEn: 'What is your major?',
      value: answers ? (
        answers.major === 'Khác' && answers.majorOther
          ? `${language === 'vi' ? 'Khác' : 'Other'} (${answers.majorOther})`
          : answers.major
      ) : null
    },
    {
      id: 'usedAiBefore',
      icon: Sparkles,
      labelVi: 'Đã từng dùng công cụ AI học tập chưa?',
      labelEn: 'Have you used AI tools for learning before?',
      value: answers ? answers.usedAiBefore : null
    },
    {
      id: 'aiPurpose',
      icon: FileText,
      labelVi: 'Bạn thường dùng AI để làm gì?',
      labelEn: 'What do you usually use AI for?',
      isMulti: true,
      value: answers ? answers.aiPurpose : []
    },
    {
      id: 'storagePreference',
      icon: Database,
      labelVi: 'Bạn thường lưu tài liệu học ở đâu?',
      labelEn: 'Where do you usually store study materials?',
      isMulti: true,
      value: answers ? answers.storagePreference : []
    },
    {
      id: 'documentTypes',
      icon: Layers,
      labelVi: 'Bạn hay dùng loại tài liệu nào?',
      labelEn: 'Which document types do you use most?',
      isMulti: true,
      value: answers ? answers.documentTypes : []
    },
    {
      id: 'featureOfInterest',
      icon: Sparkles,
      labelVi: 'Tính năng nào bạn quan tâm nhất?',
      labelEn: 'Which feature interests you the most?',
      value: answers ? answers.featureOfInterest : null
    },
    {
      id: 'pricingWillingness',
      icon: DollarSign,
      labelVi: 'Có sẵn sàng trả phí cho tính năng Premium không?',
      labelEn: 'Are you willing to pay for premium features?',
      value: answers ? answers.pricingWillingness : null
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-2xl overflow-hidden transition-all my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-primary/10 to-transparent blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-border/60 px-6 py-4.5 bg-background/50 dark:bg-slate-950/20">
          <div>
            <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'vi' ? 'Kết quả khảo sát' : 'Survey Results'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {language === 'vi' ? 'Dữ liệu thu thập khi người dùng hoàn thành khảo sát' : 'Data collected from user survey'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Quick Info */}
        <div className="bg-background/80 dark:bg-slate-950/40 px-6 py-4 border-b border-border/50 flex flex-wrap gap-x-6 gap-y-2.5 text-xs text-text-secondary">
          <div className="flex items-center gap-2 min-w-[180px]">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-text-primary">{user.name || (language === 'vi' ? 'Chưa đặt tên' : 'No Name')}</span>
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="text-text-primary">{user.email}</span>
          </div>
          {user.created_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{formatDate(user.created_at)}</span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {!answers ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <Sparkles className="w-12 h-12 opacity-20 mb-3 text-primary animate-pulse" />
              <p className="font-semibold text-sm">
                {language === 'vi' ? 'Người dùng đã bỏ qua khảo sát này' : 'The user skipped this survey'}
              </p>
              <p className="text-xs mt-1">
                {language === 'vi' ? 'Không có câu trả lời chi tiết nào được lưu trữ.' : 'No detailed answers were saved.'}
              </p>
            </div>
          ) : (
            questions.map((q) => {
              const IconComponent = q.icon;
              return (
                <div
                  key={q.id}
                  className="group relative border border-border/55 hover:border-primary/30 p-4.5 rounded-xl bg-background/30 dark:bg-slate-800/10 transition-all duration-300"
                >
                  <div className="flex gap-3.5">
                    {/* Icon Card */}
                    <div className="p-2 h-10 w-10 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 text-primary flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <h4 className="text-xs font-bold text-text-primary leading-tight">
                        {language === 'vi' ? q.labelVi : q.labelEn}
                      </h4>

                      {q.isMulti ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Array.isArray(q.value) && q.value.length > 0 ? (
                            q.value.map((val, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8] border border-[#0284C7]/10"
                              >
                                {val}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-text-secondary">
                              {language === 'vi' ? 'Không chọn mục nào' : 'None selected'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-text-secondary bg-surface/60 dark:bg-slate-850/60 p-2.5 rounded-lg border border-border/40 inline-block min-w-[200px]">
                          {q.value || (language === 'vi' ? 'Chưa trả lời' : 'Unanswered')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-6 py-4 bg-background/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4.5 py-2.5 text-xs font-bold text-text-primary bg-background border border-border hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDetailsModal;
