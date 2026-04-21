import React, { useState, useMemo } from 'react';
import { X, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const DocumentSelectModal = ({ isOpen, onClose, documents, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Filter documents unconditionally so Hook order is unchanged
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents || [];
    const lowerQ = searchQuery.toLowerCase();
    return (documents || []).filter(doc => doc.title?.toLowerCase().includes(lowerQ) || doc.subject?.toLowerCase().includes(lowerQ));
  }, [documents, searchQuery]);

  if (!isOpen) return null;

  // Pagination calculation
  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE) || 1;
  const currentDocs = filteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(c => c + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(c => c - 1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // reset to first page on search
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 rounded-full p-2 transition-colors">
          <X className="w-5 h-5"/>
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Chọn tài liệu từ kho</h2>
        <p className="text-text-secondary text-sm mb-6">Chọn tài liệu đã tải lên để AI tập trung phân tích nội dung.</p>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm theo tên tài liệu hoặc danh mục..."
            className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* List of Documents */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar mb-4 pr-1">
          {currentDocs.length > 0 ? currentDocs.map(doc => (
            <div 
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className="group border border-border bg-background hover:bg-black/5 rounded-xl p-4 flex items-start space-x-4 cursor-pointer transition-colors"
            >
              <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary text-sm truncate">{doc.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-black/5 text-text-secondary px-2 py-0.5 rounded-md font-medium">{doc.subject || 'General'}</span>
                  <span className="text-xs text-text-secondary">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-xs text-text-secondary mt-2 line-clamp-1">{doc.summary || 'Chưa có bản tóm tắt...'}</p>
              </div>
            </div>
          )) : (
            <div className="text-center text-text-secondary text-sm py-10">
              Không tìm thấy tài liệu phù hợp.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-border pt-4 shrink-0">
          <span className="text-sm text-text-secondary">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)} trong tổng {filteredDocs.length}
          </span>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-text-primary px-2">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentSelectModal;
