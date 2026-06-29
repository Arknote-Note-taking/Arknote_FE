import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FileText, Layers, Award, Loader2, Play, PlusCircle, Network, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3] dark:bg-[#C026D3]/15 dark:text-[#E879F9]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#4ADE80]';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};

const Overview = () => {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [deckCount, setDeckCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [recentDecks, setRecentDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, decksRes, quizzesRes, attemptsRes] = await Promise.all([
          API.get('/documents/stats'),
          API.get('/flashcards'),
          API.get('/quizzes'),
          API.get('/quizzes/attempts')
        ]);
        setStats(statsRes.data);
        setDeckCount(decksRes.data?.length || 0);
        setQuizCount(quizzesRes.data?.length || 0);
        setRecentAttempts(attemptsRes.data?.slice(0, 5) || []);
        setRecentDecks(decksRes.data?.slice(0, 5) || []);
      } catch (error) {
        console.error("Could not fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return language === 'vi' ? '0 giây' : '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (language === 'vi') {
      return m > 0 ? `${m}p ${s}s` : `${s}s`;
    } else {
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }
  };

  if (loading || !stats) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-[1600px] w-full mx-auto space-y-6 pb-12 animate-fadeIn">


      {/* Stats cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Documents Card */}
        <div 
          onClick={() => navigate('/documents')}
          className="border border-border bg-surface hover:border-primary/30 p-6 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <div className="space-y-1.5">
            <p className="text-text-secondary text-xs uppercase font-bold tracking-wider">{t('totalDocs')}</p>
            <p className="text-3xl font-black text-text-primary group-hover:text-primary transition-colors">{stats.totalDocs}</p>
          </div>
          <div className="p-4 bg-emerald-500/10 text-[#14b8a6] rounded-lg border border-emerald-500/10 transition-transform group-hover:scale-105">
            <FileText className="w-6 h-6 text-[#14b8a6]" />
          </div>
        </div>

        {/* Flashcard Decks Card */}
        <div 
          onClick={() => navigate('/flashcards')}
          className="border border-border bg-surface hover:border-primary/30 p-6 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <div className="space-y-1.5">
            <p className="text-text-secondary text-xs uppercase font-bold tracking-wider">{t('flashcardDecks')}</p>
            <p className="text-3xl font-black text-text-primary group-hover:text-primary transition-colors">{deckCount}</p>
          </div>
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/10 transition-transform group-hover:scale-105">
            <Layers className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        {/* Quizzes Created Card */}
        <div 
          onClick={() => navigate('/quizzes')}
          className="border border-border bg-surface hover:border-primary/30 p-6 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <div className="space-y-1.5">
            <p className="text-text-secondary text-xs uppercase font-bold tracking-wider">{t('quizzesCreated')}</p>
            <p className="text-3xl font-black text-text-primary group-hover:text-primary transition-colors">{quizCount}</p>
          </div>
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/10 transition-transform group-hover:scale-105">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown (Left 1/3) */}
        <div className="lg:col-span-1 border border-border bg-surface p-6 rounded-xl shadow-sm hover:border-primary/10 transition-all">
          <h3 className="font-extrabold text-text-primary mb-5 text-sm uppercase tracking-wider">{t('statsByCategory')}</h3>
          <div className="space-y-4">
            {stats.subjectStats.map((item, index) => {
              const percent = stats.totalDocs > 0 ? (item.count / stats.totalDocs) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold w-24 text-center shrink-0 ${getTagColor(item.subject)}`}>{item.subject}</span>
                  <div className="flex-1 mx-3 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span className="font-extrabold text-text-primary w-4 text-right">{item.count}</span>
                </div>
              )
            })}
            {stats.subjectStats.length === 0 && (
              <p className="text-text-secondary italic text-xs py-4 text-center">{language === 'vi' ? 'Chưa có dữ liệu danh mục.' : 'No category data.'}</p>
            )}
          </div>
        </div>

        {/* Recent documents table (Right 2/3) */}
        <div className="lg:col-span-2 border border-border bg-surface p-6 rounded-xl shadow-sm hover:border-primary/10 transition-all">
          <h3 className="font-extrabold text-text-primary mb-5 text-sm uppercase tracking-wider">{t('recentDocs')}</h3>
          <div className="space-y-3">
            {stats.recentDocs.map((doc, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/documents/${doc.id}`)} 
                className="flex justify-between items-center text-xs border-b border-border/40 pb-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-all"
              >
                <div className="min-w-0 pr-4">
                  <p className="font-bold text-text-primary truncate">{doc.title}</p>
                  <p className="text-text-secondary text-[10px] mt-0.5">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${getTagColor(doc.subject)}`}>{doc.subject}</span>
              </div>
            ))}
            {stats.recentDocs.length === 0 && (
              <p className="text-text-secondary italic text-xs py-10 text-center">{t('noDocs')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quiz Attempts (Left 2/3) */}
        <div className="lg:col-span-2 border border-border bg-surface p-6 rounded-xl shadow-sm hover:border-primary/10 transition-all">
          <h3 className="font-extrabold text-text-primary mb-5 text-sm uppercase tracking-wider">{t('recentAttempts')}</h3>
          <div className="space-y-3">
            {recentAttempts.map((att, idx) => {
              const quizTitle = (att.quiz?.title || (language === 'vi' ? 'Bài Quiz ôn tập' : 'Review Quiz')).replace(/^Quiz ôn tập:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '');
              const totalQuestions = att.quiz?.questions?.length || 5;
              const percent = Math.round((att.score / totalQuestions) * 100);
              return (
                <div 
                  key={idx} 
                  onClick={() => navigate(`/quizzes/${att.quiz_id}`)}
                  className="flex justify-between items-center text-xs border-b border-border/40 pb-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-all"
                >
                  <div className="min-w-0 pr-4 flex-1">
                    <p className="font-bold text-text-primary truncate">{quizTitle}</p>
                    <p className="text-text-secondary text-[10px] mt-0.5 flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-text-secondary/60" />
                      <span>{formatDuration(att.time_spent)}</span>
                      <span>•</span>
                      <span>{new Date(att.completed_at || att.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-black text-text-primary">{att.score}/{totalQuestions} {language === 'vi' ? 'câu' : 'questions'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      percent >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      percent >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
            {recentAttempts.length === 0 && (
              <p className="text-text-secondary italic text-xs py-10 text-center">{t('noAttempts')}</p>
            )}
          </div>
        </div>

        {/* Quick Actions (Right 1/3) */}
        {/* Recent Flashcards (Right 1/3) */}
        <div className="lg:col-span-1 border border-border bg-surface p-6 rounded-xl shadow-sm hover:border-primary/10 transition-all">
          <h3 className="font-extrabold text-text-primary mb-5 text-sm uppercase tracking-wider">{t('recentDecks')}</h3>
          <div className="space-y-3">
            {recentDecks.map((deck, idx) => {
              const cleanedTitle = (deck.title || (language === 'vi' ? 'Bộ thẻ ghi nhớ' : 'Flashcard Deck')).replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '');
              return (
                <div 
                  key={idx} 
                  onClick={() => navigate('/flashcards')}
                  className="flex justify-between items-center text-xs border-b border-border/40 pb-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-all"
                >
                  <div className="min-w-0 pr-2 flex-1">
                    <p className="font-bold text-text-primary truncate">{cleanedTitle}</p>
                    <p className="text-text-secondary text-[10px] mt-0.5 truncate">
                      {deck.description && !deck.description.startsWith('Tạo tự động bằng AI từ tài liệu') ? 
                        deck.description.replace('|||public', '').trim() : 
                        (language === 'vi' ? 'Không có mô tả.' : 'No description.')
                      }
                    </p>
                  </div>
                  
                  <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full shrink-0">
                    {deck.documents?.title ? 'AI Gen' : 'Custom'}
                  </span>
                </div>
              );
            })}
            {recentDecks.length === 0 && (
              <p className="text-text-secondary italic text-xs py-10 text-center">{t('noDecks')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
