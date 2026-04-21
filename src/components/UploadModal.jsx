import React, { useState, useRef } from 'react';
import API from '../services/api';
import { UploadCloud, X, Loader2 } from 'lucide-react';

const UploadModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subject, setSubject] = useState('Auto');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (subject !== 'Auto') {
         formData.append('subject', subject);
      }
      
      await API.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Realtime syncing will pick this up automatically!
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 rounded-full p-1 transition-colors">
          <X className="w-5 h-5"/>
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Tải tài liệu lên</h2>
        <p className="text-text-secondary text-sm mb-6">Tải lên file PDF hoặc Hình ảnh để lưu trữ và phân tích AI.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Danh mục (Tùy chọn)</label>
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
            <option value="Khác">Khác</option>
          </select>
        </div>
        
        <div 
          className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-primary/10 p-4 rounded-full text-primary group-hover:scale-110 transition-transform mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-text-primary font-medium">Nhấp để chọn hoặc kéo thả file vào đây</p>
          <p className="text-text-secondary text-xs mt-2 text-center">Hỗ trợ .pdf, .png, .jpg (Tối đa 10MB)</p>
          
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,.png,.jpg,.jpeg"
          />
        </div>

        {file && (
          <div className="mt-4 p-3 bg-black/5 border border-border rounded-xl flex items-center justify-between">
            <span className="text-sm text-text-primary truncate font-medium">{file.name}</span>
            <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl text-sm">{error}</div>}

        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full mt-6 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium py-3 rounded-xl flex items-center justify-center transition-all"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải lên & Phân tích...</span>
            </span>
          ) : (
            'Tải lên & Xử lý'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
