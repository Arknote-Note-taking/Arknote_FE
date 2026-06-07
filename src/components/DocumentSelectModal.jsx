import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, FileText, ChevronLeft, ChevronRight, UploadCloud, Loader2 } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';

const DocumentSelectModal = ({ 
  isOpen, 
  onClose, 
  documents, 
  onSelect, 
  isMultiSelect = false,
  folderId = null,
  onUploadSuccess = null
}) => {
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Upload states
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [subject, setSubject] = useState('Auto');
  const [customSubject, setCustomSubject] = useState('');
  const [existingDocs, setExistingDocs] = useState([]);
  
  const fileInputRef = useRef(null);
  const ITEMS_PER_PAGE = 4;

  // Clear selections and reset upload states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setActiveTab('library');
      setFiles([]);
      setSubject('Auto');
      setCustomSubject('');
      setUploadError(null);
      setCurrentPage(1);
      setSearchQuery('');

      // Pre-fetch all documents for duplicate checking
      API.get('/documents')
        .then(res => setExistingDocs(res.data))
        .catch(err => console.error('Error pre-fetching documents:', err));
    }
  }, [isOpen]);

  // Filter documents unconditionally so Hook order is unchanged
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents || [];
    const lowerQ = searchQuery.toLowerCase();
    return (documents || []).filter(doc => 
      doc.title?.toLowerCase().includes(lowerQ) || 
      doc.subject?.toLowerCase().includes(lowerQ)
    );
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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check duplicates against database
    const duplicates = [];
    const validFiles = [];

    selectedFiles.forEach(file => {
      const isAlreadyUploaded = existingDocs.some(d => d.title === file.name);
      if (isAlreadyUploaded) {
        duplicates.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (duplicates.length > 0) {
      toast.error(`Tài liệu đã tồn tại và không được thêm: \n${duplicates.join(', \n')}`);
    }

    if (validFiles.length === 0) return;

    setFiles(prevFiles => {
      const merged = [...prevFiles];
      validFiles.forEach(newFile => {
        const isDuplicateLocal = merged.some(f => f.name === newFile.name && f.size === newFile.size);
        if (!isDuplicateLocal) {
          merged.push(newFile);
        }
      });
      return merged;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploadedDocs = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          // Determine subject
          if (subject !== 'Auto') {
            formData.append('subject', subject === 'Khác' ? customSubject.trim() || 'Khác' : subject);
          } else {
            formData.append('subject', 'Auto');
          }
          
          // Add folder if any
          if (folderId) {
            formData.append('folder_id', folderId);
          }
          
          const res = await API.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return res.data;
        })
      );
      
      toast.success(`Đã tải lên & nạp thành công ${files.length} tài liệu vào thư mục!`);
      setFiles([]);
      
      if (onUploadSuccess) {
        onUploadSuccess(uploadedDocs);
      }
      onClose();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Tải tài liệu thất bại');
      toast.error('Lỗi khi tải tài liệu lên!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[85vh]">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 rounded-full p-2 transition-colors z-[210]">
          <X className="w-5 h-5"/>
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Thêm tài liệu vào thư mục</h2>
        <p className="text-text-secondary text-sm mb-6">
          Chọn tài liệu đã có sẵn trong kho lưu trữ hoặc tải lên trực tiếp các tệp tin mới từ máy tính của bạn.
        </p>

        {/* Tab Selector - Only display if folderId is passed */}
        {folderId && (
          <div className="flex border-b border-border mb-5 shrink-0">
            <button 
              type="button"
              onClick={() => {
                setActiveTab('library');
                setUploadError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'library' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              📂 Chọn từ kho tài liệu
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'upload' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              💻 Tải lên từ máy tính
            </button>
          </div>
        )}
        
        {activeTab === 'library' ? (
          <>
            <div className="relative mb-4 shrink-0">
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
                Hiển thị {filteredDocs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)} trong tổng {filteredDocs.length}
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
          </>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto pr-1 custom-scrollbar">
            {/* Subject Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Danh mục</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="Auto">✨ AI Tự động nhận diện</option>
                <option value="Nhân sự">Nhân sự</option>
                <option value="Hành chính">Hành chính</option>
                <option value="Pháp luật">Pháp luật</option>
                <option value="Học tập">Học tập</option>
                <option value="Khác">Khác (Tự điền...)</option>
              </select>
            </div>

            {/* Custom Subject */}
            {subject === 'Khác' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-text-secondary mb-1">Tên danh mục riêng của bạn (Chỉ bạn thấy)</label>
                <input 
                  type="text" 
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="VD: Tài chính, Dự án A, Công nghệ..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Dropzone */}
            <div 
              className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer group mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-text-primary text-sm font-medium">Nhấp để chọn hoặc kéo thả các file vào đây</p>
              <p className="text-text-secondary text-[10px] mt-1 text-center">Hỗ trợ tải lên nhiều file cùng lúc (.pdf, .png, .jpg)</p>
              
              <input 
                type="file" 
                multiple
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </div>

            {/* Selected files listing */}
            {files.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary">Các tệp đã chọn ({files.length}):</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary font-extrabold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>+ Chọn thêm tệp</span>
                  </button>
                </div>
                
                <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5">
                  {files.map((file, idx) => (
                    <div key={idx} className="p-3 bg-background border border-border rounded-xl flex items-center justify-between text-xs">
                      <span className="text-text-primary truncate font-semibold max-w-[320px]">{file.name}</span>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[10px] text-primary bg-primary/15 font-bold px-2 py-0.5 rounded-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button 
                          type="button"
                          onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-text-secondary hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                          title="Bỏ tệp này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                {uploadError}
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="w-full mt-auto bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              {uploading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tải lên & Phân tích bằng AI ({files.length} tệp)...</span>
                </span>
              ) : (
                `Tải lên & Thêm vào thư mục (${files.length} tệp)`
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DocumentSelectModal;

