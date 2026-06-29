import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { X, Folder, FileText, Loader2, Trash2, ArrowRight, FolderMinus, Plus, Edit2, Send, Share2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import DocumentSelectModal from './DocumentSelectModal';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const FolderDetailModal = ({ isOpen, onClose, folderId, onFolderDeleted }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { language } = useLanguage();
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sharing states
  const [showShareSection, setShowShareSection] = useState(false);
  const [shares, setShares] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');

  // States for adding documents to folder
  const [allDocs, setAllDocs] = useState([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Folder Rename & Selection states
  const [isEditingName, setIsEditingName] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);

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

  // Reset selected docs and editing state when modal opens/closes or folderId changes
  useEffect(() => {
    setSelectedDocIds([]);
    setIsEditingName(false);
    setShowShareSection(false);
  }, [isOpen, folderId]);

  const handleRenameFolder = async (e) => {
    e.preventDefault();
    if (!renameInput.trim() || renameInput.trim() === folder.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await API.put(`/documents/folders/${folderId}`, { name: renameInput.trim() });
      toast.success(language === 'vi' ? 'Đổi tên thư mục thành công!' : 'Folder renamed successfully!');
      setFolder(prev => ({ ...prev, name: res.data.name }));
      setIsEditingName(false);
      if (onFolderDeleted) onFolderDeleted(); // triggers parent refresh
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi đổi tên thư mục' : 'Error renaming folder');
    }
  };

  const handleToggleDocSelect = (docId) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAllDocs = () => {
    if (selectedDocIds.length === folder.documents?.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(folder.documents?.map(d => d.id) || []);
    }
  };

  const handleBulkRemoveDocs = () => {
    if (selectedDocIds.length === 0) return;
    triggerConfirm(
      language === 'vi' ? 'Xóa các tài liệu đã chọn?' : 'Remove selected documents?',
      language === 'vi' 
        ? `Bạn có chắc muốn loại bỏ ${selectedDocIds.length} tài liệu đã chọn khỏi thư mục này?` 
        : `Are you sure you want to remove the ${selectedDocIds.length} selected documents from this folder?`,
      language === 'vi' ? 'Loại bỏ' : 'Remove',
      async () => {
        try {
          await Promise.all(selectedDocIds.map(docId => API.put(`/documents/${docId}`, { folder_id: null })));
          toast.success(
            language === 'vi' 
              ? `Đã loại bỏ thành công ${selectedDocIds.length} tài liệu khỏi thư mục!` 
              : `Successfully removed ${selectedDocIds.length} documents from the folder!`
          );
          setSelectedDocIds([]);
          // Refresh details
          fetchFolderDetails();
          if (onFolderDeleted) onFolderDeleted();
        } catch (err) {
          toast.error(language === 'vi' ? 'Có lỗi xảy ra khi loại bỏ tài liệu' : 'An error occurred while removing documents');
        }
      }
    );
  };

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
      if (res.data && res.data.user_id === user?.id) {
        fetchShares();
      }
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi tải chi tiết thư mục!' : 'Failed to load folder details!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    try {
      const res = await API.get(`/shares/folders/${folderId}/shares`);
      setShares(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareFolder = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return toast.error(language === 'vi' ? 'Vui lòng điền email!' : 'Please enter an email address!');
    try {
      await API.post('/shares/folders/share', {
        folderId,
        sharedToEmail: shareEmail.trim(),
        permissionRole: shareRole
      });
      toast.success(language === 'vi' ? 'Chia sẻ thư mục thành công!' : 'Folder shared successfully!');
      setShareEmail('');
      fetchShares();
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'vi' ? 'Lỗi khi chia sẻ thư mục.' : 'Error sharing folder.'));
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      await API.delete(`/shares/folders/shares/${shareId}`);
      toast.success(language === 'vi' ? 'Đã thu hồi quyền truy cập.' : 'Access revoked.');
      fetchShares();
    } catch (err) {
      toast.error(language === 'vi' ? 'Không thể thu hồi quyền chia sẻ.' : 'Failed to revoke folder share.');
    }
  };

  const handleChangeSharePermission = async (shareId, newRole) => {
    try {
      await API.put(`/shares/folders/shares/${shareId}`, { permissionRole: newRole });
      toast.success(language === 'vi' ? 'Cập nhật quyền truy cập thành công!' : 'Access permission updated successfully!');
      fetchShares();
    } catch (err) {
      toast.error(language === 'vi' ? 'Không thể cập nhật quyền chia sẻ.' : 'Failed to update folder share permission.');
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
      language === 'vi' ? 'Xóa thư mục này?' : 'Delete this folder?',
      language === 'vi' 
        ? 'Bạn có chắc muốn xóa thư mục này? (Các tài liệu bên trong sẽ không bị xóa, chỉ được đưa ra ngoài thư mục)' 
        : 'Are you sure you want to delete this folder? (Documents inside will not be deleted, they will just be moved outside)',
      language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete',
      async () => {
        try {
          await API.delete(`/documents/folders/${folderId}`);
          toast.success(language === 'vi' ? 'Đã xóa thư mục!' : 'Folder deleted!');
          if (onFolderDeleted) onFolderDeleted();
          onClose();
        } catch (err) {
          toast.error(language === 'vi' ? 'Xóa thư mục thất bại' : 'Failed to delete folder');
        }
      }
    );
  };

  const handleRemoveDocFromFolder = (e, docId) => {
    e.stopPropagation();
    triggerConfirm(
      language === 'vi' ? 'Xóa khỏi thư mục?' : 'Remove from folder?',
      language === 'vi' ? 'Bạn có chắc muốn xóa tài liệu này khỏi thư mục?' : 'Are you sure you want to remove this document from the folder?',
      language === 'vi' ? 'Xóa khỏi thư mục' : 'Remove',
      async () => {
        try {
          await API.put(`/documents/${docId}`, { folder_id: null });
          toast.success(language === 'vi' ? 'Đã xóa tài liệu khỏi thư mục!' : 'Document removed from folder!');
          setFolder(prev => {
            if (!prev) return null;
            return {
              ...prev,
              documents: prev.documents.filter(d => d.id !== docId)
            };
          });
          if (onFolderDeleted) onFolderDeleted();
        } catch (err) {
          toast.error(language === 'vi' ? 'Xóa tài liệu khỏi thư mục thất bại' : 'Failed to remove document from folder');
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
      toast.error(language === 'vi' ? 'Không thể tải danh sách tài liệu.' : 'Failed to load document list.');
    }
  };

  const handleAddDocToFolder = async (selectedIds) => {
    try {
      await API.post(`/documents/folders/${folderId}/add-documents`, { documentIds: selectedIds });
      toast.success(
        language === 'vi' 
          ? `Đã thêm ${selectedIds.length} tài liệu vào thư mục!` 
          : `Successfully added ${selectedIds.length} documents to the folder!`
      );
      setIsDocModalOpen(false);
      fetchFolderDetails();
      if (onFolderDeleted) onFolderDeleted();
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi thêm tài liệu vào thư mục' : 'Error adding documents to folder');
    }
  };

  const handleClearCurrentFolderDocs = () => {
    triggerConfirm(
      language === 'vi' ? 'Gỡ bỏ tất cả tài liệu khỏi thư mục?' : 'Remove all documents from folder?',
      language === 'vi' 
        ? `Bạn có chắc muốn loại bỏ toàn bộ tài liệu khỏi thư mục "${folder?.name}"? (Tài liệu gốc vẫn được giữ nguyên trong kho tài liệu)` 
        : `Are you sure you want to remove all documents from the folder "${folder?.name}"? (Original files will remain in your library)`,
      language === 'vi' ? 'Xác nhận gỡ bỏ' : 'Confirm Remove',
      async () => {
        try {
          await API.post('/documents/folders/clear-documents', { folderIds: [folderId] });
          toast.success(language === 'vi' ? 'Đã gỡ bỏ toàn bộ tài liệu khỏi thư mục!' : 'All documents removed from folder!');
          fetchFolderDetails();
          if (onFolderDeleted) onFolderDeleted();
        } catch (err) {
          toast.error(err.response?.data?.error || (language === 'vi' ? 'Lỗi khi xóa tài liệu khỏi thư mục' : 'Error removing documents from folder'));
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[70vh]">

        {/* Absolute Close */}
        <button onClick={onClose} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5 rounded-full p-1 transition-colors z-[110]">
          <X className="w-5 h-5" />
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

            <div className="flex justify-between items-center border-b border-border pb-4 mb-4 shrink-0 pr-10">
              <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                {isEditingName ? (
                  <form onSubmit={handleRenameFolder} className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary text-text-primary font-semibold flex-1 min-w-0"
                      autoFocus
                    />
                    <button type="submit" className="text-primary hover:text-primary-dark font-bold text-xs shrink-0 cursor-pointer">{language === 'vi' ? 'Lưu' : 'Save'}</button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="text-text-secondary hover:text-text-primary text-xs shrink-0 cursor-pointer">{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                  </form>
                ) : (
                  <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-xl text-text-primary leading-tight truncate max-w-[200px]">{folder.name}</h2>
                      <p className="text-xs text-text-secondary">
                        {folder.documents?.length || 0} {language === 'vi' ? 'tài liệu bên trong' : 'documents inside'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setIsEditingName(true); setRenameInput(folder.name); }}
                      className="text-text-secondary hover:text-primary transition-colors p-1 cursor-pointer shrink-0"
                      title={language === 'vi' ? "Đổi tên thư mục" : "Rename folder"}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {folder.user_id === user?.id && (
                  <button
                    onClick={() => setShowShareSection(!showShareSection)}
                    className="flex items-center space-x-1 bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Chia sẻ' : 'Share'}</span>
                  </button>
                )}
                <button
                  onClick={handleOpenAddDocModal}
                  className="flex items-center space-x-1 bg-[#52B788] hover:bg-[#409c71] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Thêm tài liệu' : 'Add document'}</span>
                </button>
                {folder.user_id === user?.id && (
                  <button
                    onClick={handleDeleteFolder}
                    className="flex items-center space-x-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xóa thư mục' : 'Delete folder'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sharing UI Section */}
            {showShareSection && folder.user_id === user?.id && (
              <div className="bg-background border border-border rounded-xl p-4 mb-4 shrink-0 space-y-3">
                <h4 className="text-xs font-bold text-text-primary flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{language === 'vi' ? 'Quản lý chia sẻ thành viên nhóm' : 'Manage sharing with group members'}</span>
                </h4>
                <form onSubmit={handleShareFolder} className="flex gap-2">
                  <input
                    type="email"
                    placeholder={language === 'vi' ? "Nhập email bạn học..." : "Enter classmate email..."}
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    className="bg-surface border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-text-primary flex-1"
                  />
                  <select
                    value={shareRole}
                    onChange={e => setShareRole(e.target.value)}
                    className="bg-surface border border-border rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-primary text-text-primary"
                  >
                    <option value="viewer">Viewer ({language === 'vi' ? 'Xem' : 'View'})</option>
                    <option value="editor">Editor ({language === 'vi' ? 'Sửa' : 'Edit'})</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Gửi' : 'Send'}</span>
                  </button>
                </form>
                
                {/* List of current shares */}
                {shares.length > 0 && (
                  <div className="max-h-24 overflow-y-auto divide-y divide-border pr-1 custom-scrollbar">
                    {shares.map(sh => (
                      <div key={sh.id} className="py-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-text-primary font-medium truncate max-w-[240px]">{sh.shared_to_email}</span>
                        <div className="flex items-center space-x-3 shrink-0">
                          <select
                            value={sh.permission_role}
                            onChange={(e) => handleChangeSharePermission(sh.id, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 text-text-secondary text-[10px] px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-border cursor-pointer font-bold"
                          >
                            <option value="viewer">Viewer ({language === 'vi' ? 'Xem' : 'View'})</option>
                            <option value="editor">Editor ({language === 'vi' ? 'Sửa' : 'Edit'})</option>
                          </select>
                          <button
                            onClick={() => handleRevokeShare(sh.id)}
                            className="text-red-500 hover:text-red-600 font-bold transition cursor-pointer"
                          >
                            {language === 'vi' ? 'Thu hồi' : 'Revoke'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bulk actions and list header */}
            {folder.documents?.length > 0 && (
              <div className="flex justify-between items-center px-2 mb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={folder.documents?.length > 0 && selectedDocIds.length === folder.documents.length}
                    onChange={handleSelectAllDocs}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary"
                  />
                  <span className="text-xs font-semibold text-text-secondary">
                    {selectedDocIds.length > 0 
                      ? (language === 'vi' ? `Đã chọn ${selectedDocIds.length} tài liệu` : `Selected ${selectedDocIds.length} documents`) 
                      : (language === 'vi' ? 'Chọn tất cả tài liệu' : 'Select all documents')}
                  </span>
                </div>
                {selectedDocIds.length > 0 && (
                  <button
                    onClick={handleBulkRemoveDocs}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm animate-pulse"
                  >
                    <FolderMinus className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xóa khỏi thư mục' : 'Remove from folder'}</span>
                  </button>
                )}
              </div>
            )}

            {/* List of documents in folder */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 py-2">
              {folder.documents?.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl transition-all hover:scale-[1.01] group"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden flex-1 mr-4">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleDocSelect(doc.id);
                      }}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary shrink-0"
                    />
                    <div
                      onClick={() => handleNavigateToDoc(doc.id)}
                      className="flex items-center space-x-3.5 overflow-hidden cursor-pointer flex-1"
                    >
                      <div className="bg-white dark:bg-slate-800 border p-2 rounded-lg text-text-secondary shrink-0">
                        <FileText className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-extrabold text-sm text-text-primary truncate max-w-[280px] hover:text-primary hover:underline transition-colors">{doc.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                            {getSubjectLabel(doc.subject)}
                          </span>
                          <span className="text-[9px] text-text-secondary">
                            {new Date(doc.created_at).toISOString().split('T')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={(e) => handleRemoveDocFromFolder(e, doc.id)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                      title={language === 'vi' ? "Xóa khỏi thư mục" : "Remove from folder"}
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
                  {language === 'vi' ? 'Không có tài liệu nào trong thư mục này.' : 'No documents in this folder.'}
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
        folderId={folderId}
        onUploadSuccess={fetchFolderDetails}
      />
    </div>
  );
};

export default FolderDetailModal;
