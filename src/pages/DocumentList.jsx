import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { Search, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import UploadModal from '../components/UploadModal';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A]';
  return 'bg-gray-100 text-gray-600';
};

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [confirmData, setConfirmData] = useState({ isOpen: false, docId: null });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();

  const filters = ['Tất cả', 'Nhân sự', 'Hành chính', 'Pháp luật', 'Học tập'];

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleCreated = (newDoc) => setDocuments(docs => [newDoc, ...docs]);
    const handleUpdated = (updatedDoc) => setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    const handleDeleted = ({ id }) => setDocuments(docs => docs.filter(d => d.id !== id));

    socket.on('document_created', handleCreated);
    socket.on('document_updated', handleUpdated);
    socket.on('document_deleted', handleDeleted);

    return () => {
      socket.off('document_created', handleCreated);
      socket.off('document_updated', handleUpdated);
      socket.off('document_deleted', handleDeleted);
    };
  }, [socket]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDocuments();
      return;
    }
    try {
      const res = await API.get(`/documents/search?q=${searchQuery}&type=basic`);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const initiateDelete = (e, id) => {
    e.stopPropagation();
    setConfirmData({ isOpen: true, docId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmData.docId) return;
    try {
      await API.delete(`/documents/${confirmData.docId}`);
      toast.success("Đã xóa tài liệu thành công!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Xóa thất bại");
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeFilter === 'Tất cả') return true;
    return doc.subject?.toLowerCase?.().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="max-w-5xl relative">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Tài liệu</h1>
          <p className="text-text-secondary text-sm">Tìm kiếm và quản lý tài liệu</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm kiếm tài liệu, thẻ..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        
        <div className="flex space-x-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === filter 
                  ? 'bg-[#2E7D32] text-white rounded-lg shadow-sm border border-[#2E7D32]' 
                  : 'bg-white border text-text-secondary hover:bg-gray-50 border-gray-200 rounded-lg'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="flex flex-1 justify-end">
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm tài liệu</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDocs.map(doc => (
          <div 
            key={doc.id} 
            className="bg-surface border border-border p-5 rounded-xl hover:shadow-md transition-shadow cursor-pointer flex justify-between items-start"
            onClick={() => navigate(`/documents/${doc.id}`)}
          >
             <div>
                <div className="flex items-center space-x-3 mb-2">
                   <h3 className="font-bold text-text-primary text-base">{doc.title}</h3>
                   <span className="text-[10px] font-semibold text-[#10B981] bg-[#DEF7EC] border border-[#10B981]/20 px-2 py-0.5 rounded text-center leading-none">
                     Đã xử lý
                   </span>
                </div>
                <p className="text-sm text-text-secondary mb-3 max-w-2xl line-clamp-1">{doc.summary || 'Trích xuất nội dung và phân tích dựa trên AI model...'}</p>
                <div className="flex items-center space-x-2">
                   <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${getTagColor(doc.subject)}`}>
                     {doc.subject}
                   </span>
                   {doc.tags?.slice(0,3).map((tag, idx) => (
                     <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">
                       {tag}
                     </span>
                   ))}
                </div>
             </div>
             <div className="text-right flex flex-col items-end justify-between h-full">
                <div className="flex items-center space-x-3 mb-1">
                   <p className="text-text-secondary text-xs">{new Date(doc.created_at).toISOString().split('T')[0]}</p>
                   <button 
                     onClick={(e) => initiateDelete(e, doc.id)}
                     className="text-text-secondary hover:text-red-500 transition-colors p-1"
                     title="Xóa tài liệu"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <p className="text-text-secondary text-sm mt-8 text-center italic">Không tìm thấy tài liệu phù hợp.</p>
        )}
      </div>

      <ConfirmModal 
         isOpen={confirmData.isOpen}
         onClose={() => setConfirmData({ isOpen: false, docId: null })}
         onConfirm={handleConfirmDelete}
         title="Xóa tài liệu này?"
         message="Tài liệu bị xóa sẽ không thể phục hồi và toàn bộ các liên kết đồ thị ngữ nghĩa liên quan cũng sẽ bị gỡ bỏ."
      />
      
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};

export default DocumentList;
