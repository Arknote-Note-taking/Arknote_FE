import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const DocumentSelectModal = ({ isOpen, onClose, documents, onSelect, isMultiSelect = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const ITEMS_PER_PAGE = 4;

  // Clear selections when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

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

  const handleToggleSelect = (docId) => {
    setSelectedIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleConfirmSelection = () => {
    onSelect(selectedIds);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[85vh]">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 rounded-full p-2 transition-colors z-[210]">
          <X className="w-5 h-5"/>
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Chọn tài liệu từ kho</h2>
        <p className="text-text-secondary text-sm mb-6">
          {isMultiSelect 
            ? "Tích chọn một hoặc nhiều tài liệu rồi bấm xác nhận để đưa vào thư mục." 
            : "Chọn một tài liệu đã tải lên để AI tập trung phân tích nội dung."}
        </p>
        
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
          {currentDocs.length > 0 ? currentDocs.map(doc => {
            const isSelected = selectedIds.includes(doc.id);
            return (
              <div 
                key={doc.id}
                onClick={() => {
                  if (isMultiSelect) {
                    handleToggleSelect(doc.id);
                  } else {
                    onSelect(doc.id);
                  }
                }}
                className={`group border rounded-xl p-4 flex items-start space-x-4 cursor-pointer transition-colors ${
                  isSelected && isMultiSelect
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-background hover:bg-black/5'
                }`}
              >
                {isMultiSelect && (
                  <div className="pt-3 shrink-0 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by card container onClick
                      className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary"
                    />
                  </div>
                )}
                
                <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-text-primary text-sm hover:text-primary transition-colors hover:underline block truncate mb-1"
                    title="Xem chi tiết tài liệu trong tab mới"
                  >
                    {doc.title}
                  </a>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-black/5 dark:bg-white/5 text-text-secondary px-2 py-0.5 rounded-md font-medium">{doc.subject || 'General'}</span>
                    <span className="text-xs text-text-secondary">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 line-clamp-1">{doc.summary || 'Chưa có bản tóm tắt...'}</p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-text-secondary text-sm py-10">
              Không tìm thấy tài liệu phù hợp.
            </div>
          )}
        </div>

        {/* Footer actions & Pagination */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border pt-4 gap-4 shrink-0">
          <span className="text-sm text-text-secondary">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)} trong tổng {filteredDocs.length}
          </span>
          <div className="flex items-center space-x-2 self-center">
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

        {isMultiSelect && (
          <div className="flex justify-end mt-4 pt-3 border-t border-border shrink-0">
            <button
              onClick={handleConfirmSelection}
              disabled={selectedIds.length === 0}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Xác nhận thêm ({selectedIds.length} tài liệu)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DocumentSelectModal;
