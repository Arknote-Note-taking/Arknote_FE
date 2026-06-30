import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Layers, Plus, BookOpen, AlertCircle, RefreshCw, Check, ArrowLeft, ArrowRight, Eye, HelpCircle, Edit2, Trash2, Sparkles, Share2, Globe, Copy, CheckCircle, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';
import { useLanguage } from '../context/LanguageContext';

const Flashcards = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const { language, t } = useLanguage();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredDecks = decks.filter(deck =>
    deck.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredDecks.length / itemsPerPage));
  const pagedDecks = filteredDecks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingDeck, setSharingDeck] = useState(null);
  const [isPublicDeck, setIsPublicDeck] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Shared preview states
  const query = new URLSearchParams(location.search);
  const sharedDeckId = query.get('share');
  const [sharedDeck, setSharedDeck] = useState(null);
  const [sharedCards, setSharedCards] = useState([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (sharedDeckId) {
      const fetchSharedDeck = async () => {
        setSharedLoading(true);
        try {
          const res = await API.get(`/flashcards/${sharedDeckId}`);
          setSharedDeck(res.data.deck);
          setSharedCards(res.data.cards || []);
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.error || 'Không thể tải bộ thẻ chia sẻ. Bộ thẻ có thể không tồn tại hoặc chưa được bật chia sẻ công khai.');
          navigate('/flashcards', { replace: true });
        } finally {
          setSharedLoading(false);
        }
      };
      fetchSharedDeck();
    } else {
      setSharedDeck(null);
      setSharedCards([]);
    }
  }, [sharedDeckId, location.search]);

  const handleTogglePublicShare = async () => {
    if (!sharingDeck) return;
    const newIsPublic = !isPublicDeck;
    const cleanDesc = (sharingDeck.description || '').replace('|||public', '').trim();
    const targetDesc = newIsPublic ? `${cleanDesc} |||public` : cleanDesc;

    try {
      const res = await API.put(`/flashcards/${sharingDeck.id}`, {
        title: sharingDeck.title,
        description: targetDesc
      });
      setIsPublicDeck(newIsPublic);
      // Update in decks list
      setDecks(prev => prev.map(d => d.id === sharingDeck.id ? { ...d, description: targetDesc } : d));
      // Update in sharingDeck state
      setSharingDeck(prev => ({ ...prev, description: targetDesc }));
      toast.success(newIsPublic ? 'Đã bật chia sẻ công khai bộ thẻ này!' : 'Đã tắt chia sẻ công khai.');
    } catch (err) {
      toast.error('Không thể cập nhật cấu hình chia sẻ.');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/flashcards?share=${sharingDeck?.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleImportDeck = async () => {
    if (!sharedDeckId) return;
    setImporting(true);
    const toastId = toast.loading('Đang sao chép bộ thẻ vào thư viện của bạn...');
    try {
      const res = await API.post(`/flashcards/${sharedDeckId}/import`);
      toast.success('Đã lưu bộ thẻ vào thư viện của bạn! 🎉', { id: toastId });
      navigate('/flashcards', { replace: true });
      fetchDecks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra khi nhập bộ thẻ.', { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  // Selection / Review state
  const [activeDeck, setActiveDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Tab within active deck
  const [studyTab, setStudyTab] = useState('study'); // 'study' or 'manage'

  // Create / Edit Deck Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingDeck, setEditingDeck] = useState(null);

  // Card CRUD Modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [editingCard, setEditingCard] = useState(null);

  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const handleCreateQuiz = async () => {
    if (!activeDeck || cards.length === 0) return;
    setGeneratingQuiz(true);
    const toastId = toast.loading('Đang khởi tạo bài Quiz trắc nghiệm từ bộ thẻ của bạn...');
    try {
      const res = await API.post(`/flashcards/${activeDeck.id}/quiz`);

      // Async mode: job enqueued — poll status
      if (res.status === 202 && res.data.jobId) {
        const jobId = res.data.jobId;
        toast.loading('AI đang tạo Quiz trong nền...', { id: toastId });

        const poll = setInterval(async () => {
          try {
            const statusRes = await API.get(`/jobs/${jobId}/status`);
            const { status, progress } = statusRes.data;
            if (status === 'active') {
              toast.loading(`Đang tạo Quiz... ${progress || 0}%`, { id: toastId });
            }
            if (status === 'completed') {
              clearInterval(poll);
              const quiz = statusRes.data.result?.quiz;
              toast.success('Khởi tạo bài Quiz trắc nghiệm thành công!', { id: toastId });
              if (quiz?.id) navigate(`/quizzes/${quiz.id}`);
              setGeneratingQuiz(false);
            }
            if (status === 'failed') {
              clearInterval(poll);
              toast.error(statusRes.data.error || 'Không thể tạo bài Quiz lúc này.', { id: toastId });
              setGeneratingQuiz(false);
            }
          } catch {
            clearInterval(poll);
            toast.error('Lỗi kiểm tra trạng thái tạo Quiz.', { id: toastId });
            setGeneratingQuiz(false);
          }
        }, 2500);

        // Safety timeout: 3 minutes
        setTimeout(() => {
          clearInterval(poll);
          if (generatingQuiz) {
            toast.error('Quá thời gian chờ. Vui lòng thử lại.', { id: toastId });
            setGeneratingQuiz(false);
          }
        }, 180000);
        return;
      }

      // Sync mode fallback (no Redis)
      const newQuiz = res.data.quiz;
      toast.success('Khởi tạo bài Quiz trắc nghiệm thành công!', { id: toastId });
      navigate(`/quizzes/${newQuiz.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể tạo bài Quiz lúc này.', { id: toastId });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await API.get('/flashcards');
      setDecks(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải các bộ thẻ ghi nhớ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error('Vui lòng nhập tên bộ thẻ');
    try {
      if (editingDeck) {
        const res = await API.put(`/flashcards/${editingDeck.id}`, {
          title: newTitle.trim(),
          description: newDesc.trim()
        });
        toast.success('Đã cập nhật bộ thẻ thành công');
        setDecks(prev => prev.map(d => d.id === editingDeck.id ? { ...d, ...res.data } : d));
      } else {
        const res = await API.post('/flashcards', {
          title: newTitle.trim(),
          description: newDesc.trim()
        });
        toast.success('Đã tạo bộ thẻ ghi nhớ mới');
        setDecks([res.data, ...decks]);
      }
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setEditingDeck(null);
    } catch (err) {
      toast.error(editingDeck ? 'Lỗi khi cập nhật bộ thẻ.' : 'Lỗi khi tạo bộ thẻ.');
    }
  };

  const handleOpenEditModal = (deck) => {
    setEditingDeck(deck);
    setNewTitle(deck.title);
    setNewDesc(deck.description || '');
    setShowCreateModal(true);
  };

  const handleDeleteDeck = async (deckId) => {
    const isConfirmed = await confirm(
      language === 'vi'
        ? 'Bạn có chắc chắn muốn xóa bộ thẻ này không? (Toàn bộ thẻ bên trong cũng sẽ bị xóa)'
        : 'Are you sure you want to delete this card deck? (All cards inside will also be deleted)'
    );
    if (!isConfirmed) return;
    try {
      await API.delete(`/flashcards/${deckId}`);
      toast.success(language === 'vi' ? 'Đã xóa bộ thẻ thành công!' : 'Card deck deleted successfully!');
      setDecks(prev => prev.filter(d => d.id !== deckId));
    } catch (err) {
      toast.error(language === 'vi' ? 'Xóa bộ thẻ thất bại.' : 'Failed to delete card deck.');
    }
  };

  const handleSelectDeck = async (deck) => {
    try {
      const res = await API.get(`/flashcards/${deck.id}`);
      setActiveDeck(res.data.deck);
      setCards(res.data.cards || []);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setStudyTab('study');
      setReviewMode(true);
    } catch (err) {
      toast.error('Không thể tải chi tiết bộ thẻ.');
    }
  };

  const handleSubmitGrade = async (grade) => {
    const card = cards[currentCardIndex];
    try {
      await API.post('/flashcards/review', {
        cardId: card.id,
        grade
      });
      toast.success('Đã ghi nhận ôn tập!');

      // Move to next card
      if (currentCardIndex < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentCardIndex(prev => prev + 1);
        }, 150);
      } else {
        toast.success('Chúc mừng! Bạn đã hoàn thành ôn tập bộ thẻ này!');
        setReviewMode(false);
        setActiveDeck(null);
        fetchDecks();
        refreshProfile(); // Sync credits
      }
    } catch (err) {
      toast.error('Gặp lỗi khi lưu điểm ôn tập.');
    }
  };

  const handleCreateOrUpdateCard = async (e) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) {
      return toast.error('Vui lòng nhập đầy đủ mặt trước và mặt sau thẻ');
    }
    try {
      if (editingCard) {
        const res = await API.put(`/flashcards/cards/${editingCard.id}`, {
          front_text: cardFront.trim(),
          back_text: cardBack.trim()
        });
        toast.success('Đã cập nhật thẻ thành công');
        setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, ...res.data } : c));
      } else {
        const res = await API.post(`/flashcards/${activeDeck.id}/cards`, {
          front_text: cardFront.trim(),
          back_text: cardBack.trim()
        });
        toast.success('Đã thêm thẻ mới thành công');
        setCards(prev => [...prev, res.data]);
      }
      setShowCardModal(false);
      setCardFront('');
      setCardBack('');
      setEditingCard(null);
    } catch (err) {
      toast.error('Lỗi khi lưu thẻ ghi nhớ.');
    }
  };

  const handleOpenEditCard = (card) => {
    setEditingCard(card);
    setCardFront(card.front_text);
    setCardBack(card.back_text);
    setShowCardModal(true);
  };

  const handleDeleteCard = async (cardId) => {
    const isConfirmed = await confirm(
      language === 'vi'
        ? 'Bạn có chắc muốn xóa thẻ ghi nhớ này?'
        : 'Are you sure you want to delete this flashcard?'
    );
    if (!isConfirmed) return;
    try {
      await API.delete(`/flashcards/cards/${cardId}`);
      toast.success(language === 'vi' ? 'Đã xóa thẻ ghi nhớ thành công' : 'Flashcard deleted successfully');
      setCards(prev => prev.filter(c => c.id !== cardId));
      if (currentCardIndex >= cards.length - 1 && currentCardIndex > 0) {
        setCurrentCardIndex(prev => prev - 1);
      }
    } catch (err) {
      toast.error(language === 'vi' ? 'Xóa thẻ thất bại.' : 'Failed to delete card.');
    }
  };

  return (
    <div className="space-y-6">
      {sharedDeckId ? (
        sharedLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : sharedDeck ? (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/flashcards', { replace: true })}
                className="flex items-center space-x-2 text-text-secondary hover:text-text-primary text-sm font-semibold cursor-pointer transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại thư viện</span>
              </button>
              <button
                onClick={handleImportDeck}
                disabled={importing}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary to-[#52B788] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-75"
              >
                <Plus className="w-4 h-4" />
                <span>{importing ? 'Đang nhập...' : 'Lưu bộ thẻ vào thư viện'}</span>
              </button>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center space-x-3">
                <span className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                  <Layers className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-text-primary tracking-tight">{sharedDeck.title?.replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}</h2>
                  <p className="text-xs text-text-secondary">Bộ thẻ chia sẻ • {sharedCards.length} thẻ ghi nhớ</p>
                </div>
              </div>
              {sharedDeck.description && (
                <p className="text-sm text-text-secondary pl-1 border-l-2 border-primary/30 leading-relaxed">
                  {sharedDeck.description.replace('|||public', '').trim()}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pl-1">Danh sách thẻ ghi nhớ ({sharedCards.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedCards.map((card, idx) => (
                  <div key={card.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/25 transition-all duration-300">
                    <span className="absolute top-3 right-3 text-[10px] text-text-secondary/50 font-bold">#{idx + 1}</span>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Mặt trước</span>
                        <p className="text-sm text-text-primary font-semibold mt-1">{card.front_text}</p>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Mặt sau</span>
                        <p className="text-sm text-text-secondary mt-1">{card.back_text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-text-secondary">
            {language === 'vi' ? 'Không tìm thấy dữ liệu bộ thẻ chia sẻ.' : 'Shared deck data not found.'}
          </div>
        )
      ) : !reviewMode ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Search Input Bar */}
              {!loading && decks.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder={t('searchDecks')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-semibold shadow-xs"
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

              {user?.role !== 'admin' && (
                <button
                  onClick={() => { setEditingDeck(null); setNewTitle(''); setNewDesc(''); setShowCreateModal(true); }}
                  className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer shadow-md transition duration-200 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('createDeck')}</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : decks.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
              <Layers className="w-12 h-12 text-text-secondary/30 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-text-primary">{t('noDecksCreated')}</p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">{t('noDecksCreatedDesc')}</p>
              </div>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-2">
              <Search className="w-12 h-12 text-text-secondary/30 mx-auto" />
              <p className="text-sm font-bold text-text-primary">
                {language === 'vi' ? 'Không tìm thấy bộ thẻ phù hợp' : 'No matching decks found'}
              </p>
              <p className="text-xs text-text-secondary">
                {language === 'vi' ? 'Vui lòng thử lại với từ khóa khác.' : 'Please try again with another keyword.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedDecks.map(deck => (
                  <div
                    key={deck.id}
                    onClick={() => handleSelectDeck(deck)}
                    className="bg-surface border border-border rounded-xl p-5 hover:border-primary/45 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-44"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <h3 className="font-bold text-text-primary text-base group-hover:text-primary transition-colors line-clamp-1 flex-1" title={deck.title?.replace(/^Deck:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}>{deck.title?.replace(/^Deck:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}</h3>
                          {deck.description && deck.description.includes('|||public') && (
                            <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" title={language === 'vi' ? "Đang chia sẻ công khai" : "Shared publicly"} />
                          )}
                        </div>
                        {(deck.user_id === user?.id || user?.role === 'admin') && (
                          <div className="flex items-center space-x-0.5 shrink-0">
                            {deck.user_id === user?.id && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSharingDeck(deck);
                                    setIsPublicDeck(deck.description && deck.description.includes('|||public'));
                                    setShowShareModal(true);
                                  }}
                                  className="p-1 rounded text-text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                                  title={language === 'vi' ? "Chia sẻ bộ thẻ" : "Share deck"}
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenEditModal(deck); }}
                                  className="p-1 rounded text-text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                                  title={language === 'vi' ? "Sửa bộ thẻ" : "Edit deck"}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                              className="p-1 rounded text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                              title={language === 'vi' ? "Xóa bộ thẻ" : "Delete deck"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {user?.role === 'admin' && deck.users && (
                        <div className="text-[11px] text-primary font-bold line-clamp-1" title={`${deck.users.name || 'N/A'} (${deck.users.email})`}>
                          {language === 'vi' ? 'Sở hữu' : 'Owner'}: {deck.users.name || 'N/A'} ({deck.users.email})
                        </div>
                      )}
                      {deck.description && !deck.description.startsWith('Tạo tự động bằng AI từ tài liệu') ? (
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{deck.description.replace('|||public', '').trim()}</p>
                      ) : (
                        !deck.description && <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{language === 'vi' ? 'Không có mô tả.' : 'No description.'}</p>
                      )}
                    </div>
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs text-text-secondary">
                      <div className="flex items-center space-x-2 truncate max-w-[70%]">
                        <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full shrink-0">
                          {deck.documents?.title ? 'AI Gen' : 'Custom'}
                        </span>
                        {deck.documents?.title && (
                          <span className="truncate" title={deck.documents.title}>{language === 'vi' ? 'Tài liệu' : 'Document'}: {deck.documents.title}</span>
                        )}
                      </div>
                      <span className="ml-auto font-semibold flex items-center space-x-1 shrink-0 text-primary group-hover:underline">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{t('studyNow')}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8 py-2 w-full">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Trước' : 'Prev'}
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                          ? 'bg-primary text-white shadow-sm border border-primary'
                          : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {language === 'vi' ? 'Sau' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setReviewMode(false); setActiveDeck(null); }}
              className="flex items-center space-x-2 text-text-secondary hover:text-text-primary text-sm font-semibold cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}</span>
            </button>
            {cards.length > 0 && user?.role !== 'admin' && (
              <button
                onClick={handleCreateQuiz}
                disabled={generatingQuiz}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-75"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {generatingQuiz
                    ? (language === 'vi' ? 'Đang tạo bài Quiz...' : 'Generating Quiz...')
                    : (language === 'vi' ? 'Làm bài Quiz ôn tập' : 'Take Practice Quiz')
                  }
                </span>
              </button>
            )}
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-text-primary">{activeDeck?.title?.replace(/^Deck:\s*/i, '').replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}</h2>
            {activeDeck?.description && !activeDeck.description.startsWith('Tạo tự động bằng AI từ tài liệu') && (
              <p className="text-xs text-text-secondary mt-0.5">{activeDeck.description}</p>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border mt-2">
            <button
              onClick={() => setStudyTab('study')}
              className={`pb-2.5 px-4 font-bold text-xs uppercase tracking-wider transition cursor-pointer ${studyTab === 'study' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {language === 'vi' ? 'Ôn tập' : 'Study'} ({cards.length})
            </button>
            <button
              onClick={() => setStudyTab('manage')}
              className={`pb-2.5 px-4 font-bold text-xs uppercase tracking-wider transition cursor-pointer ${studyTab === 'manage' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {language === 'vi' ? 'Danh sách thẻ' : 'Cards list'} ({cards.length})
            </button>
          </div>

          {studyTab === 'study' ? (
            cards.length === 0 ? (
              <div className="border border-border rounded-xl p-12 text-center bg-surface">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold">
                  {language === 'vi' ? 'Bộ thẻ này hiện chưa có thẻ ghi nhớ nào.' : 'This deck does not contain any flashcards yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center text-xs text-text-secondary font-bold px-2">
                  <span>{language === 'vi' ? 'Tiến độ học tập' : 'Learning progress'}</span>
                  <span>{language === 'vi' ? 'Thẻ' : 'Card'} {currentCardIndex + 1} / {cards.length}</span>
                </div>

                {/* Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="perspective-1000 w-full h-80 cursor-pointer"
                >
                  <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front Side */}
                    <div className="absolute inset-0 w-full h-full bg-surface border-2 border-border/80 rounded-xl p-8 flex flex-col justify-between shadow-lg backface-hidden">
                      <div className="flex items-center space-x-2 text-primary">
                        <HelpCircle className="w-5 h-5" />
                        <span className="text-xs uppercase font-extrabold tracking-wider">{t('frontSide')}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center text-center">
                        <p className="text-lg font-bold text-text-primary leading-normal max-w-md">{cards[currentCardIndex].front_text}</p>
                      </div>
                      <div className="text-center text-xs text-text-secondary font-medium select-none">
                        {language === 'vi' ? '(Nhấp chuột để lật xem đáp án)' : '(Click to flip and view answer)'}
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 w-full h-full bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 rounded-xl p-8 flex flex-col justify-between shadow-lg rotate-y-180 backface-hidden">
                      <div className="flex items-center space-x-2 text-primary">
                        <Eye className="w-5 h-5" />
                        <span className="text-xs uppercase font-extrabold tracking-wider text-primary">{t('backSide')}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center text-center">
                        <p className="text-lg font-extrabold text-primary-dark dark:text-primary leading-normal max-w-md">{cards[currentCardIndex].back_text}</p>
                      </div>
                      <div className="text-center text-xs text-text-secondary font-medium select-none">
                        {language === 'vi' ? '(Nhấp chuột để lật lại)' : '(Click to flip back)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next and Back Buttons */}
                <div className="flex justify-between items-center gap-4 mt-4">
                  <button
                    onClick={() => {
                      if (currentCardIndex > 0) {
                        setIsFlipped(false);
                        setTimeout(() => {
                          setCurrentCardIndex(prev => prev - 1);
                        }, 150);
                      }
                    }}
                    disabled={currentCardIndex === 0}
                    className="flex-1 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-primary disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Quay lại' : 'Back'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentCardIndex < cards.length - 1) {
                        setIsFlipped(false);
                        setTimeout(() => {
                          setCurrentCardIndex(prev => prev + 1);
                        }, 150);
                      } else {
                        toast.success(language === 'vi' ? '🎉 Bạn đã học hết tất cả các thẻ trong bộ!' : '🎉 You have reviewed all cards in this deck!');
                      }
                    }}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-primary/20"
                  >
                    <span>{language === 'vi' ? 'Tiếp theo' : 'Next'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary">
                  {language === 'vi' ? 'Tất cả các thẻ trong bộ' : 'All cards in deck'}
                </h3>
                {activeDeck?.user_id === user?.id && (
                  <button
                    onClick={() => { setEditingCard(null); setCardFront(''); setCardBack(''); setShowCardModal(true); }}
                    className="flex items-center space-x-1.5 bg-[#52B788] hover:bg-[#409c71] text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Thêm thẻ mới' : 'Add new card'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {cards.map((card, idx) => (
                  <div key={card.id} className="bg-surface border border-border rounded-2xl p-4 flex justify-between items-start gap-4 hover:shadow-xs transition-shadow">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-text-secondary font-bold px-2 py-0.5 rounded-full shrink-0 mr-2 mt-0.5">#{idx + 1}</span>
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-primary break-words">
                            <span className="text-text-secondary">{language === 'vi' ? 'Hỏi' : 'Q'}:</span> {card.front_text}
                          </p>
                          <p className="text-xs text-primary font-medium break-words">
                            <span className="text-text-secondary">{language === 'vi' ? 'Đáp' : 'A'}:</span> {card.back_text}
                          </p>
                        </div>
                      </div>
                    </div>
                    {(activeDeck?.user_id === user?.id || user?.role === 'admin') && (
                      <div className="flex items-center space-x-1 shrink-0">
                        {activeDeck?.user_id === user?.id && (
                          <button
                            onClick={() => handleOpenEditCard(card)}
                            className="p-1.5 rounded text-text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                            title={language === 'vi' ? "Sửa thẻ" : "Edit card"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 rounded text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                          title={language === 'vi' ? "Xóa thẻ" : "Delete card"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {cards.length === 0 && (
                  <div className="text-center py-12 text-text-secondary text-xs italic border border-dashed border-border rounded-2xl bg-surface">
                    {language === 'vi' ? 'Chưa có thẻ ghi nhớ nào trong bộ này. Hãy thêm thẻ mới bằng nút trên!' : 'No flashcards in this deck yet. Add a new card using the button above!'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[300]">
          <div className="bg-surface border border-border w-full max-w-md p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-text-primary">
              {editingDeck
                ? (language === 'vi' ? 'Chỉnh sửa bộ thẻ ghi nhớ' : 'Edit flashcard deck')
                : (language === 'vi' ? 'Tạo bộ thẻ ghi nhớ mới' : 'Create new flashcard deck')
              }
            </h3>
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">{language === 'vi' ? 'Tên bộ thẻ' : 'Deck name'}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={language === 'vi' ? "Ví dụ: Lịch sử Đảng, Từ vựng TOEIC..." : "Example: History, TOEIC Vocabulary..."}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">{language === 'vi' ? 'Mô tả' : 'Description'}</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder={language === 'vi' ? "Mô tả bộ thẻ..." : "Deck description..."}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary text-text-primary resize-none"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingDeck(null); setNewTitle(''); setNewDesc(''); }}
                  className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold cursor-pointer hover:bg-black/5 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-primary-dark transition"
                >
                  {editingDeck ? (language === 'vi' ? 'Lưu thay đổi' : 'Save changes') : (language === 'vi' ? 'Xác nhận' : 'Confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[300]">
          <div className="bg-surface border border-border w-full max-w-md p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-text-primary">
              {editingCard ? (language === 'vi' ? 'Chỉnh sửa thẻ ghi nhớ' : 'Edit flashcard') : (language === 'vi' ? 'Thêm thẻ ghi nhớ mới' : 'Add new flashcard')}
            </h3>
            <form onSubmit={handleCreateOrUpdateCard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">{language === 'vi' ? 'Mặt trước (Câu hỏi / Khái niệm)' : 'Front side (Question / Concept)'}</label>
                <textarea
                  value={cardFront}
                  onChange={e => setCardFront(e.target.value)}
                  placeholder={language === 'vi' ? "Nhập câu hỏi ngắn hoặc thuật ngữ..." : "Enter short question or term..."}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary text-text-primary resize-none"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">{language === 'vi' ? 'Mặt sau (Câu trả lời / Định nghĩa)' : 'Back side (Answer / Definition)'}</label>
                <textarea
                  value={cardBack}
                  onChange={e => setCardBack(e.target.value)}
                  placeholder={language === 'vi' ? "Nhập câu trả lời ngắn gọn hoặc giải nghĩa..." : "Enter short answer or definition..."}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary text-text-primary resize-none"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCardModal(false); setEditingCard(null); setCardFront(''); setCardBack(''); }}
                  className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold cursor-pointer hover:bg-black/5 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-primary-dark transition"
                >
                  {language === 'vi' ? 'Lưu lại' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Deck Modal */}
      {showShareModal && sharingDeck && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[300] animate-fadeIn">
          <div className="bg-surface border border-border w-full max-w-md p-6 rounded-xl shadow-xl space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <h3 className="text-base font-extrabold text-text-primary flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-primary" />
                <span>{language === 'vi' ? 'Chia sẻ bộ thẻ Flashcard' : 'Share Flashcard Deck'}</span>
              </h3>
              <button
                onClick={() => { setShowShareModal(false); setSharingDeck(null); }}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{language === 'vi' ? 'Tên bộ thẻ' : 'Deck Name'}</p>
                <p className="text-sm font-semibold text-text-primary mt-1">{sharingDeck.title?.replace(/^Quiz:\s*/i, '').replace(/^Flashcard:\s*/i, '')}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-background border border-border rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Globe className={`w-4 h-4 ${isPublicDeck ? 'text-emerald-500 animate-pulse' : 'text-text-secondary'}`} />
                  <div>
                    <p className="text-xs font-bold text-text-primary">{language === 'vi' ? 'Cho phép chia sẻ công khai' : 'Enable public sharing'}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{language === 'vi' ? 'Bất kỳ ai có liên kết đều có thể học & nhập bộ thẻ này' : 'Anyone with the link can study & import this deck'}</p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePublicShare}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative focus:outline-none ${isPublicDeck ? 'bg-emerald-500' : 'bg-slate-400'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform duration-200 ${isPublicDeck ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {isPublicDeck && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">{language === 'vi' ? 'Liên kết chia sẻ' : 'Sharing link'}</label>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5 pl-3">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/flashcards?share=${sharingDeck.id}`}
                      className="bg-transparent text-xs text-text-primary focus:outline-none flex-1 min-w-0 font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors cursor-pointer text-xs font-bold shrink-0 flex items-center space-x-1"
                    >
                      {copiedLink ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? (language === 'vi' ? 'Đã sao chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => { setShowShareModal(false); setSharingDeck(null); }}
                className="w-full py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-primary rounded-xl text-sm font-bold cursor-pointer transition text-center"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
