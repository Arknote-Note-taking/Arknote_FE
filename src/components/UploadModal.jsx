import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UploadModal = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subject, setSubject] = useState('Auto');
  const [customSubject, setCustomSubject] = useState('');
  
  // Folders support
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [existingDocs, setExistingDocs] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setFiles([]);
      setSubject('Auto');
      setCustomSubject('');
      setSelectedFolderId('');
      setCreateNewFolder(false);
      setNewFolderName('');
      setError(null);

      // Fetch folders list
      API.get('/documents/folders')
        .then(res => setFolders(res.data))
        .catch(err => console.error(err));

      // Fetch existing documents list to check duplicates
      API.get('/documents')
        .then(res => setExistingDocs(res.data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    setLoading(true);
    setError(null);
    try {
      // 1. Check if we need to create a folder first
      let folderId = selectedFolderId;
      if (createNewFolder && newFolderName.trim()) {
        const foldRes = await API.post('/documents/folders', { name: newFolderName.trim() });
        folderId = foldRes.data.id;
      }

      // 2. Upload all files concurrently in parallel
      await Promise.all(
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
          
          return API.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        })
      );
      
      // Realtime syncing will pick this up automatically!
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
      setFiles([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 rounded-full p-1 transition-colors">
          <X className="w-5 h-5"/>
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Tải tài liệu lên</h2>
        <p className="text-text-secondary text-sm mb-6">Tải lên file PDF hoặc Hình ảnh để lưu trữ và phân tích AI.</p>
        
        {/* Subject select block */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Danh mục</label>
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="Auto">✨ AI Tự động nhận diện</option>
            <option value="Nhân sự">Nhân sự</option>
            <option value="Hành chính">Hành chính</option>
            <option value="Pháp luật">Pháp luật</option>
            <option value="Học tập">Học tập</option>
            <option value="Khác">Khác (Tự điền...)</option>
          </select>
        </div>

        {/* Custom Subject Input */}
        {subject === 'Khác' && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary mb-1">Tên danh mục riêng của bạn (Chỉ bạn thấy)</label>
            <input 
              type="text" 
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="VD: Tài chính, Dự án A, Công nghệ..."
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Folders Selection */}
        <div className="mb-4 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">Thêm vào Thư mục</label>
            <button
              type="button"
              onClick={() => setCreateNewFolder(!createNewFolder)}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              {createNewFolder ? "Chọn thư mục sẵn có" : "✨ Tạo thư mục mới"}
            </button>
          </div>

          {createNewFolder ? (
            <div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nhập tên thư mục mới..."
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          ) : (
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- Không phân vào thư mục --</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
        
        {/* Upload dropzone block */}
        <div 
          className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer group"
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
          <div className="mt-4">
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
            
            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1.5">
              {files.map((file, idx) => (
                <div key={idx} className="p-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl flex items-center justify-between text-xs">
                  <span className="text-text-primary truncate font-medium max-w-[220px]">{file.name}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] text-primary bg-primary/20 px-2 py-0.5 rounded-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
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

        {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">{error}</div>}

        <button 
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          className="w-full mt-6 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium py-3 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải lên & Phân tích ({files.length} tệp)...</span>
            </span>
          ) : (
            `Tải lên & Xử lý (${files.length} tệp)`
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
