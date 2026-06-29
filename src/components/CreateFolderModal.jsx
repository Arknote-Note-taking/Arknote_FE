import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { X, Loader2, FolderPlus, Upload, CheckSquare, Square, Folder } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const CreateFolderModal = ({ isOpen, onClose, onFolderCreated, existingDocs = [] }) => {
  const { language } = useLanguage();
  const [folderName, setFolderName] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const getSubjectLabel = (subj) => {
    const s = subj || 'Khác';
    const trimmed = s.trim();
    if (trimmed === 'Nhân sự') return language === 'vi' ? 'Nhân sự' : 'Human Resources';
    if (trimmed === 'Hành chính') return language === 'vi' ? 'Hành chính' : 'Administration';
    if (trimmed === 'Pháp luật') return language === 'vi' ? 'Pháp luật' : 'Law';
    if (trimmed === 'Học tập') return language === 'vi' ? 'Học tập' : 'Study';
    if (trimmed === 'Khác' || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'general' || trimmed.toLowerCase() === 'auto') return language === 'vi' ? 'Khác' : 'Other';
    return s;
  };

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setSelectedDocIds([]);
      setNewFiles([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleDoc = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check duplicates against existing database documents
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
      toast.error(
        language === 'vi' 
          ? `Tài liệu đã tồn tại và không được thêm: \n${duplicates.join(', \n')}`
          : `Document already exists and was not added: \n${duplicates.join(', \n')}`
      );
    }

    if (validFiles.length === 0) return;

    setNewFiles(prevFiles => {
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

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng điền tên thư mục!' : 'Please enter a folder name!');
      return;
    }
    setLoading(true);
    try {
      // 1. Create the folder
      const foldRes = await API.post('/documents/folders', {
        name: folderName.trim(),
        documentIds: selectedDocIds // Automatically associate selected existing documents
      });
      const newFolderId = foldRes.data.id;

      // 2. Upload any new files straight to this folder
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder_id', newFolderId);
          formData.append('subject', 'Auto'); // Default to AI auto tag

          await API.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      toast.success(
        language === 'vi' 
          ? `Đã tạo thư mục "${folderName.trim()}" thành công!` 
          : `Folder "${folderName.trim()}" created successfully!`
      );
      if (onFolderCreated) onFolderCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'vi' ? 'Tạo thư mục thất bại' : 'Failed to create folder'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 rounded-full p-1 transition-colors">
          <X className="w-5 h-5"/>
        </button>

        <h2 className="text-2xl font-bold text-text-primary mb-2 flex items-center space-x-2">
          <FolderPlus className="w-6 h-6 text-primary" />
          <span>{language === 'vi' ? 'Tạo thư mục mới' : 'Create New Folder'}</span>
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          {language === 'vi' ? 'Nhóm các tài liệu lại để hỏi đáp AI tổng hợp.' : 'Group documents to ask questions and summarize using AI.'}
        </p>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          
          {/* 1. Folder Name Input */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              {language === 'vi' ? 'Tên thư mục' : 'Folder Name'}
            </label>
            <input 
              type="text" 
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={language === 'vi' ? "VD: Tài liệu nội bộ, Báo cáo tài chính Q1..." : "e.g. Internal Documents, Q1 Financial Reports..."}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition"
              required
            />
          </div>

          {/* 2. Select Existing Documents Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-secondary uppercase">
                {language === 'vi' ? `Thêm tài liệu sẵn có (${existingDocs.length} tệp)` : `Add existing documents (${existingDocs.length} files)`}
              </label>
              {selectedDocIds.length > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  {language === 'vi' ? `Đã chọn ${selectedDocIds.length} tệp` : `Selected ${selectedDocIds.length} files`}
                </span>
              )}
            </div>
            
            <div className="border border-border rounded-xl bg-background max-h-48 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {existingDocs.map(doc => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div 
                    key={doc.id}
                    onClick={() => handleToggleDoc(doc.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border bg-surface text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {isSelected ? <CheckSquare className="w-4 h-4 shrink-0 text-primary" /> : <Square className="w-4 h-4 shrink-0" />}
                      <span className="text-xs font-semibold truncate max-w-[400px]">{doc.title}</span>
                    </div>
                    <span className="text-[10px] bg-black/5 dark:bg-white/5 border px-2 py-0.5 rounded-md uppercase font-semibold">
                      {getSubjectLabel(doc.subject)}
                    </span>
                  </div>
                );
              })}
              {existingDocs.length === 0 && (
                <p className="text-xs text-text-secondary italic text-center py-6">
                  {language === 'vi' ? 'Chưa có tài liệu nào trong kho lưu trữ của bạn.' : 'No documents in your library yet.'}
                </p>
              )}
            </div>
          </div>

          {/* 3. Upload New Documents Section */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              {language === 'vi' ? 'Hoặc tải lên tệp mới từ máy' : 'Or upload new files from computer'}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 bg-background hover:bg-black/5 dark:hover:bg-white/5 transition flex flex-col items-center justify-center cursor-pointer group"
            >
              <Upload className="w-6 h-6 text-text-secondary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-text-primary">
                {language === 'vi' ? 'Chọn các tệp tin từ máy tính của bạn' : 'Select files from your computer'}
              </span>
              <span className="text-[10px] text-text-secondary mt-1">
                {language === 'vi' 
                  ? 'Hỗ trợ tải lên nhiều file cùng lúc (.pdf, .docx, .xlsx, .pptx, .html, .txt, .png, .jpg)' 
                  : 'Supports uploading multiple files at once (.pdf, .docx, .xlsx, .pptx, .html, .txt, .png, .jpg)'}
              </span>
              <input 
                type="file" 
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.pptx,.html,.htm,.txt,.png,.jpg,.jpeg"
                className="hidden" 
              />
            </div>

            {newFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary">
                    {language === 'vi' ? `Các tệp mới đã chọn (${newFiles.length}):` : `New selected files (${newFiles.length}):`}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary font-extrabold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{language === 'vi' ? '+ Chọn thêm tệp' : '+ Select more files'}</span>
                  </button>
                </div>
                
                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1.5">
                  {newFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs">
                      <span className="truncate max-w-[320px] font-medium text-text-primary">{file.name}</span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-primary bg-primary/20 px-2 py-0.5 rounded-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button 
                          type="button"
                          onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-text-secondary hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                          title={language === 'vi' ? "Bỏ tệp này" : "Remove this file"}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="border-t border-border pt-4 mt-4 flex justify-end space-x-3 shrink-0">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            {language === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button 
            onClick={handleCreate} 
            disabled={loading || !folderName.trim()}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>
              {loading 
                ? (language === 'vi' ? 'Đang tạo & Tải tệp...' : 'Creating & Uploading...') 
                : (language === 'vi' ? 'Xác nhận tạo thư mục' : 'Confirm Create Folder')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateFolderModal;
