import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { X, Folder, FileText, Loader2, Trash2, ArrowRight, FolderMinus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import DocumentSelectModal from './DocumentSelectModal';

const FolderDetailModal = ({ isOpen, onClose, folderId, onFolderDeleted }) => {
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for adding documents to folder
  const [allDocs, setAllDocs] = useState([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    onConfirm: null
  });

  const triggerConfirm = (title, message, confirmText, onConfirm) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  const fetchFolderDetails = async () => {
    if (!folderId) return;
    setLoading(true);
    try {
      const res = await API.get(`/documents/folders/${folderId}`);
      setFolder(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải chi tiết thư mục!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && folderId) {
      fetchFolderDetails();
    }
  }, [isOpen, folderId]);

  if (!isOpen) return null;

  const handleDeleteFolder = () => {
    triggerConfirm(
      'Xóa thư mục này?',
      'Bạn có chắc muốn xóa thư mục này? (Các tài liệu bên trong sẽ không bị xóa, chỉ được đưa ra ngoài thư mục)',
      'Xác nhận xóa',
      async () => {
        try {
          await API.delete(`/documents/folders/${folderId}`);
          toast.success('Đã xóa thư mục!');
          if (onFolderDeleted) onFolderDeleted();
          onClose();
        } catch (err) {
          toast.error('Xóa thư mục thất bại');
        }
      }
    );
  };

  const handleRemoveDocFromFolder = (e, docId) => {
    e.stopPropagation();
    triggerConfirm(
      'Xóa khỏi thư mục?',
      'Bạn có chắc muốn xóa tài liệu này khỏi thư mục?',
      'Xóa khỏi thư mục',
      async () => {
        try {
          await API.put(`/documents/${docId}`, { folder_id: null });
          toast.success('Đã xóa tài liệu khỏi thư mục!');
          setFolder(prev => {
            if (!prev) return null;
            return {
              ...prev,
              documents: prev.documents.filter(d => d.id !== docId)
            };
          });
          if (onFolderDeleted) onFolderDeleted();
        } catch (err) {
          toast.error('Xóa tài liệu khỏi thư mục thất bại');
        }
      }
    );
  };

  const handleNavigateToDoc = (docId) => {
    onClose();
    navigate(`/documents/${docId}`);
  };

  const handleOpenAddDocModal = async () => {
    try {
      const res = await API.get('/documents');
      const activeDocIds = folder?.documents?.map(d => d.id) || [];
      const available = res.data.filter(d => !activeDocIds.includes(d.id));
      setAllDocs(available);
      setIsDocModalOpen(true);
    } catch (err) {
      toast.error('Không thể tải danh sách tài liệu.');
    }
  };

  const handleAddDocToFolder = async (selectedIds) => {
    try {
      await API.post(`/documents/folders/${folderId}/add-documents`, { documentIds: selectedIds });
      toast.success(`Đã thêm ${selectedIds.length} tài liệu vào thư mục!`);
      setIsDocModalOpen(false);
      fetchFolderDetails();
      if (onFolderDeleted) onFolderDeleted();
    } catch (err) {
      toast.error('Lỗi khi thêm tài liệu vào thư mục');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[70vh]">
        
        {/* Absolute Close */}
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 rounded-full p-1 transition-colors z-[110]">
          <X className="w-5 h-5"/>
        </button>

        {loading ? (
          <div className="h-64 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !folder ? (
          <div className="h-64 flex justify-center items-center text-text-secondary">
            Thư mục không tồn tại.
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4 shrink-0 pr-10">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-extrabold text-xl text-text-primary leading-tight">{folder.name}</h2>
                  <p className="text-xs text-text-secondary">{folder.documents?.length || 0} tài liệu bên trong</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleOpenAddDocModal}
                  className="flex items-center space-x-1 bg-[#52B788] hover:bg-[#409c71] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tài liệu</span>
                </button>
                <button
                  onClick={handleDeleteFolder}
                  className="flex items-center space-x-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa thư mục</span>
                </button>
              </div>
            </div>

            {/* List of documents in folder */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 py-2">
              {folder.documents?.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => handleNavigateToDoc(doc.id)}
                  className="flex items-center justify-between p-4 bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-2xl cursor-pointer transition-all hover:scale-[1.01] group"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden">
                    <div className="bg-white dark:bg-slate-800 border p-2 rounded-lg text-text-secondary">
                      <FileText className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-extrabold text-sm text-text-primary truncate max-w-[350px]">{doc.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                          {doc.subject}
                        </span>
                        <span className="text-[9px] text-text-secondary">
                          {new Date(doc.created_at).toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => handleRemoveDocFromFolder(e, doc.id)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                      title="Xóa khỏi thư mục"
                    >
                      <FolderMinus className="w-4 h-4" />
                    </button>
                    <div className="text-text-secondary group-hover:text-primary transition-colors pr-2">
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}

              {(!folder.documents || folder.documents.length === 0) && (
                <div className="text-center py-16 text-text-secondary text-sm italic">
                  Không có tài liệu nào trong thư mục này.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Confirmation Dialog Component */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />

      {/* Document Selection Overlay Modal */}
      <DocumentSelectModal 
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documents={allDocs}
        onSelect={handleAddDocToFolder}
        isMultiSelect={true}
      />
    </div>
  );
};

export default FolderDetailModal;
