import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A]';
  return 'bg-gray-100 text-gray-600';
};

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  const handleConfirmDelete = async () => {
    try {
      await API.delete(`/documents/${id}`);
      toast.success("Đã xóa tài liệu thành công!");
      navigate('/documents');
    } catch (err) {
      toast.error(err.response?.data?.error || "Xóa thất bại");
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!doc) return <div className="text-center mt-12 text-text-secondary">Tài liệu không tồn tại hoặc đã bị xóa.</div>;

  return (
    <div className="max-w-4xl pb-12">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/documents')}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
        <button 
          onClick={() => setIsConfirmOpen(true)}
          className="flex items-center space-x-2 text-red-500 hover:bg-red-50 bg-white border border-red-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa tài liệu</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
         <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTagColor(doc.subject)}`}>
           {doc.subject}
         </span>
         <span className="text-xs font-semibold text-[#10B981] bg-[#DEF7EC] border border-[#10B981]/20 px-2 py-1 rounded">
           Đã xử lý
         </span>
      </div>

      <h1 className="text-3xl font-extrabold text-text-primary mb-8">{doc.title}</h1>

      <div className="bg-surface border border-border rounded-xl p-8 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
         <h2 className="text-lg font-bold text-text-primary mb-4">Tóm tắt</h2>
         <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
           {doc.summary || 'Tài liệu đang xử lý tóm tắt. Vui lòng thử lại sau.'}
         </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
         <div className="p-6 border-b border-border">
           <h2 className="text-lg font-bold text-text-primary flex items-center space-x-2">
             <LinkIcon className="w-5 h-5 text-text-secondary" />
             <span>Tài liệu liên quan</span>
           </h2>
         </div>
         <div className="p-6 space-y-4">
           {relatedDocs.map((rdoc, idx) => (
             <div 
               key={idx} 
               onClick={() => navigate(`/documents/${rdoc.id}`)} 
               className="flex justify-between items-center text-sm border-b border-border pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-black/5 p-2 transition-colors rounded"
             >
               <div>
                 <p className="font-medium text-text-primary">{rdoc._title}</p>
                 <p className="text-text-secondary text-xs mt-0.5">{rdoc._date}</p>
               </div>
               <div className="flex items-center space-x-3">
                 <span className="text-[10px] font-bold text-text-secondary bg-black/5 px-2 py-1 rounded">
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
