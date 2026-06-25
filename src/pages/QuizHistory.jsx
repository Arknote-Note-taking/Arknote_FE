import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, ClipboardList, BookOpen, Clock, Play, Eye, RotateCcw, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const QuizHistory = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'quizzes' : 'history');
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin overview state
  const [selectedQuizForOverview, setSelectedQuizForOverview] = useState(null);
  const [quizAttemptsOverview, setQuizAttemptsOverview] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Pagination state
  const [attemptsPage, setAttemptsPage] = useState(1);
  const [quizzesPage, setQuizzesPage] = useState(1);
  const itemsPerPage = 4;

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
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa bài Quiz này? Tất cả lịch sử làm bài liên quan cũng sẽ bị xóa.');
    if (!isConfirmed) {
      return;
    }
    try {
      const toastId = toast.loading('Đang xóa bài Quiz...');
      await API.delete(`/quizzes/${quizId}`);
      toast.success('Đã xóa bài Quiz thành công.', { id: toastId });
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa bài Quiz.');
      console.error(err);
    }
  };

  const handleDeleteAttempt = async (attemptId) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa lịch sử làm bài này?');
    if (!isConfirmed) {
      return;
    }
    try {
      const toastId = toast.loading('Đang xóa lịch sử làm bài...');
      await API.delete(`/quizzes/attempts/${attemptId}`);
      toast.success('Đã xóa lịch sử làm bài thành công.', { id: toastId });
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa lịch sử làm bài.');
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

  const attemptsStartIndex = (attemptsPage - 1) * itemsPerPage;
  const paginatedAttempts = attempts.slice(attemptsStartIndex, attemptsStartIndex + itemsPerPage);
  const attemptsTotalPages = Math.ceil(attempts.length / itemsPerPage);

  const quizzesStartIndex = (quizzesPage - 1) * itemsPerPage;
  const paginatedQuizzes = quizzes.slice(quizzesStartIndex, quizzesStartIndex + itemsPerPage);
  const quizzesTotalPages = Math.ceil(quizzes.length / itemsPerPage);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            {isAdmin ? 'Quản lý bài ôn tập Quiz' : 'Lịch sử ôn tập Quiz'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isAdmin
              ? 'Xem các bài Quiz đã tạo trong hệ thống và theo dõi kết quả ôn tập tổng quan của khách hàng.'
              : 'Theo dõi quá trình ôn tập kiến thức tự động tạo từ tài liệu bằng mô hình AI của Gemini.'}
          </p>
        </div>

        <button
          onClick={() => {
            fetchData();
            toast.success('Đã cập nhật danh sách Quiz mới nhất.');
          }}
          className="flex items-center space-x-2 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-primary font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer self-start md:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-primary" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tabs Menu (Hidden for Admin) */}
      {!isAdmin && (
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 py-3 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Lịch sử làm bài</span>
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
            <span>Quizzes đã tạo</span>
            {quizzes.length > 0 && (
              <span className="bg-slate-200 dark:bg-slate-800 text-text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                {quizzes.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'history' && !isAdmin ? (
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center text-text-secondary">
              <ClipboardList className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
              <p className="font-bold text-sm text-text-primary">Chưa có lịch sử làm bài nào.</p>
              <p className="text-xs mt-1">Hãy mở một tài liệu và bấm nút "Tạo Quiz AI" để bắt đầu ôn luyện!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paginatedAttempts.map((att) => {
                const quizTitle = att.quiz?.title || 'Bài Quiz ôn tập';
                const isCompleted = att.is_completed;
                const scorePercentage = Math.round((att.score / (att.quiz?.questions?.length || 5)) * 100);

                return (
                  <div
                    key={att.id}
                    className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Đã nộp bài</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Đang làm</span>
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-text-secondary flex items-center space-x-1 font-semibold">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(att.completed_at || att.created_at)}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-text-primary text-base md:text-lg">
                        {quizTitle}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-xs text-text-secondary font-semibold">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Thời gian làm: {formatDuration(att.time_spent)}</span>
                        </span>
                        {isCompleted && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Tỷ lệ đúng: {scorePercentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {isCompleted && (
                        <div className="text-right hidden sm:block">
                          <div className="text-2xl font-black text-primary">
                            {att.score} <span className="text-xs text-text-secondary">/ {att.quiz?.questions?.length || 5} câu</span>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {isCompleted ? (
                          <button
                            onClick={() => navigate(`/quizzes/${att.quiz_id}?attemptId=${att.id}`)}
                            className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-primary font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem đáp án & giải thích</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/quizzes/${att.quiz_id}`)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Làm tiếp</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttempt(att.id);
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 p-2.5 rounded-xl transition cursor-pointer"
                          title="Xóa lịch sử"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination for attempts */}
              {attemptsTotalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8 py-2 w-full">
                  <button
                    onClick={() => setAttemptsPage(prev => Math.max(prev - 1, 1))}
                    disabled={attemptsPage === 1}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Trước
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
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.length === 0 ? (
            <div className="col-span-full bg-surface border border-border rounded-2xl p-12 text-center text-text-secondary">
              <BookOpen className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
              <p className="font-bold text-sm text-text-primary">Chưa có bài Quiz nào được tạo.</p>
              <p className="text-xs mt-1">Hãy mở một tài liệu bất kỳ và bấm nút "Tạo Quiz AI" để hệ thống tự động soạn bài tập!</p>
            </div>
          ) : (
            <>
              {paginatedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/30 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-text-primary text-base md:text-lg mb-2 line-clamp-2">
                      {quiz.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary font-semibold mb-6">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">
                        {quiz.questions?.length || 5} câu hỏi
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-text-secondary/60" />
                        <span>Tạo ngày: {new Date(quiz.created_at).toLocaleDateString('vi-VN')}</span>
                      </span>
                      {isAdmin && (
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px]">
                          Tạo bởi: {quiz.user?.name || quiz.user?.email || 'Hệ thống'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border pt-4 mt-auto">
                    {isAdmin ? (
                      <div className="flex w-full gap-2">
                        <button
                          onClick={() => handleViewOverview(quiz)}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-primary/20"
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span>Xem kết quả</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz.id);
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 p-2.5 rounded-xl transition cursor-pointer"
                          title="Xóa bài Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/quizzes/${quiz.id}`)}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-primary/20"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Làm bài</span>
                        </button>
                        <button
                          onClick={() => handleStartQuiz(quiz.id)}
                          className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary hover:text-text-primary p-2.5 rounded-xl transition cursor-pointer"
                          title="Làm lượt mới"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz.id);
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 p-2.5 rounded-xl transition cursor-pointer"
                          title="Xóa bài Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
                    Trước
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
                    Sau
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
          <div className="bg-surface border border-border rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-black text-text-primary">
                  Kết quả tổng quan
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Bài ôn tập: <span className="font-bold text-text-primary">{selectedQuizForOverview.title}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedQuizForOverview(null);
                  setQuizAttemptsOverview([]);
                }}
                className="bg-background border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary font-bold text-xs py-1.5 px-3 rounded-lg transition cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {loadingOverview ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {quizAttemptsOverview.length === 0 ? (
                  <p className="text-sm text-text-secondary italic text-center p-8">Chưa có khách hàng nào tham gia làm bài quiz này.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Khách hàng</th>
                          <th className="py-3 px-4">Trạng thái</th>
                          <th className="py-3 px-4">Điểm số</th>
                          <th className="py-3 px-4">Thời gian làm</th>
                          <th className="py-3 px-4">Thời gian nộp</th>
                          <th className="py-3 px-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {quizAttemptsOverview.map((att, index) => (
                          <tr key={att.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4 font-semibold text-text-secondary">{index + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-text-primary">{att.user?.name || 'Khách hàng'}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{att.user?.email || 'N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${att.is_completed
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                {att.is_completed ? 'Hoàn thành' : 'Đang làm'}
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
                                  const isConfirmed = await confirm('Bạn có chắc muốn xóa lịch sử làm bài này của khách hàng?');
                                  if (!isConfirmed) return;
                                  try {
                                    const toastId = toast.loading('Đang xóa...');
                                    await API.delete(`/quizzes/attempts/${att.id}`);
                                    toast.success('Đã xóa thành công', { id: toastId });
                                    const res = await API.get(`/quizzes/${selectedQuizForOverview.id}/attempts/admin`);
                                    setQuizAttemptsOverview(res.data);
                                    fetchData(true);
                                  } catch (err) {
                                    toast.error(err.response?.data?.error || 'Lỗi khi xóa');
                                    console.error(err);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded transition cursor-pointer inline-flex items-center justify-center"
                                title="Xóa lượt làm bài"
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
