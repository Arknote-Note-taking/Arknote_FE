import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, ClipboardList, BookOpen, Clock, Play, Eye, RotateCcw, Calendar, CheckCircle, AlertCircle, Trash2, Search, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useLanguage } from '../context/LanguageContext';

const QuizHistory = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'quizzes' : 'history');
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin overview state
  const [selectedQuizForOverview, setSelectedQuizForOverview] = useState(null);
  const [quizAttemptsOverview, setQuizAttemptsOverview] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Pagination state
  const [attemptsPage, setAttemptsPage] = useState(1);
  const [quizzesPage, setQuizzesPage] = useState(1);
  const itemsPerPage = 12;

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (user?.role === 'admin') {
        const quizzesRes = await API.get('/quizzes');
        setQuizzes(quizzesRes.data);
      } else {
        const [quizzesRes, attemptsRes] = await Promise.all([
          API.get('/quizzes'),
          API.get('/quizzes/attempts')
        ]);
        setQuizzes(quizzesRes.data);
        setAttempts(attemptsRes.data);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách lịch sử Quiz.');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      setActiveTab('quizzes');
    }
  }, [user]);

  useEffect(() => {
    setAttemptsPage(1);
    setQuizzesPage(1);
    setSearchQuery('');
  }, [activeTab]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0 giây';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} phút ${secs} giây`;
    }
    return `${secs} giây`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartQuiz = async (quizId) => {
    try {
      const toastId = toast.loading('Đang khởi tạo lượt làm bài...');
      const res = await API.post(`/quizzes/${quizId}/attempts`, { quizId, forceNew: true });
      toast.dismiss(toastId);
      navigate(`/quizzes/${quizId}`);
    } catch (err) {
      toast.error('Không thể bắt đầu làm bài Quiz.');
      console.error(err);
    }
  };

  const handleViewOverview = async (quiz) => {
    setSelectedQuizForOverview(quiz);
    setLoadingOverview(true);
    try {
      const res = await API.get(`/quizzes/${quiz.id}/attempts/admin`);
      setQuizAttemptsOverview(res.data);
    } catch (err) {
      toast.error('Không thể tải bảng kết quả tổng quan.');
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const isConfirmed = await confirm(
      language === 'vi' 
        ? 'Bạn có chắc chắn muốn xóa bài Quiz này? Tất cả lịch sử làm bài liên quan cũng sẽ bị xóa.' 
        : 'Are you sure you want to delete this quiz? All related quiz attempts will also be deleted.'
    );
    if (!isConfirmed) {
      return;
    }
    try {
      const toastId = toast.loading(language === 'vi' ? 'Đang xóa bài Quiz...' : 'Deleting quiz...');
      await API.delete(`/quizzes/${quizId}`);
      toast.success(language === 'vi' ? 'Đã xóa bài Quiz thành công.' : 'Quiz deleted successfully.', { id: toastId });
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'vi' ? 'Không thể xóa bài Quiz.' : 'Failed to delete quiz.'));
      console.error(err);
    }
  };

  const handleDeleteAttempt = async (attemptId) => {
    const isConfirmed = await confirm(
      language === 'vi' 
        ? 'Bạn có chắc chắn muốn xóa lịch sử làm bài này?' 
        : 'Are you sure you want to delete this quiz attempt history?'
    );
    if (!isConfirmed) {
      return;
    }
    try {
      const toastId = toast.loading(language === 'vi' ? 'Đang xóa lịch sử làm bài...' : 'Deleting attempt history...');
      await API.delete(`/quizzes/attempts/${attemptId}`);
      toast.success(language === 'vi' ? 'Đã xóa lịch sử làm bài thành công.' : 'Attempt history deleted successfully.', { id: toastId });
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'vi' ? 'Không thể xóa lịch sử làm bài.' : 'Failed to delete attempt history.'));
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAttempts = attempts.filter(att => {
    const quizTitle = att.quiz?.title || 'Bài Quiz ôn tập';
    return quizTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const attemptsStartIndex = (attemptsPage - 1) * itemsPerPage;
  const paginatedAttempts = filteredAttempts.slice(attemptsStartIndex, attemptsStartIndex + itemsPerPage);
  const attemptsTotalPages = Math.ceil(filteredAttempts.length / itemsPerPage);

  const quizzesStartIndex = (quizzesPage - 1) * itemsPerPage;
  const paginatedQuizzes = filteredQuizzes.slice(quizzesStartIndex, quizzesStartIndex + itemsPerPage);
  const quizzesTotalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-[1600px] w-full mx-auto pb-12">
      {/* Tabs & Actions Menu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border mb-6 gap-4">
        {!isAdmin ? (
          <div className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 py-3 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{language === 'vi' ? 'Lịch sử làm bài' : 'Attempt History'}</span>
              {attempts.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                  {attempts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center space-x-2 py-3 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'quizzes'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'vi' ? 'Quizzes đã tạo' : 'Created Quizzes'}</span>
              {quizzes.length > 0 && (
                <span className="bg-slate-200 dark:bg-slate-800 text-text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                  {quizzes.length}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
          {/* Search Input Bar */}
          {!loading && ((activeTab === 'history' && attempts.length > 0) || (activeTab === 'quizzes' && quizzes.length > 0)) && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder={activeTab === 'history' ? (language === 'vi' ? "Tìm lịch sử..." : "Search history...") : (language === 'vi' ? "Tìm Quiz..." : "Search Quiz...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-semibold shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              fetchData();
              toast.success(language === 'vi' ? 'Đã cập nhật danh sách Quiz mới nhất.' : 'Latest quiz list updated.');
            }}
            className="flex items-center justify-center space-x-2 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-primary font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
            <span>{language === 'vi' ? 'Làm mới' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'history' && !isAdmin ? (
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
              <ClipboardList className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
              <p className="font-bold text-sm text-text-primary">{language === 'vi' ? 'Chưa có lịch sử làm bài nào.' : 'No attempt history found.'}</p>
              <p className="text-xs mt-1">{language === 'vi' ? 'Hãy mở một tài liệu và bấm nút "Tạo Quiz AI" để bắt đầu ôn luyện!' : 'Open a document and click "Create AI Quiz" to start practicing!'}</p>
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary space-y-2">
              <Search className="w-12 h-12 text-text-secondary/30 mx-auto" />
              <p className="text-sm font-bold text-text-primary">{language === 'vi' ? 'Không tìm thấy lịch sử phù hợp' : 'No matching history found'}</p>
              <p className="text-xs text-text-secondary">{language === 'vi' ? 'Vui lòng thử lại với từ khóa khác.' : 'Please try again with another keyword.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAttempts.map((att) => {
                const quizTitle = (att.quiz?.title || 'Bài Quiz ôn tập').replace(/^Quiz ôn tập:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '');
                const isCompleted = att.is_completed;
                const scorePercentage = Math.round((att.score / (att.quiz?.questions?.length || 5)) * 100);

                return (
                  <div
                    key={att.id}
                    onClick={() => {
                      if (isCompleted) {
                        navigate(`/quizzes/${att.quiz_id}?attemptId=${att.id}`);
                      } else {
                        navigate(`/quizzes/${att.quiz_id}`);
                      }
                    }}
                    className="bg-surface border border-border rounded-xl p-5 hover:border-primary/45 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-44"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <h3 className="font-bold text-text-primary text-base group-hover:text-primary transition-colors line-clamp-1 flex-1" title={quizTitle}>
                            {quizTitle}
                          </h3>
                        </div>
                        
                        {/* Action buttons on the top-right matching Flashcard edit/delete buttons */}
                        <div className="flex items-center space-x-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteAttempt(att.id)}
                            className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                            title={language === 'vi' ? "Xóa lượt làm này" : "Delete this attempt"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle metrics section matching Flashcard description */}
                      <div className="space-y-1 text-xs text-text-secondary">
                        <p className="line-clamp-1">
                          {language === 'vi' ? 'Điểm số' : 'Score'}: <span className="font-bold text-text-primary">{att.score}/{att.quiz?.questions?.length || 5} {language === 'vi' ? 'câu' : 'questions'}</span> ({scorePercentage}%)
                        </p>
                        <p className="line-clamp-1">
                          {language === 'vi' ? 'Thời gian làm' : 'Duration'}: {formatDuration(att.time_spent)}
                        </p>
                      </div>
                    </div>

                    {/* Footer section matching Flashcard footer */}
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs text-text-secondary">
                      <div className="flex items-center space-x-2 truncate max-w-[70%]">
                        <span
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                        >
                          {isCompleted 
                            ? (language === 'vi' ? 'Hoàn thành' : 'Completed') 
                            : (language === 'vi' ? 'Đang làm' : 'In Progress')
                          }
                        </span>
                        <span className="text-[10px] text-text-secondary truncate">
                          {formatDate(att.completed_at || att.created_at)}
                        </span>
                      </div>
                      
                      <span className="ml-auto font-semibold flex items-center space-x-1 shrink-0 text-primary group-hover:underline">
                        {isCompleted ? <Eye className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>
                          {isCompleted 
                            ? (language === 'vi' ? 'Xem kết quả' : 'View Results') 
                            : (language === 'vi' ? 'Làm tiếp' : 'Continue')
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pagination for attempts */}
              {attemptsTotalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8 py-2 w-full col-span-full">
                  <button
                    onClick={() => setAttemptsPage(prev => Math.max(prev - 1, 1))}
                    disabled={attemptsPage === 1}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Trước' : 'Prev'}
                  </button>

                  {[...Array(attemptsTotalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setAttemptsPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${attemptsPage === pageNum
                          ? 'bg-primary text-white shadow-sm border border-primary'
                          : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setAttemptsPage(prev => Math.min(prev + 1, attemptsTotalPages))}
                    disabled={attemptsPage === attemptsTotalPages}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Sau' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.length === 0 ? (
            <div className="col-span-full bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
              <BookOpen className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
              <p className="font-bold text-sm text-text-primary">{language === 'vi' ? 'Chưa có bài Quiz nào được tạo.' : 'No quizzes created yet.'}</p>
              <p className="text-xs mt-1">{language === 'vi' ? 'Hãy mở một tài liệu bất kỳ và bấm nút "Tạo Quiz AI" để hệ thống tự động soạn bài tập!' : 'Open any document and click "Create AI Quiz" to have the system generate exercises!'}</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="col-span-full bg-surface border border-border rounded-xl p-12 text-center text-text-secondary space-y-2">
              <Search className="w-12 h-12 text-text-secondary/30 mx-auto" />
              <p className="text-sm font-bold text-text-primary">{language === 'vi' ? 'Không tìm thấy Quiz phù hợp' : 'No matching Quiz found'}</p>
              <p className="text-xs text-text-secondary">{language === 'vi' ? 'Vui lòng thử lại với từ khóa khác.' : 'Please try again with another keyword.'}</p>
            </div>
          ) : (
            <>
              {paginatedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => {
                    if (isAdmin) {
                      handleViewOverview(quiz);
                    } else {
                      navigate(`/quizzes/${quiz.id}`);
                    }
                  }}
                  className="bg-surface border border-border rounded-xl p-5 hover:border-primary/45 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-44"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary text-base group-hover:text-primary transition-colors line-clamp-1 flex-1" title={quiz.title?.replace(/^Quiz ôn tập:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}>
                          {quiz.title?.replace(/^Quiz ôn tập:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}
                        </h3>
                      </div>
                      
                      {/* Action buttons on the top-right matching Flashcard edit/delete buttons */}
                      <div className="flex items-center space-x-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {!isAdmin && (
                          <button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="p-1 rounded text-text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                            title={language === 'vi' ? "Làm lượt mới" : "Take new attempt"}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                          title={language === 'vi' ? "Xóa bài Quiz" : "Delete Quiz"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle section matching Flashcard description */}
                    <div className="space-y-1">
                      <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
                        {language === 'vi' ? 'Tạo ngày' : 'Created date'}: {new Date(quiz.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-primary font-bold line-clamp-1 leading-relaxed">
                          {language === 'vi' ? 'Tạo bởi' : 'Created by'}: {quiz.user?.name || quiz.user?.email || (language === 'vi' ? 'Hệ thống' : 'System')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer section matching Flashcard footer */}
                  <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs text-text-secondary">
                    <div className="flex items-center space-x-2 truncate max-w-[70%]">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full shrink-0">
                        {quiz.questions?.length || 5} {language === 'vi' ? 'câu hỏi' : 'questions'}
                      </span>
                    </div>
                    
                    <span className="ml-auto font-semibold flex items-center space-x-1 shrink-0 text-primary group-hover:underline">
                      <Play className="w-3.5 h-3.5" />
                      <span>{isAdmin ? (language === 'vi' ? 'Xem kết quả' : 'View Results') : (language === 'vi' ? 'Làm bài' : 'Start Quiz')}</span>
                    </span>
                  </div>
                </div>
              ))}

              {/* Pagination for quizzes */}
              {quizzesTotalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8 py-2 col-span-full">
                  <button
                    onClick={() => setQuizzesPage(prev => Math.max(prev - 1, 1))}
                    disabled={quizzesPage === 1}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Trước' : 'Prev'}
                  </button>

                  {[...Array(quizzesTotalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setQuizzesPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${quizzesPage === pageNum
                          ? 'bg-primary text-white shadow-sm border border-primary'
                          : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setQuizzesPage(prev => Math.min(prev + 1, quizzesTotalPages))}
                    disabled={quizzesPage === quizzesTotalPages}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Sau' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Admin overview modal */}
      {isAdmin && selectedQuizForOverview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-4xl w-full p-6 md:p-8 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-black text-text-primary">
                  {language === 'vi' ? 'Kết quả tổng quan' : 'Overview Results'}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {language === 'vi' ? 'Bài ôn tập' : 'Practice Test'}: <span className="font-bold text-text-primary">{selectedQuizForOverview.title}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedQuizForOverview(null);
                  setQuizAttemptsOverview([]);
                }}
                className="bg-background border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary font-bold text-xs py-1.5 px-3 rounded-lg transition cursor-pointer"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>

            {loadingOverview ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {quizAttemptsOverview.length === 0 ? (
                  <p className="text-sm text-text-secondary italic text-center p-8">
                    {language === 'vi' ? 'Chưa có khách hàng nào tham gia làm bài quiz này.' : 'No users have taken this quiz yet.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">{language === 'vi' ? 'Khách hàng' : 'User'}</th>
                          <th className="py-3 px-4">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                          <th className="py-3 px-4">{language === 'vi' ? 'Điểm số' : 'Score'}</th>
                          <th className="py-3 px-4">{language === 'vi' ? 'Thời gian làm' : 'Duration'}</th>
                          <th className="py-3 px-4">{language === 'vi' ? 'Thời gian nộp' : 'Submitted At'}</th>
                          <th className="py-3 px-4 text-center">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {quizAttemptsOverview.map((att, index) => (
                          <tr key={att.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-semibold text-text-secondary">{index + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-text-primary">{att.user?.name || (language === 'vi' ? 'Khách hàng' : 'User')}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{att.user?.email || 'N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${att.is_completed
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                {att.is_completed 
                                  ? (language === 'vi' ? 'Hoàn thành' : 'Completed') 
                                  : (language === 'vi' ? 'Đang làm' : 'In Progress')
                                }
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-black text-sm text-primary">
                              {att.score} / {selectedQuizForOverview.questions?.length || 5}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-text-secondary">
                              {formatDuration(att.time_spent)}
                            </td>
                            <td className="py-3.5 px-4 text-text-secondary font-semibold">
                              {formatDate(att.completed_at || att.created_at)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const isConfirmed = await confirm(language === 'vi' ? 'Bạn có chắc muốn xóa lịch sử làm bài này của khách hàng?' : 'Are you sure you want to delete this user attempt history?');
                                  if (!isConfirmed) return;
                                  try {
                                    const toastId = toast.loading(language === 'vi' ? 'Đang xóa...' : 'Deleting...');
                                    await API.delete(`/quizzes/attempts/${att.id}`);
                                    toast.success(language === 'vi' ? 'Đã xóa thành công' : 'Deleted successfully', { id: toastId });
                                    const res = await API.get(`/quizzes/${selectedQuizForOverview.id}/attempts/admin`);
                                    setQuizAttemptsOverview(res.data);
                                    fetchData(true);
                                  } catch (err) {
                                    toast.error(err.response?.data?.error || (language === 'vi' ? 'Lỗi khi xóa' : 'Error deleting'));
                                    console.error(err);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded transition cursor-pointer inline-flex items-center justify-center"
                                title={language === 'vi' ? "Xóa lượt làm bài" : "Delete attempt"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
