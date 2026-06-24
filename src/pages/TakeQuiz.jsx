import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Clock, Award, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Eye, ClipboardList, HelpCircle, ArrowUp } from 'lucide-react';

const TIME_LIMIT = 1200; // 20 minutes in seconds

const TakeQuiz = () => {
  const { id: quizId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);

  // Quiz taking states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { "0": "option", "1": "option" }
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [mode, setMode] = useState('taking'); // 'taking', 'results', 'review'

  // Modals / states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  const timerRef = useRef(null);
  const timeSpentRef = useRef(0);

  useEffect(() => {
    const mainEl = document.querySelector('main.custom-scrollbar');
    
    const handleScroll = () => {
      const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
      if (scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);

    return () => {
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mode]);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main.custom-scrollbar');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch quiz and initial attempt status
  useEffect(() => {
    if (!attemptIdParam && (!quizId || quizId === 'undefined')) {
      toast.error('Mã bài Quiz không hợp lệ.');
      navigate('/quizzes');
      return;
    }

    const loadQuizData = async () => {
      setLoading(true);
      try {
        if (attemptIdParam) {
          // Review mode for a specific attempt
          const res = await API.get(`/quizzes/attempts/${attemptIdParam}`);
          setAttempt(res.data);
          setQuiz(res.data.quiz);
          setUserAnswers(res.data.user_answers || {});
          setMode('review');
        } else {
          // Take / Resume quiz mode
          const res = await API.get(`/quizzes/${quizId}`);
          const quizData = res.data.quiz;
          setQuiz(quizData);

          if (res.data.activeAttempt) {
            // Resume existing incomplete attempt
            const active = res.data.activeAttempt;
            setAttempt(active);
            setUserAnswers(active.user_answers || {});
            setCurrentIdx(active.current_question_index || 0);

            const remaining = TIME_LIMIT - active.time_spent;
            setTimeLeft(remaining > 0 ? remaining : 0);
            timeSpentRef.current = active.time_spent;

            setMode(active.is_completed ? 'results' : 'taking');
            toast.success('Đã khôi phục tiến độ làm bài trước đó của bạn.');
          } else {
            // Start a new attempt
            const startRes = await API.post(`/quizzes/${quizId}/attempts`, { quizId });
            setAttempt(startRes.data);
            setUserAnswers({});
            setCurrentIdx(0);
            setTimeLeft(TIME_LIMIT);
            timeSpentRef.current = 0;
            setMode('taking');
          }
        }
      } catch (err) {
        toast.error('Không thể tải thông tin bài Quiz.');
        console.error(err);
        navigate('/quizzes');
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, attemptIdParam, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (mode !== 'taking' || loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        timeSpentRef.current += 1;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, loading]);

  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save progress helper (debounced or on change)
  const saveProgress = async (updatedAnswers, targetIdx = currentIdx) => {
    if (!attempt || attempt.is_completed || mode !== 'taking') return;

    setSavingProgress(true);
    try {
      await API.put(`/quizzes/attempts/${attempt.id}/progress`, {
        userAnswers: updatedAnswers,
        timeSpent: timeSpentRef.current,
        currentQuestionIndex: targetIdx
      });
    } catch (err) {
      console.error('Failed to auto-save progress:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSelectOption = (option) => {
    if (mode !== 'taking') return;

    const updated = {
      ...userAnswers,
      [currentIdx.toString()]: option
    };
    setUserAnswers(updated);
    saveProgress(updated);
  };

  const handleNavigateQuestion = (idx) => {
    if (idx < 0 || idx >= quiz.questions.length) return;
    setCurrentIdx(idx);
    saveProgress(userAnswers, idx);
  };

  const handleAutoSubmit = async () => {
    toast.error('Hết giờ làm bài! Bài làm của bạn đang được tự động nộp...');
    await submitQuiz(true);
  };

  const submitQuiz = async (isTimeout = false) => {
    if (!attempt) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setShowSubmitModal(false);
    setLoading(true);

    try {
      const res = await API.post(`/quizzes/attempts/${attempt.id}/submit`, {
        userAnswers,
        timeSpent: timeSpentRef.current
      });
      setAttempt(res.data);
      setMode('results');
      if (!isTimeout) {
        toast.success('Đã nộp bài làm của bạn thành công!');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const countUnanswered = () => {
    if (!quiz) return 0;
    let count = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (!userAnswers[i.toString()]) count++;
    }
    return count;
  };

  if (loading || !quiz) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. TAKING MODE
  if (mode === 'taking') {
    const q = quiz.questions[currentIdx];
    const progressPercent = ((currentIdx + 1) / quiz.questions.length) * 100;
    const unansweredCount = countUnanswered();

    return (
      <div className="max-w-[1200px] mx-auto pb-12">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/quizzes')}
            className="flex items-center space-x-2 text-text-secondary hover:text-text-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách Quiz</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT / CENTER COLUMN: Question Card */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm relative">

              {/* Header / Progress bar */}
              <div className="flex justify-between items-center text-xs text-text-secondary font-bold mb-4">
                <span className="uppercase text-primary tracking-wider">Bài làm Quiz AI</span>
                <span>Câu {currentIdx + 1} / {quiz.questions.length}</span>
              </div>

              <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-text-primary leading-relaxed">
                  {q.question}
                </h2>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {q.options.map((option, idx) => {
                    const isSelected = userAnswers[currentIdx.toString()] === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(option)}
                        className={`w-full text-left p-4 border rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${isSelected
                            ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary'
                            : 'border-border bg-background hover:bg-black/5 dark:hover:bg-white/5 text-text-primary'
                          }`}
                      >
                        <span>{option}</span>
                        {isSelected && <span className="text-primary font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex justify-between items-center border-t border-border mt-8 pt-6">
                <button
                  onClick={() => handleNavigateQuestion(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="flex items-center space-x-1.5 text-xs text-text-secondary hover:text-text-primary bg-background border border-border px-4 py-2.5 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                {currentIdx === quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 px-6 rounded-xl transition shadow-md shadow-primary/20 cursor-pointer"
                  >
                    Nộp bài làm
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigateQuestion(currentIdx + 1)}
                    className="flex items-center space-x-1.5 text-xs text-white bg-primary hover:bg-primary-dark px-4 py-2.5 rounded-xl font-bold transition cursor-pointer shadow-md shadow-primary/10"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Timer & Quick Grid */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timer Card */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm text-center">
              <div className="flex items-center justify-center space-x-2 text-text-secondary mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-xs uppercase font-extrabold tracking-wider">Thời gian còn lại</span>
              </div>
              <div className={`text-3xl font-black ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-text-primary'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-[10px] text-text-secondary mt-1 font-semibold">
                (Bài làm tự động nộp khi hết giờ)
              </div>
            </div>

            {/* Indicators Panel Grid */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-text-primary tracking-wider text-center border-b border-border pb-3">
                Bảng câu hỏi
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions.map((_, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = !!userAnswers[idx.toString()];

                  let btnStyle = "border-border bg-background text-text-secondary";
                  if (isAnswered) {
                    btnStyle = "bg-primary/10 border-primary/20 text-primary font-bold";
                  }
                  if (isCurrent) {
                    btnStyle = "bg-primary text-white border-primary font-black scale-105 shadow-sm";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavigateQuestion(idx)}
                      className={`h-9 w-full rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 mt-2 flex flex-col space-y-2 text-[10px] text-text-secondary font-semibold">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-primary/15 border border-primary/20 block" />
                  <span>Đã trả lời ({quiz.questions.length - unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-background border border-border block" />
                  <span>Chưa trả lời ({unansweredCount})</span>
                </div>
              </div>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-primary/20 cursor-pointer block text-center"
              >
                Nộp bài
              </button>
            </div>
          </div>

        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-text-primary mb-2">Xác nhận nộp bài?</h3>
              <p className="text-xs text-text-secondary mb-5 leading-relaxed">
                Bạn đã hoàn thành {quiz.questions.length - unansweredCount} trên tổng số {quiz.questions.length} câu hỏi.
                {unansweredCount > 0 ? (
                  <span className="text-amber-500 font-bold block mt-1">
                    ⚠️ Chú ý: Bạn còn {unansweredCount} câu chưa trả lời.
                  </span>
                ) : (
                  ' Bạn có thể nộp bài để xem kết quả đánh giá.'
                )}
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="bg-background border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Làm tiếp
                </button>
                <button
                  onClick={() => submitQuiz(false)}
                  className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-md shadow-primary/25"
                >
                  Xác nhận nộp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. RESULTS OVERVIEW MODE
  if (mode === 'results') {
    const score = attempt.score || 0;
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const duration = attempt.time_spent || 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;

    return (
      <div className="max-w-[700px] mx-auto pb-12">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center shadow-md space-y-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-text-primary">
              Hoàn thành bài trắc nghiệm ôn tập!
            </h1>
            <p className="text-sm text-text-secondary">
              Kết quả bài làm của bạn đã được ghi lại thành công vào lịch sử hệ thống.
            </p>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-3 gap-4 border-y border-border py-6 my-6">
            <div className="text-center">
              <div className="text-3xl font-black text-primary">{score}/{quiz.questions.length}</div>
              <div className="text-[10px] uppercase font-bold text-text-secondary mt-1">Số câu đúng</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-3xl font-black text-primary">{percentage}%</div>
              <div className="text-[10px] uppercase font-bold text-text-secondary mt-1">Tỷ lệ chính xác</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-primary">
                {mins > 0 ? `${mins}m${secs}s` : `${secs}s`}
              </div>
              <div className="text-[10px] uppercase font-bold text-text-secondary mt-1">Thời gian làm</div>
            </div>
          </div>

          {/* Message encouragement */}
          <div className="text-sm font-medium text-text-secondary max-w-md mx-auto leading-relaxed">
            {score === quiz.questions.length ? (
              <span className="text-emerald-500 font-extrabold">🚀 Tuyệt hảo! Bạn đã xuất sắc trả lời đúng 100% tất cả các câu hỏi. Hãy tiếp tục phát huy!</span>
            ) : score >= Math.round(quiz.questions.length * 0.75) ? (
              <span className="text-primary font-bold">✨ Rất tốt! Bạn nắm vững kiến thức từ tài liệu này. Bạn có thể xem lại chi tiết các câu sai để ghi nhớ sâu hơn.</span>
            ) : (
              <span className="text-amber-500 font-semibold">💪 Cố gắng lên! Ôn tập thường xuyên giúp ghi nhớ tốt hơn. Xem chi tiết giải thích để bổ sung các điểm thiếu nhé.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={() => setMode('review')}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-primary/20"
            >
              <Eye className="w-4 h-4" />
              <span>Xem đáp án chi tiết</span>
            </button>
            <button
              onClick={() => navigate('/quizzes')}
              className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-primary font-bold text-xs py-3 px-6 rounded-xl transition cursor-pointer"
            >
              Quay lại lịch sử Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. REVIEW MODE
  if (mode === 'review') {
    return (
      <div className="max-w-[900px] mx-auto pb-12 space-y-6">

        {/* Review Header Banner */}
        <div className="flex items-center justify-between bg-surface border border-border rounded-2xl p-5 shadow-sm shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/quizzes')}
              className="p-2 bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary rounded-xl transition cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-text-primary leading-tight">
                Chi tiết đáp án & Giải thích
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                {quiz.title} • Kết quả: <strong className="text-primary font-black">{attempt.score}/{quiz.questions.length}</strong> ({Math.round((attempt.score / quiz.questions.length) * 100)}%)
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/quizzes')}
            className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-md shadow-primary/15 cursor-pointer"
          >
            Quay lại lịch sử
          </button>
        </div>

        {/* Scrollable Questions list */}
        <div className="space-y-6">
          {quiz.questions.map((q, qIdx) => {
            const userChoice = userAnswers[qIdx.toString()];
            const isCorrect = userChoice === q.answer;
            const hasAnswered = !!userChoice;

            return (
              <div
                key={qIdx}
                className={`bg-surface border rounded-2xl p-6 md:p-8 shadow-sm space-y-4 transition ${hasAnswered
                    ? isCorrect
                      ? 'border-emerald-500/20'
                      : 'border-red-500/20'
                    : 'border-border'
                  }`}
              >

                {/* Question progress / Badge */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-secondary">
                    Câu hỏi {qIdx + 1}
                  </span>

                  <span className="flex items-center space-x-1 font-bold text-xs">
                    {hasAnswered ? (
                      isCorrect ? (
                        <span className="flex items-center space-x-1 text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5 mr-0.5 inline" />
                          Đúng
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-red-600 bg-red-500/10 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">
                          <XCircle className="w-3.5 h-3.5 mr-0.5 inline" />
                          Sai
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider">
                        Chưa trả lời
                      </span>
                    )}
                  </span>
                </div>

                {/* Question text */}
                <h3 className="font-extrabold text-text-primary text-base md:text-lg leading-relaxed">
                  {q.question}
                </h3>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((option, oIdx) => {
                    const isOptionCorrect = option === q.answer;
                    const isOptionSelected = userChoice === option;

                    let optionStyle = "border-border bg-background opacity-60 text-text-secondary";
                    if (isOptionCorrect) {
                      // Correct option is always green
                      optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold opacity-100 ring-1 ring-emerald-500/20";
                    } else if (isOptionSelected && !isCorrect) {
                      // Incorrect option selected by user is red
                      optionStyle = "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold opacity-100 ring-1 ring-red-500/20";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`w-full text-left p-3.5 border rounded-xl text-xs flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{option}</span>
                        {isOptionCorrect && <span className="text-emerald-500 font-bold">✓ Đáp án đúng</span>}
                        {isOptionSelected && !isOptionCorrect && <span className="text-red-500 font-bold">✗ Bạn chọn</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs text-text-secondary leading-relaxed mt-4">
                  <strong className="text-emerald-600 dark:text-emerald-400 block mb-1">Giải thích chi tiết:</strong>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate('/quizzes')}
            className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-3 px-8 rounded-xl transition shadow-md shadow-primary/20 cursor-pointer"
          >
            Quay lại danh sách Lịch sử Quiz
          </button>
        </div>

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
  }

  return null;
};

export default TakeQuiz;
