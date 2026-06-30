import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Link as LinkIcon, Trash2, Send, Sparkles, BookOpen, Key, AlertTriangle, MessageSquare, Edit2, Bookmark, Users, HelpCircle, Layers, Plus, Calendar } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { markQuotaExhausted } from '../utils/quotaUtils';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự') || s.includes('hr')) return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]';
  if (s.includes('hành chính') || s.includes('admin')) return 'bg-[#FAE8FF] text-[#C026D3] dark:bg-[#C026D3]/15 dark:text-[#E879F9]';
  if (s.includes('pháp luật') || s.includes('legal') || s.includes('law')) return 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]';
  if (s.includes('học tập') || s.includes('education') || s.includes('study')) return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#4ADE80]';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useContext(AuthContext);
  const { language, t } = useLanguage();

  const parseSummaryContent = (summaryText) => {
    if (!summaryText) return { metadata: null, cleanSummary: '' };

    const delimiter = '=========================================';
    if (summaryText.includes(delimiter)) {
      const parts = summaryText.split(delimiter);
      if (parts.length >= 3) {
        const metadataText = parts[1];
        const cleanSummary = parts.slice(2).join(delimiter).trim();

        let expiry = null;
        let details = null;

        const lines = metadataText.split('\n');
        lines.forEach(line => {
          if (line.includes('📅 Hạn hợp đồng / Hạn hiệu lực:')) {
            expiry = line.replace('📅 Hạn hợp đồng / Hạn hiệu lực:', '').trim();
          } else if (line.includes('🔑 Chi tiết chính:')) {
            details = line.replace('🔑 Chi tiết chính:', '').trim();
          }
        });

        return {
          metadata: { expiry, details },
          cleanSummary
        };
      }
    }

    return { metadata: null, cleanSummary: summaryText };
  };
  const [doc, setDoc] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(location.state?.edit || false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Proposal 2: AI Flashcards state
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [flashcardError, setFlashcardError] = useState(null); // null | 'quota' | 'other'

  // Proposal 3: Document Comments states
  const { socket } = useContext(SocketContext);
  const [activeTab, setActiveTab] = useState('ai');
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Proposal 4: Highlights / Annotations states
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [annotationNote, setAnnotationNote] = useState('');
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  // AI Chatbox and Studio state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'ai',
      text: 'Xin chào! Tôi có thể giúp bạn phân tích tài liệu này. Bạn có thể tự viết câu hỏi ở khung chat bên dưới hoặc chọn nhanh một lệnh từ Studio câu lệnh nhanh.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatQuotaError, setChatQuotaError] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      toast.error('Admin chỉ quản lý tài liệu, không thể xem chi tiết nội dung tài liệu!');
      navigate('/documents');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDocAndRelated = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/documents/${id}`);
        setDoc(res.data);

        // Fetch real related documents from backend mapping Cosine Similarity 
        const relRes = await API.get(`/documents/${id}/related`);
        setRelatedDocs(relRes.data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocAndRelated();
  }, [id]);

  const isQuotaError = (msg) => {
    const hit = msg && (msg.includes('Quota') || msg.includes('quota') || msg.includes('Hết lượt') || msg.includes('429'));
    if (hit) markQuotaExhausted();
    return hit;
  };

  const handleGenerateFlashcards = async () => {
    if (generatingFlashcards) return;
    setFlashcardError(null);
    setGeneratingFlashcards(true);
    const toastId = toast.loading('AI đang tự động sinh bộ thẻ Flashcards...');
    try {
      const res = await API.post('/flashcards/generate', { documentId: id, count: 8 });

      // Async mode: job enqueued — poll status
      if (res.status === 202 && res.data.jobId) {
        const jobId = res.data.jobId;
        toast.loading('AI đang xử lý Flashcards trong nền...', { id: toastId });

        // Poll every 2.5 seconds
        const poll = setInterval(async () => {
          try {
            const statusRes = await API.get(`/jobs/${jobId}/status`);
            const { status, progress } = statusRes.data;
            if (status === 'active') {
              toast.loading(`Đang tạo Flashcards... ${progress || 0}%`, { id: toastId });
            }
            if (status === 'completed') {
              clearInterval(poll);
              refreshProfile();
              toast.success('Tạo bộ Flashcards thành công!', { id: toastId });
              navigate('/flashcards');
              setGeneratingFlashcards(false);
            }
            if (status === 'failed') {
              clearInterval(poll);
              const errMsg = statusRes.data.error || 'Không thể tạo bộ Flashcards.';
              if (isQuotaError(errMsg)) {
                setFlashcardError('quota');
                toast.dismiss(toastId);
              } else {
                toast.error(errMsg, { id: toastId });
              }
              setGeneratingFlashcards(false);
            }
          } catch {
            clearInterval(poll);
            toast.error('Lỗi kiểm tra trạng thái tạo Flashcards.', { id: toastId });
            setGeneratingFlashcards(false);
          }
        }, 2500);

        // Safety timeout: 3 minutes
        setTimeout(() => {
          clearInterval(poll);
          if (generatingFlashcards) {
            toast.error('Quá thời gian chờ. Vui lòng thử lại.', { id: toastId });
            setGeneratingFlashcards(false);
          }
        }, 180000);
        return;
      }

      // Sync mode fallback (no Redis)
      refreshProfile();
      toast.success('Tạo bộ Flashcards thành công!', { id: toastId });
      navigate('/flashcards');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Không thể khởi tạo bộ flashcard AI lúc này.';
      if (isQuotaError(errMsg)) {
        setFlashcardError('quota');
        toast.dismiss(toastId);
      } else {
        toast.error(errMsg, { id: toastId });
      }
    } finally {
      // Only set false in sync mode; async mode handles it above
      if (!generatingFlashcards) return;
      setGeneratingFlashcards(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await API.get(`/shares/documents/${id}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      const res = await API.post('/shares/documents/comments', {
        documentId: id,
        content: commentInput.trim()
      });
      setComments(prev => {
        if (prev.some(c => c.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setCommentInput('');
    } catch (err) {
      toast.error('Lỗi khi gửi bình luận.');
    }
  };

  const fetchAnnotations = async () => {
    try {
      const res = await API.get(`/annotations/documents/${id}`);
      setAnnotations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAnnotation = async (e) => {
    e.preventDefault();
    if (!selectedText.trim()) return;
    try {
      const res = await API.post(`/annotations/documents/${id}`, {
        selectedText,
        note: annotationNote.trim(),
        color: '#ffeb3b'
      });
      toast.success('Đã lưu highlight ghi chú!');
      setAnnotations(prev => [...prev, res.data]);
      setShowAnnotationModal(false);
      setSelectedText('');
      setAnnotationNote('');
    } catch (err) {
      toast.error('Lỗi khi lưu highlight.');
    }
  };

  const handleDeleteAnnotation = async (annId) => {
    try {
      await API.delete(`/annotations/${annId}`);
      toast.success('Đã xóa highlight!');
      setAnnotations(prev => prev.filter(a => a.id !== annId));
    } catch (err) {
      toast.error('Xóa highlight thất bại.');
    }
  };

  const handleTextSelection = () => {
    if (isEditing) return; // Do not annotate while editing summary
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length > 3) {
      setSelectedText(text);
      setAnnotationNote('');
      setShowAnnotationModal(true);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnnotations();
      if (activeTab === 'comments') {
        fetchComments();
      }
    }
  }, [id, activeTab]);

  useEffect(() => {
    if (!socket) return;
    const handleCommentAdded = (comment) => {
      if (comment.document_id === id) {
        setComments(prev => {
          if (prev.some(c => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };
    socket.on('comment_added', handleCommentAdded);
    return () => {
      socket.off('comment_added', handleCommentAdded);
    };
  }, [socket, id]);

  useEffect(() => {
    if (doc) {
      setEditTitle(doc.title || '');
      setEditSubject(doc.subject || 'General');
      setEditSummary(doc.summary || '');
    }
  }, [doc, isEditing]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, chatLoading]);

  const handleConfirmDelete = async () => {
    try {
      await API.delete(`/documents/${id}`);
      toast.success("Đã xóa tài liệu thành công!");
      navigate('/documents');
    } catch (err) {
      toast.error(err.response?.data?.error || "Xóa thất bại");
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Tiêu đề không được để trống!");
      return;
    }
    setSaving(true);
    try {
      const res = await API.put(`/documents/${id}`, {
        title: editTitle.trim(),
        subject: editSubject,
        summary: editSummary.trim()
      });
      setDoc(res.data);
      setIsEditing(false);
      toast.success("Đã cập nhật thông tin tài liệu!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleAiReanalyze = async () => {
    setAiLoading(true);
    try {
      const res = await API.post('/ai/reanalyze', { documentId: id });
      // Refresh user profile/credits on success
      refreshProfile();
      setEditTitle(res.data.title);
      setEditSubject(res.data.subject);
      setEditSummary(res.data.summary);
      toast.success("✨ AI đã phân tích tài liệu và điền đề xuất thành công!");
    } catch (err) {
      const errMsg = err.response?.data?.error || '';
      if (isQuotaError(errMsg)) {
        setChatQuotaError(true);
        toast.error(language === 'vi' ? '⚡ Hết lượt AI hôm nay. Thử lại sau 2:00 chiều giờ VN.' : '⚡ Daily AI quota exceeded. Try again after reset.');
      } else {
        toast.error("Không thể sử dụng AI để phân tích tại thời điểm này.");
      }
    } finally {
      setAiLoading(false);
    }
  };
  const handleSendChat = async (directText = null) => {
    const textToSend = directText || chatInput;
    if (!textToSend.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text: textToSend.trim() }]);
    if (!directText) setChatInput('');
    setChatLoading(true);
    setChatQuotaError(false);

    try {
      const res = await API.post('/ai/qna', { documentId: id, question: textToSend.trim() });
      // Refresh user profile/credits on success
      refreshProfile();
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || '';
      if (isQuotaError(errMsg)) {
        setChatQuotaError(true);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: language === 'vi' ? 'Rất tiếc, hệ thống gặp sự cố khi xử lý dữ liệu AI. Vui lòng thử lại sau.' : 'Sorry, the system encountered an error processing AI data. Please try again later.' }]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const studioCommands = [
    {
      name: language === 'vi' ? 'Tóm tắt sâu' : 'Deep Summary',
      icon: Sparkles,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      prompt: language === 'vi'
        ? 'Hãy phân tích và tóm tắt sâu sắc tài liệu này, làm rõ: Bối cảnh ra đời, Nội dung cốt lõi chi tiết và Ý nghĩa thực tiễn.'
        : 'Please analyze and summarize this document deeply, clarifying: background, detailed core content, and practical significance.'
    },
    {
      name: language === 'vi' ? 'Trích từ khóa' : 'Keywords',
      icon: Key,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      prompt: language === 'vi'
        ? 'Hãy liệt kê 5-10 từ khóa/thuật ngữ chuyên ngành quan trọng nhất xuất hiện trong tài liệu này kèm theo giải thích ngắn gọn ngữ nghĩa của chúng.'
        : 'Please list 5-10 most important keywords/specialized terms appearing in this document along with brief explanations of their meaning.'
    },
    {
      name: language === 'vi' ? 'Phân tích rủi ro' : 'Risks',
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      prompt: language === 'vi'
        ? 'Dưới góc độ chuyên gia pháp lý và vận hành, hãy rà soát tìm các điểm rủi ro tiềm ẩn, mâu thuẫn hoặc lỗ hổng (nếu có) trong tài liệu này.'
        : 'From a legal and operational expert perspective, please review this document to find potential risks, contradictions, or gaps (if any).'
    },
    {
      name: language === 'vi' ? 'Theo dõi hợp đồng' : 'Contract Expiry',
      icon: Calendar,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      prompt: language === 'vi'
        ? 'Hãy phân tích hợp đồng này và trích xuất các thông tin chính dưới dạng bảng: loại hợp đồng, bên liên quan, ngày bắt đầu hiệu lực, ngày hết hạn/thời hạn hợp đồng, các điều khoản gia hạn hoặc mốc thời gian đáng lưu ý.'
        : 'Please analyze this contract and extract key information in a table format: contract type, parties, effective date, expiration date/duration, renewal terms, or important milestones.'
    }
  ];

  const canEditDoc = doc && (doc.user_id === user?.id || doc.canEdit || user?.role === 'admin');

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!doc) return <div className="text-center mt-12 text-text-secondary">{language === 'vi' ? 'Tài liệu không tồn tại hoặc đã bị xóa.' : 'Document does not exist or has been deleted.'}</div>;

  return (
    <div className="max-w-[1600px] w-full mx-auto pb-12">
      {/* Header Back Button & Control Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/documents')}
          disabled={saving || aiLoading}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'vi' ? 'Quay lại' : 'Back'}</span>
        </button>

        {!isEditing ? (
          <div className="flex space-x-3">
            {canEditDoc && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
              >
                {language === 'vi' ? 'Chỉnh sửa tài liệu' : 'Edit document'}
              </button>
            )}
            {(doc.user_id === user?.id || user?.role === 'admin') && (
              <button
                onClick={() => setIsConfirmOpen(true)}
                className="flex items-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 bg-surface border border-red-200 dark:border-red-900/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'vi' ? 'Xóa' : 'Delete'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleAiReanalyze}
              disabled={aiLoading}
              className="bg-[#52B788] hover:bg-[#409c71] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              <span>{language === 'vi' ? 'AI tự động điền' : 'AI Auto-fill'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || aiLoading}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              <span>{language === 'vi' ? 'Lưu lại' : 'Save'}</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving || aiLoading}
              className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              {t('cancel')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Document Detail & Summaries */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <div className="space-y-6 bg-surface border border-border rounded-xl p-8 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
                <span>{language === 'vi' ? 'Chỉnh sửa thông tin tài liệu' : 'Edit document info'}</span>
                {aiLoading && <span className="text-xs text-primary font-normal animate-pulse">{(language === 'vi' ? '(AI đang phân tích & điền dữ liệu...)' : '(AI is analyzing & filling data...)')}</span>}
              </h2>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">{language === 'vi' ? 'Tiêu đề tài liệu' : 'Document title'}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={saving || aiLoading}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  placeholder={language === 'vi' ? "Nhập tiêu đề tài liệu" : "Enter document title"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">{language === 'vi' ? 'Danh mục (Subject Tag)' : 'Subject Tag'}</label>
                <select
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  disabled={saving || aiLoading}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Nhân sự">{language === 'vi' ? 'Nhân sự' : 'HR'}</option>
                  <option value="Hành chính">{language === 'vi' ? 'Hành chính' : 'Admin'}</option>
                  <option value="Pháp luật">{language === 'vi' ? 'Pháp luật' : 'Legal'}</option>
                  <option value="Học tập">{language === 'vi' ? 'Học tập' : 'Study'}</option>
                  <option value="Khác">{language === 'vi' ? 'Khác' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">{language === 'vi' ? 'Bản tóm tắt nội dung tài liệu (Summary)' : 'Document Summary'}</label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  disabled={saving || aiLoading}
                  rows={12}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition leading-relaxed whitespace-pre-wrap custom-scrollbar"
                  placeholder={language === 'vi' ? "Nhập nội dung tóm tắt tài liệu..." : "Enter document summary..."}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-border rounded-xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTagColor(doc.subject)}`}>
                    {doc.subject}
                  </span>
                  <span className="text-xs font-semibold text-[#10B981] bg-[#DEF7EC] dark:bg-[#DEF7EC]/10 border border-[#10B981]/20 px-2 py-1 rounded">
                    {language === 'vi' ? 'Đã xử lý' : 'Processed'}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold text-text-primary mb-6">{doc.title}</h1>

                {(() => {
                  const { metadata, cleanSummary } = parseSummaryContent(doc.summary);
                  return (
                    <>
                      {metadata && (
                        <div className="mb-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-500/25 rounded-xl p-5 shadow-sm">
                          <h3 className="text-sm font-extrabold text-[#10B981] flex items-center space-x-2 mb-3">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>{language === 'vi' ? 'Thông tin & Thời hạn Hợp đồng (AI)' : 'Contract & Expiry Info (AI)'}</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metadata.expiry && (
                              <div className="flex items-start space-x-3 bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg border border-border">
                                <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </span>
                                <div>
                                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{language === 'vi' ? 'Thời hạn / Ngày hết hạn' : 'Expiry / Duration'}</p>
                                  <p className="text-sm font-black text-text-primary mt-0.5">{metadata.expiry}</p>
                                </div>
                              </div>
                            )}
                            {metadata.details && (
                              <div className="flex items-start space-x-3 bg-white/70 dark:bg-slate-800/70 p-3 rounded-lg border border-border">
                                <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                                  <Layers className="w-4 h-4" />
                                </span>
                                <div>
                                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{language === 'vi' ? 'Thông tin trích xuất' : 'Extracted Details'}</p>
                                  <p className="text-sm font-bold text-text-primary mt-0.5">{metadata.details}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <h2 className="text-lg font-bold text-text-primary mb-4">{language === 'vi' ? 'Tóm tắt nội dung' : 'Content Summary'}</h2>
                      <div
                        onMouseUp={handleTextSelection}
                        className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap select-text p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-text transition-colors"
                        title={language === 'vi' ? "Bôi đen văn bản để tạo highlight & ghi chú" : "Highlight text to create notes & highlights"}
                      >
                        {cleanSummary || (language === 'vi' ? 'Tài liệu đang xử lý tóm tắt. Vui lòng thử lại sau.' : 'The document summary is being processed. Please try again later.')}
                      </div>
                    </>
                  );
                })()}

                {/* Proposal 4: Highlights and Annotations List */}
                {annotations.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center space-x-2">
                      <Bookmark className="w-4.5 h-4.5 text-primary" />
                      <span>{language === 'vi' ? `Đoạn quan trọng đã Highlight & Ghi chú (${annotations.length})` : `Important Highlights & Notes (${annotations.length})`}</span>
                    </h4>
                    <div className="space-y-3">
                      {annotations.map(ann => (
                        <div key={ann.id} style={{ borderLeftColor: ann.color || '#ffeb3b' }} className="border-l-4 bg-background dark:bg-slate-900 border border-border rounded-xl p-3 flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-primary bg-primary/5 p-1.5 rounded-lg italic">"{ann.selected_text}"</p>
                            {ann.note && <p className="text-xs text-text-secondary font-medium">{language === 'vi' ? 'Ghi chú' : 'Note'}: {ann.note}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteAnnotation(ann.id)}
                            className="text-text-secondary hover:text-red-500 text-xs shrink-0 cursor-pointer font-semibold"
                          >
                            {language === 'vi' ? 'Xóa' : 'Delete'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proposal 2: AI Flashcards Activation Panel */}
                {canEditDoc && user?.role !== 'admin' && (
                  <div className="mt-8 border-t border-border pt-6">
                    <div className="bg-gradient-to-r from-primary/10 to-[#52B788]/10 border border-primary/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-extrabold text-xs flex items-center space-x-1 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Học Tập Thông Minh' : 'Smart Learning'}</span>
                          </span>
                        </div>
                        <h4 className="font-extrabold text-text-primary text-base">{language === 'vi' ? 'Tạo thẻ ghi nhớ thông minh' : 'Create smart flashcards'}</h4>
                        <p className="text-xs text-text-secondary">{language === 'vi' ? 'AI sẽ tự động rút trích các kiến thức trọng tâm tạo thành bộ 8 thẻ ôn tập Flashcards học nhanh nhớ lâu.' : 'AI will automatically extract core knowledge to create an 8-card smart flashcard deck for quick study.'}</p>
                      </div>

                      <button
                        onClick={handleGenerateFlashcards}
                        disabled={generatingFlashcards}
                        className="bg-gradient-to-r from-primary to-[#52B788] hover:from-primary-dark text-white font-black text-xs py-3 px-5 rounded-xl transition-all shadow-md shadow-primary/20 whitespace-nowrap cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2 disabled:opacity-70"
                      >
                        {generatingFlashcards ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{language === 'vi' ? 'Đang tạo thẻ...' : 'Generating cards...'}</span>
                          </>
                        ) : (
                          <span>{language === 'vi' ? 'Tạo flashcards' : 'Create flashcards'}</span>
                        )}
                      </button>

                      {/* Quota error banner */}
                      {flashcardError === 'quota' && (
                        <div className="mt-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                              {language === 'vi' ? `⚡ Hết lượt AI ${user?.is_pro ? '' : 'miễn phí'} hôm nay` : `⚡ Daily AI ${user?.is_pro ? '' : 'free'} quota exceeded`}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                              {language === 'vi'
                                ? `Hệ thống đã đạt giới hạn ${user?.is_pro ? '100' : '20'} yêu cầu/ngày. Quota sẽ reset lúc 7:00 sáng UTC (2:00 chiều giờ VN). Vui lòng thử lại sau.`
                                : `System has reached the ${user?.is_pro ? '100' : '20'} requests/day limit. Quota resets at 7:00 AM UTC. Please try again later.`}
                            </p>
                          </div>
                          <button
                            onClick={() => setFlashcardError(null)}
                            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 flex-shrink-0 cursor-pointer text-lg leading-none"
                            title="Đóng"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Related Documents Container */}
          <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-text-secondary" />
                <span>{language === 'vi' ? 'Tài liệu liên quan ngữ nghĩa (Semantic Matches)' : 'Semantic Matches (Related Documents)'}</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {relatedDocs.map((rdoc, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/documents/${rdoc.id}`)}
                  className="flex justify-between items-center text-sm border-b border-border dark:border-slate-800 pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 transition-colors rounded"
                >
                  <div>
                    <p className="font-medium text-text-primary">{rdoc._title}</p>
                    <p className="text-text-secondary text-xs mt-0.5">{rdoc._date}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                      {language === 'vi' ? `Độ trùng khớp: ${Math.round(rdoc.sim * 100)}%` : `Match score: ${Math.round(rdoc.sim * 100)}%`}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${getTagColor(rdoc._subject)}`}>
                      {rdoc._subject}
                    </span>
                  </div>
                </div>
              ))}
              {relatedDocs.length === 0 && (
                <p className="text-sm text-text-secondary italic">{language === 'vi' ? 'Không tìm thấy tài liệu liên quan nào có chung ngữ nghĩa AI.' : 'No semantically related documents found.'}</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Document Analyzer & Studio */}
        <div className="lg:col-span-1 flex flex-col lg:h-[calc(100vh-140px)] h-[550px] max-h-[75vh] lg:max-h-none lg:min-h-[450px] lg:sticky lg:top-4">
          <div className="bg-surface border border-border rounded-xl flex-1 flex flex-col p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">

            {/* Right Panel Tabs */}
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between shrink-0">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`text-sm font-bold pb-2 transition cursor-pointer ${activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {language === 'vi' ? 'Trò chuyện AI' : 'AI Chat'}
                </button>
                <button
                  onClick={() => { setActiveTab('comments'); fetchComments(); }}
                  className={`text-sm font-bold pb-2 transition cursor-pointer ${activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {language === 'vi' ? 'Thảo luận nhóm' : 'Group Chat'}
                </button>
              </div>
            </div>

            {activeTab === 'ai' ? (
              <>
                {/* AI Studio Quick Toolbar */}
                <div className="mb-4 shrink-0">
                  <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">{language === 'vi' ? 'Studio Câu Lệnh Nhanh' : 'AI Prompts Studio'}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {studioCommands.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(cmd.prompt)}
                        disabled={chatLoading}
                        className={`flex items-center space-x-1.5 p-2 rounded-lg text-xs font-semibold border text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${cmd.color}`}
                      >
                        <cmd.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cmd.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Chat Messages Block */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.role === 'ai' && (
                        <span className="text-[9px] font-bold text-primary mb-1 uppercase tracking-wider pl-1">ARKA ASSISTANT</span>
                      )}
                      <div className={`p-3 text-xs leading-relaxed max-w-[90%] rounded-xl whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-black/5 dark:bg-white/5 text-text-primary rounded-tl-sm border border-border'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex flex-col items-start animate-pulse">
                      <span className="text-[9px] font-bold text-primary mb-1 uppercase tracking-wider pl-1">ARKA ASSISTANT</span>
                      <div className="bg-black/5 dark:bg-white/5 border border-border rounded-xl rounded-tl-sm p-3 text-xs flex space-x-1.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-300ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quota Error Banner */}
                {chatQuotaError && (
                  <div className="mb-3 shrink-0 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-amber-800 dark:text-amber-300">
                        {language === 'vi' ? `⚡ Hết lượt AI ${user?.is_pro ? '' : 'miễn phí'} hôm nay` : `⚡ Daily AI ${user?.is_pro ? '' : 'free'} quota exceeded`}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                        {language === 'vi'
                          ? `Hệ thống đạt giới hạn ${user?.is_pro ? '100' : '20'} yêu cầu/ngày. Quota reset lúc 2:00 chiều giờ VN. Vui lòng thử lại sau.`
                          : `System reached the ${user?.is_pro ? '100' : '20'} req/day limit. Quota resets at 7:00 AM UTC. Please try again later.`}
                      </p>
                    </div>
                    <button onClick={() => setChatQuotaError(false)} className="text-amber-400 hover:text-amber-600 flex-shrink-0 cursor-pointer text-base leading-none">✕</button>
                  </div>
                )}

                {/* Chat Input Field */}
                <div className="border-t border-border pt-4 shrink-0">
                  <div className="flex space-x-2">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      rows={1}
                      placeholder={language === 'vi' ? "Hỏi bất kỳ điều gì về tài liệu này..." : "Ask anything about this document..."}
                      className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary transition resize-none custom-scrollbar max-h-24"
                    />
                    <button
                      onClick={() => handleSendChat()}
                      disabled={chatLoading || !chatInput.trim()}
                      className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Group Comments Area */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
                  {commentsLoading ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-10 text-text-secondary text-xs italic">
                      {language === 'vi' ? 'Chưa có thảo luận nào. Hãy gửi bình luận đầu tiên dưới đây để trao đổi học tập!' : 'No discussions yet. Send the first comment below to start learning together!'}
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-text-primary">{c.users?.name || c.users?.email}</span>
                          <span className="text-text-secondary">{new Date(c.created_at).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-text-primary leading-normal">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input Box */}
                <form onSubmit={handleSendComment} className="border-t border-border pt-4 shrink-0 flex space-x-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder={language === 'vi' ? "Nhập nội dung thảo luận với nhóm..." : "Type your message to the group..."}
                    className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary transition"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={language === 'vi' ? "Xóa tài liệu này?" : "Delete this document?"}
        message={language === 'vi'
          ? "Hành động này sẽ xóa vĩnh viễn cấu trúc dữ liệu và gỡ bỏ toàn bộ liên kết đồ thị tri thức của tài liệu này ra khỏi hệ thống."
          : "This action will permanently delete this document and remove all its knowledge graph connections from the system."
        }
      />

      {/* Proposal 4: Highlight Annotation Modal */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[300]">
          <div className="bg-surface border border-border w-full max-w-md p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">{language === 'vi' ? 'Thêm ghi chú cho đoạn Highlight' : 'Add Note to Highlight'}</h3>
            <div className="bg-background border border-border rounded-xl p-3 text-xs italic text-text-secondary leading-relaxed">
              "{selectedText}"
            </div>
            <form onSubmit={handleSaveAnnotation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">{language === 'vi' ? 'Nội dung ghi chú cá nhân' : 'Personal note content'}</label>
                <textarea
                  value={annotationNote}
                  onChange={e => setAnnotationNote(e.target.value)}
                  placeholder={language === 'vi' ? "Ghi nhận kiến thức cốt lõi, công thức, định nghĩa cần ôn tập..." : "Note down core concepts, formulas, definitions to review..."}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary text-text-primary resize-none"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAnnotationModal(false); setSelectedText(''); }}
                  className="flex-1 py-2 border border-border text-text-secondary rounded-xl text-xs font-semibold cursor-pointer hover:bg-black/5 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-primary-dark transition"
                >
                  {language === 'vi' ? 'Lưu ghi chú' : 'Save note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
