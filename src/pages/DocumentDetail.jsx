import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Link as LinkIcon, Trash2, Send, Sparkles, BookOpen, Key, AlertTriangle, MessageSquare, Edit2, Bookmark, Users, HelpCircle, Layers, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3] dark:bg-[#C026D3]/15 dark:text-[#E879F9]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#4ADE80]';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useContext(AuthContext);
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

  const handleGenerateFlashcards = async () => {
    if (generatingFlashcards) return;
    setGeneratingFlashcards(true);
    const toastId = toast.loading("AI đang tự động sinh bộ thẻ Flashcards...");
    try {
      await API.post('/flashcards/generate', { documentId: id, count: 8 });
      // Refresh user profile/credits on success
      refreshProfile();
      toast.success("Tạo bộ Flashcards thành công!", { id: toastId });
      navigate('/flashcards');
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể khởi tạo bộ flashcard AI lúc này.", { id: toastId });
    } finally {
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
      toast.error("Không thể sử dụng AI để phân tích tại thời điểm này.");
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

    try {
      const res = await API.post('/ai/qna', { documentId: id, question: textToSend.trim() });
      // Refresh user profile/credits on success
      refreshProfile();
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Rất tiếc, hệ thống gặp sự cố khi xử lý dữ liệu AI. Vui lòng thử lại sau.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const studioCommands = [
    {
      name: 'Tóm tắt sâu',
      icon: Sparkles,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      prompt: 'Hãy phân tích và tóm tắt sâu sắc tài liệu này, làm rõ: Bối cảnh ra đời, Nội dung cốt lõi chi tiết và Ý nghĩa thực tiễn.'
    },
    {
      name: 'Trích từ khóa',
      icon: Key,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      prompt: 'Hãy liệt kê 5-10 từ khóa/thuật ngữ chuyên ngành quan trọng nhất xuất hiện trong tài liệu này kèm theo giải thích ngắn gọn ngữ nghĩa của chúng.'
    },
    {
      name: 'Phân tích rủi ro',
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      prompt: 'Dưới góc độ chuyên gia pháp lý và vận hành, hãy rà soát tìm các điểm rủi ro tiềm ẩn, mâu thuẫn hoặc lỗ hổng (nếu có) trong tài liệu này.'
    }
  ];

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!doc) return <div className="text-center mt-12 text-text-secondary">Tài liệu không tồn tại hoặc đã bị xóa.</div>;

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
          <span>Quay lại</span>
        </button>

        {!isEditing ? (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              Chỉnh sửa tài liệu
            </button>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="flex items-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 bg-surface border border-red-200 dark:border-red-900/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleAiReanalyze}
              disabled={aiLoading}
              className="bg-[#52B788] hover:bg-[#409c71] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              <span>✨ AI tự động điền</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || aiLoading}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              <span>Lưu lại</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving || aiLoading}
              className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              Hủy
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
                <span>Chỉnh sửa thông tin tài liệu</span>
                {aiLoading && <span className="text-xs text-primary font-normal animate-pulse">(AI đang phân tích & điền dữ liệu...)</span>}
              </h2>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Tiêu đề tài liệu</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={saving || aiLoading}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  placeholder="Nhập tiêu đề tài liệu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Danh mục (Subject Tag)</label>
                <select
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  disabled={saving || aiLoading}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Nhân sự">Nhân sự</option>
                  <option value="Hành chính">Hành chính</option>
                  <option value="Pháp luật">Pháp luật</option>
                  <option value="Học tập">Học tập</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Bản tóm tắt nội dung tài liệu (Summary)</label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  disabled={saving || aiLoading}
                  rows={12}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition leading-relaxed whitespace-pre-wrap custom-scrollbar"
                  placeholder="Nhập nội dung tóm tắt tài liệu..."
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
                    Đã xử lý
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold text-text-primary mb-6">{doc.title}</h1>

                <h2 className="text-lg font-bold text-text-primary mb-4">Tóm tắt nội dung</h2>
                <div
                  onMouseUp={handleTextSelection}
                  className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap select-text p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-text transition-colors"
                  title="Bôi đen văn bản để tạo highlight & ghi chú"
                >
                  {doc.summary || 'Tài liệu đang xử lý tóm tắt. Vui lòng thử lại sau.'}
                </div>

                {/* Proposal 4: Highlights and Annotations List */}
                {annotations.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center space-x-2">
                      <Bookmark className="w-4.5 h-4.5 text-primary" />
                      <span>Đoạn quan trọng đã Highlight & Ghi chú ({annotations.length})</span>
                    </h4>
                    <div className="space-y-3">
                      {annotations.map(ann => (
                        <div key={ann.id} style={{ borderLeftColor: ann.color || '#ffeb3b' }} className="border-l-4 bg-background dark:bg-slate-900 border border-border rounded-xl p-3 flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-text-primary bg-primary/5 p-1.5 rounded-lg italic">"{ann.selected_text}"</p>
                            {ann.note && <p className="text-xs text-text-secondary font-medium">📝 Ghi chú: {ann.note}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteAnnotation(ann.id)}
                            className="text-text-secondary hover:text-red-500 text-xs shrink-0 cursor-pointer font-semibold"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proposal 2: AI Flashcards Activation Panel */}
                <div className="mt-8 border-t border-border pt-6">
                  <div className="bg-gradient-to-r from-primary/10 to-[#52B788]/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-primary font-extrabold text-xs flex items-center space-x-1 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Học Tập Thông Minh</span>
                        </span>
                      </div>
                      <h4 className="font-extrabold text-text-primary text-base">Tạo thẻ ghi nhớ thông minh</h4>
                      <p className="text-xs text-text-secondary">AI sẽ tự động rút trích các kiến thức trọng tâm tạo thành bộ 8 thẻ ôn tập Flashcards học nhanh nhớ lâu.</p>
                    </div>

                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={generatingFlashcards}
                      className="bg-gradient-to-r from-primary to-[#52B788] hover:from-primary-dark text-white font-black text-xs py-3 px-5 rounded-xl transition-all shadow-md shadow-primary/20 whitespace-nowrap cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2 disabled:opacity-70"
                    >
                      {generatingFlashcards ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang tạo thẻ...</span>
                        </>
                      ) : (
                        <span>Tạo flashcards</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Related Documents Container */}
          <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-text-secondary" />
                <span>Tài liệu liên quan ngữ nghĩa (Semantic Matches)</span>
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
                      Độ trùng khớp: {Math.round(rdoc.sim * 100)}%
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${getTagColor(rdoc._subject)}`}>
                      {rdoc._subject}
                    </span>
                  </div>
                </div>
              ))}
              {relatedDocs.length === 0 && (
                <p className="text-sm text-text-secondary italic">Không tìm thấy tài liệu liên quan nào có chung ngữ nghĩa AI.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Document Analyzer & Studio */}
        <div className="lg:col-span-1 flex flex-col h-[calc(100vh-140px)] min-h-[600px] sticky top-4">
          <div className="bg-surface border border-border rounded-xl flex-1 flex flex-col p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">

            {/* Right Panel Tabs */}
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between shrink-0">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`text-sm font-bold pb-2 transition cursor-pointer ${activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Trò chuyện AI
                </button>
                <button
                  onClick={() => { setActiveTab('comments'); fetchComments(); }}
                  className={`text-sm font-bold pb-2 transition cursor-pointer ${activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Thảo luận nhóm
                </button>
              </div>
            </div>

            {activeTab === 'ai' ? (
              <>
                {/* AI Studio Quick Toolbar */}
                <div className="mb-4 shrink-0">
                  <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">Studio Câu Lệnh Nhanh</h4>
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
                    <div className="flex items-start">
                      <div className="bg-black/5 dark:bg-white/5 border border-border rounded-xl rounded-tl-sm p-3 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Field */}
                <div className="border-t border-border pt-4 shrink-0">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Hỏi bất kỳ điều gì về tài liệu này..."
                      className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary transition"
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
                      Chưa có thảo luận nào. Hãy gửi bình luận đầu tiên dưới đây để trao đổi học tập!
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-black/5 dark:bg-white/5 border border-border rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-text-primary">{c.users?.name || c.users?.email}</span>
                          <span className="text-text-secondary">{new Date(c.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
                    placeholder="Nhập nội dung thảo luận với nhóm..."
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
        title="Xóa tài liệu này?"
        message="Hành động này sẽ xóa vĩnh viễn cấu trúc dữ liệu và gỡ bỏ toàn bộ liên kết đồ thị tri thức của tài liệu này ra khỏi hệ thống."
      />

      {/* Proposal 4: Highlight Annotation Modal */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[300]">
          <div className="bg-surface border border-border w-full max-w-md p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">Thêm ghi chú cho đoạn Highlight</h3>
            <div className="bg-background border border-border rounded-xl p-3 text-xs italic text-text-secondary leading-relaxed">
              "{selectedText}"
            </div>
            <form onSubmit={handleSaveAnnotation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Nội dung ghi chú cá nhân</label>
                <textarea
                  value={annotationNote}
                  onChange={e => setAnnotationNote(e.target.value)}
                  placeholder="Ghi nhận kiến thức cốt lõi, công thức, định nghĩa cần ôn tập..."
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
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-primary-dark transition"
                >
                  Lưu ghi chú
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
