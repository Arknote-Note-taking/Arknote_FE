import React, { useState, useMemo } from 'react';
import { X, Search, Folder, ChevronLeft, ChevronRight } from 'lucide-react';

const FolderSelectModal = ({ isOpen, onClose, folders, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders || [];
    const lowerQ = searchQuery.toLowerCase();
    return (folders || []).filter(f => f.name?.toLowerCase().includes(lowerQ));
  }, [folders, searchQuery]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(filteredFolders.length / ITEMS_PER_PAGE) || 1;
  const currentFolders = filteredFolders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(c => c + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(c => c - 1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 rounded-full p-2 transition-colors">
          <X className="w-5 h-5"/>
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Chọn thư mục để hỏi đáp</h2>
        <p className="text-text-secondary text-sm mb-6">Chọn thư mục nhóm có sẵn để AI tập trung phân tích nội dung tổng hợp từ tất cả tài liệu bên trong.</p>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm theo tên thư mục..."
            className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* List of Folders */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar mb-4 pr-1">
          {currentFolders.length > 0 ? currentFolders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => onSelect(folder.id)}
              className="group border border-border bg-background hover:bg-black/5 rounded-xl p-4 flex items-start space-x-4 cursor-pointer transition-colors"
            >
              <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-105 transition-transform">
                <Folder className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary text-sm truncate">{folder.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-black/5 text-text-secondary px-2 py-0.5 rounded-md font-medium">
                    {folder.docCount || folder.documents?.length || 0} tài liệu
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(folder.created_at || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-text-secondary text-sm py-10">
              Không tìm thấy thư mục phù hợp.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-border pt-4 shrink-0">
          <span className="text-sm text-text-secondary">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredFolders.length)} trong tổng {filteredFolders.length}
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

export default FolderSelectModal;
