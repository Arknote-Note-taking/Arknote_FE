import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Link as LinkIcon, Trash2, Send, Sparkles, BookOpen, Key, AlertTriangle, MessageSquare } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Rất tiếc, hệ thống gặp sự cố khi xử lý dữ liệu AI. Vui lòng thử lại sau.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const studioCommands = [
    {
      name: 'Tạo Quiz',
      icon: BookOpen,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      prompt: 'Hãy tạo 5 câu hỏi trắc nghiệm (quiz) chất lượng cao dựa trên nội dung tài liệu này, có kèm đáp án và giải thích chi tiết cho từng câu.'
    },
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
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1"/> : null}
              <span>✨ AI tự động điền</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || aiLoading}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1"/> : null}
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
                <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {doc.summary || 'Tài liệu đang xử lý tóm tắt. Vui lòng thử lại sau.'}
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
            
            {/* AI Assistant Header */}
            <div className="border-b border-border pb-4 mb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text-primary">Hỏi đáp & AI Studio</h3>
              </div>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full">
                AI ACTIVE
              </span>
            </div>

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
                  <div className={`p-3 text-xs leading-relaxed max-w-[90%] rounded-xl whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' 
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
    </div>
  );
};

export default DocumentDetail;
