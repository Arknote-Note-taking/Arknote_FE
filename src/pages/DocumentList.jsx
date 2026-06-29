import React, { useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { Search, Trash2, Plus, Folder, FolderPlus, FolderOpen, FileText, Edit2, RotateCcw, Zap, Pin, Loader2, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import FolderDetailModal from '../components/FolderDetailModal';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3] dark:bg-[#C026D3]/15 dark:text-[#E879F9]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#4ADE80]';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};

const DocumentList = () => {
  const { language, t } = useLanguage();
  const getFilterDisplayName = (filter) => {
    if (filter === 'Tất cả') return language === 'vi' ? '📁 Tất cả danh mục' : '📁 All categories';
    if (filter === 'Nhân sự') return language === 'vi' ? 'Nhân sự' : 'Human Resources';
    if (filter === 'Hành chính') return language === 'vi' ? 'Hành chính' : 'Administration';
    if (filter === 'Pháp luật') return language === 'vi' ? 'Pháp luật' : 'Law';
    if (filter === 'Học tập') return language === 'vi' ? 'Học tập' : 'Study';
    if (filter === 'Khác' || filter?.toLowerCase() === 'khác' || filter?.toLowerCase() === 'other') return language === 'vi' ? 'Khác' : 'Other';
    return filter;
  };

  const getSubjectDisplayName = (subj) => {
    const s = subj || 'Khác';
    const trimmed = s.trim();
    if (trimmed === 'Nhân sự') return language === 'vi' ? 'Nhân sự' : 'Human Resources';
    if (trimmed === 'Hành chính') return language === 'vi' ? 'Hành chính' : 'Administration';
    if (trimmed === 'Pháp luật') return language === 'vi' ? 'Pháp luật' : 'Law';
    if (trimmed === 'Học tập') return language === 'vi' ? 'Học tập' : 'Study';
    if (trimmed === 'Khác' || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'general' || trimmed.toLowerCase() === 'auto' || trimmed.toLowerCase() === 'other') return language === 'vi' ? 'Khác' : 'Other';
    return s;
  };

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: language === 'vi' ? 'Xác nhận' : 'Confirm',
    onConfirm: null
  });

  const triggerConfirm = (title, message, confirmText, onConfirm) => {
    setConfirmData({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState(null);

  const [filters, setFilters] = useState(['Tất cả', 'Nhân sự', 'Hành chính', 'Pháp luật', 'Học tập']);

  // Folders Integration States
  const [viewMode, setViewMode] = useState('documents'); // 'documents' or 'folders'
  const [folders, setFolders] = useState([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isFolderDetailOpen, setIsFolderDetailOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  // Pagination Integration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Pagination for Deleted Documents
  const [deletedCurrentPage, setDeletedCurrentPage] = useState(1);
  const deletedItemsPerPage = 5;

  // Bulk Delete Integration
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Deleted Documents (Admin Only)
  const [deletedDocs, setDeletedDocs] = useState([]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await API.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await API.get('/documents/folders');
      const sharedRes = await API.get('/shares/shared-folders');

      const ownFolders = (res.data || []).map(f => ({ ...f, is_shared: false }));
      const sharedFolders = (sharedRes.data || []).map(f => ({ ...f, is_shared: true }));

      setFolders([...ownFolders, ...sharedFolders]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDeletedDocs = useCallback(async () => {
    try {
      const res = await API.get('/documents/deleted');
      setDeletedDocs(res.data);
    } catch (err) {
      console.error("Lỗi tải danh mục tài liệu đã xóa", err);
    }
  }, []);

  const handleRestoreDoc = (docId, docTitle) => {
    triggerConfirm(
      language === 'vi' ? 'Khôi phục tài liệu?' : 'Restore document?',
      language === 'vi' 
        ? `Bạn có chắc chắn muốn khôi phục tài liệu "${docTitle || 'này'}"? Tài liệu này sẽ hoạt động trở lại bình thường đối với người sở hữu.` 
        : `Are you sure you want to restore the document "${docTitle || 'this'}"? This document will be active again for its owner.`,
      language === 'vi' ? 'Khôi phục ngay' : 'Restore now',
      async () => {
        try {
          await API.post(`/documents/${docId}/restore`);
          toast.success(language === 'vi' ? 'Khôi phục tài liệu thành công!' : 'Document restored successfully!');
          setDeletedDocs(prev => prev.filter(d => d.id !== docId));
          fetchDocuments(); // Refresh active list
        } catch (err) {
          toast.error(err.response?.data?.error || (language === 'vi' ? 'Lỗi khi khôi phục tài liệu!' : 'Error restoring document!'));
        }
      }
    );
  };

  const handleRequestRestoreDoc = (docId, docTitle) => {
    triggerConfirm(
      language === 'vi' ? 'Yêu cầu khôi phục tài liệu?' : 'Request document restoration?',
      language === 'vi' 
        ? `Bạn có chắc chắn muốn gửi yêu cầu khôi phục tài liệu "${docTitle || 'này'}" tới Admin không?` 
        : `Are you sure you want to send a document restoration request for "${docTitle || 'this'}" to the Admin?`,
      language === 'vi' ? 'Gửi yêu cầu' : 'Send request',
      async () => {
        try {
          await API.post(`/documents/${docId}/request-restore`);
          toast.success(language === 'vi' ? 'Đã gửi yêu cầu khôi phục tài liệu thành công!' : 'Restoration request sent successfully!');
          fetchDeletedDocs();
        } catch (err) {
          toast.error(err.response?.data?.error || (language === 'vi' ? 'Lỗi khi gửi yêu cầu khôi phục!' : 'Error sending restoration request!'));
        }
      }
    );
  };

  const handleTogglePin = async (docId, isPinned) => {
    try {
      await API.put(`/documents/${docId}`, { is_pinned: !isPinned });
      toast.success(
        language === 'vi' 
          ? (isPinned ? 'Đã bỏ ghim tài liệu!' : 'Đã ghim tài liệu lên đầu!') 
          : (isPinned ? 'Document unpinned!' : 'Document pinned to top!')
      );
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, is_pinned: !isPinned } : d));
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi thay đổi trạng thái ghim!' : 'Error toggling pin status!');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setDeletedCurrentPage(1);
    setIsSelectMode(false);
    setSelectedDocIds([]);
    if (viewMode === 'deleted') {
      fetchDeletedDocs();
    } else if (viewMode === 'documents') {
      fetchDocuments();
    } else if (viewMode === 'folders') {
      fetchFolders();
    }
  }, [searchQuery, activeFilter, viewMode, fetchDeletedDocs, fetchDocuments, fetchFolders]);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
    fetchDeletedDocs();
  }, [user]);

  useEffect(() => {
    if (documents.length > 0) {
      const defaultFilters = ['Tất cả', 'Nhân sự', 'Hành chính', 'Pháp luật', 'Học tập'];
      const uniqueSubjects = [...new Set(documents.map(d => {
        const sub = d.subject || 'Khác';
        const norm = sub.trim().toLowerCase();
        return (norm === 'auto' || norm === 'general' || norm === 'unknown' || !sub.trim()) ? 'Khác' : sub;
      }).filter(Boolean))];
      const merged = ['Tất cả', ...new Set([...defaultFilters.slice(1), ...uniqueSubjects])];
      setFilters(merged);
    }
  }, [documents]);

  useEffect(() => {
    if (!socket) return;
    const handleCreated = (newDoc) => {
      if (newDoc.user_id !== user?.id) return;
      setDocuments(docs => {
        if (docs.some(d => d.id === newDoc.id)) return docs;
        return [newDoc, ...docs];
      });
      fetchDeletedDocs();
      fetchFolders(); // Sync folders counts
    };
    const handleUpdated = (updatedDoc) => {
      if (updatedDoc.user_id !== user?.id) return;
      setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? { ...d, ...updatedDoc, is_pinned: d.is_pinned } : d));
      fetchFolders();
    };
    const handleDeleted = ({ id }) => {
      setDocuments(docs => docs.filter(d => d.id !== id));
      fetchDeletedDocs();
      fetchFolders();
    };
    const handleUserNotification = (data) => {
      console.log('[Socket] DocumentList received user_notification:', data);
      const recipientId = data.recipient_id || data.recipientId;
      if (recipientId && user && recipientId.toLowerCase() === user.id.toLowerCase()) {
        if (data.type === 'folder_shared' || data.type === 'folder_unshared') {
          fetchFolders();
        }
      }
    };

    socket.on('document_created', handleCreated);
    socket.on('document_updated', handleUpdated);
    socket.on('document_deleted', handleDeleted);
    socket.on('user_notification', handleUserNotification);

    return () => {
      socket.off('document_created', handleCreated);
      socket.off('document_updated', handleUpdated);
      socket.off('document_deleted', handleDeleted);
      socket.off('user_notification', handleUserNotification);
    };
  }, [socket, user, fetchDeletedDocs, fetchFolders]);

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
    triggerConfirm(
      language === 'vi' ? 'Xóa tài liệu này?' : 'Delete this document?',
      language === 'vi' ? 'Tài liệu bị xóa sẽ không thể phục hồi và toàn bộ các liên kết đồ thị ngữ nghĩa liên quan cũng sẽ bị gỡ bỏ.' : 'Deleted documents cannot be recovered and all associated semantic relationship links will be unlinked.',
      language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete',
      async () => {
        try {
          await API.delete(`/documents/${id}`);
          if (user?.role !== 'admin') {
            toast((t) => (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs">{language === 'vi' ? 'Đã xóa tài liệu thành công!' : 'Document deleted successfully!'}</span>
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    try {
                      await API.post(`/documents/${id}/request-restore`);
                      toast.success(language === 'vi' ? "Đã gửi yêu cầu khôi phục tới Admin!" : "Sent restore request to Admin!");
                      fetchDeletedDocs();
                    } catch (err) {
                      toast.error(language === 'vi' ? "Gửi yêu cầu thất bại!" : "Failed to send restore request!");
                    }
                  }}
                  className="bg-primary hover:bg-primary-dark text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Yêu cầu khôi phục' : 'Request restore'}
                </button>
              </div>
            ), { duration: 6000 });
          } else {
            toast.success(language === 'vi' ? "Đã xóa tài liệu thành công!" : "Document deleted successfully!");
          }
        } catch (err) {
          toast.error(err.response?.data?.error || (language === 'vi' ? "Xóa thất bại" : "Delete failed"));
        }
      }
    );
  };

  const handleDeleteFolder = (folderId) => {
    triggerConfirm(
      language === 'vi' ? 'Xóa thư mục này?' : 'Delete this folder?',
      language === 'vi' ? 'Bạn có chắc muốn xóa thư mục này? (Các tài liệu bên trong sẽ không bị xóa, chỉ được đưa ra ngoài thư mục)' : 'Are you sure you want to delete this folder? (Documents inside will not be deleted, they will just be moved outside the folder)',
      language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete',
      async () => {
        try {
          await API.delete(`/documents/folders/${folderId}`);
          toast.success(language === 'vi' ? 'Đã xóa thư mục!' : 'Folder deleted successfully!');
          fetchFolders();
        } catch (err) {
          toast.error(language === 'vi' ? 'Xóa thư mục thất bại' : 'Failed to delete folder');
        }
      }
    );
  };

  const handleOpenFolder = (folderId) => {
    setSelectedFolderId(folderId);
    setIsFolderDetailOpen(true);
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredDocs.map(d => d.id);
    const isAllSelected = allFilteredIds.every(id => selectedDocIds.includes(id));
    if (isAllSelected) {
      setSelectedDocIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedDocIds(allFilteredIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocIds.length === 0) return;
    triggerConfirm(
      language === 'vi' ? `Xóa ${selectedDocIds.length} tài liệu đã chọn?` : `Delete ${selectedDocIds.length} selected documents?`,
      language === 'vi' 
        ? `Các tài liệu bị xóa sẽ được đưa vào thùng rác hệ thống và có thể khôi phục lại bởi Admin.` 
        : `Deleted documents will be moved to the trash and can be restored by the Admin.`,
      language === 'vi' ? `Xác nhận xóa (${selectedDocIds.length})` : `Confirm delete (${selectedDocIds.length})`,
      async () => {
        const toastId = toast.loading(language === 'vi' ? `Đang xóa ${selectedDocIds.length} tài liệu...` : `Deleting ${selectedDocIds.length} documents...`);
        try {
          await Promise.all(selectedDocIds.map(id => API.delete(`/documents/${id}`)));
          toast.success(language === 'vi' ? "Đã xóa các tài liệu thành công!" : "Successfully deleted documents!", { id: toastId });
          setSelectedDocIds([]);
          setIsSelectMode(false);
          fetchDocuments();
        } catch (err) {
          toast.error(language === 'vi' ? "Xóa tài liệu thất bại" : "Failed to delete documents", { id: toastId });
        }
      }
    );
  };

  const filteredDocs = documents.filter(doc => {
    const docSubject = doc.subject || 'Khác';
    const norm = docSubject.trim().toLowerCase();
    const resolvedSubject = (norm === 'auto' || norm === 'general' || norm === 'unknown' || !docSubject.trim()) ? 'Khác' : docSubject;

    // 1. Filter by category tab first
    if (activeFilter !== 'Tất cả' && !resolvedSubject.toLowerCase().includes(activeFilter.toLowerCase())) {
      return false;
    }
    // 2. Instant search filter as you type
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = doc.title?.toLowerCase?.().includes(query);
    const summaryMatch = doc.summary?.toLowerCase?.().includes(query);
    const tagMatch = doc.tags?.some(t => t?.toLowerCase?.().includes(query));
    const subjectMatch = resolvedSubject.toLowerCase().includes(query);
    return titleMatch || summaryMatch || tagMatch || subjectMatch;
  });

  const filteredFolders = folders.filter(f => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return f.name?.toLowerCase().includes(query);
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    // 1. Pinned documents first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // 2. Otherwise sort by created_at descending
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocs = sortedDocs.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedDocs.length / itemsPerPage);

  useEffect(() => {
    const maxPage = Math.max(1, totalPages);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [totalPages, currentPage]);

  const filteredDeletedDocs = deletedDocs.filter(doc => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = doc.title?.toLowerCase?.().includes(query);
    const summaryMatch = doc.summary?.toLowerCase?.().includes(query);
    const ownerMatch = doc.users?.email?.toLowerCase?.().includes(query) || doc.users?.name?.toLowerCase?.().includes(query);
    return titleMatch || summaryMatch || ownerMatch;
  });

  const deletedStartIndex = (deletedCurrentPage - 1) * deletedItemsPerPage;
  const paginatedDeletedDocs = filteredDeletedDocs.slice(deletedStartIndex, deletedStartIndex + deletedItemsPerPage);
  const deletedTotalPages = Math.ceil(filteredDeletedDocs.length / deletedItemsPerPage);

  useEffect(() => {
    const maxPage = Math.max(1, deletedTotalPages);
    if (deletedCurrentPage > maxPage) {
      setDeletedCurrentPage(maxPage);
    }
  }, [deletedTotalPages, deletedCurrentPage]);

  useEffect(() => {
    if (location.state && location.state.viewMode) {
      const targetMode = location.state.viewMode;
      const highlightId = location.state.highlightDocId;

      setViewMode(targetMode);

      if (highlightId) {
        let found = false;

        if (targetMode === 'deleted') {
          if (deletedDocs && deletedDocs.length > 0) {
            const index = filteredDeletedDocs.findIndex(d => d.id === highlightId);
            if (index !== -1) {
              const page = Math.floor(index / deletedItemsPerPage) + 1;
              setDeletedCurrentPage(page);
              setHighlightedId(highlightId);
              found = true;
            } else {
              const rawIndex = deletedDocs.findIndex(d => d.id === highlightId);
              if (rawIndex !== -1) {
                setSearchQuery('');
              }
            }
          }
        } else {
          if (documents && documents.length > 0) {
            const index = sortedDocs.findIndex(d => d.id === highlightId);
            if (index !== -1) {
              const page = Math.floor(index / itemsPerPage) + 1;
              setCurrentPage(page);
              setHighlightedId(highlightId);
              found = true;
            } else {
              const rawIndex = documents.findIndex(d => d.id === highlightId);
              if (rawIndex !== -1) {
                setSearchQuery('');
                setActiveFilter('Tất cả');
              }
            }
          }
        }

        if (found) {
          const timer = setTimeout(() => {
            setHighlightedId(null);
          }, 4000);

          navigate(location.pathname, { replace: true, state: {} });
          return () => clearTimeout(timer);
        }
      }
    }
  }, [location.state, documents, deletedDocs, filteredDocs.length, filteredDeletedDocs.length]);

  return (
    <div className="max-w-[1600px] w-full mx-auto relative">

      {/* 1. Header Navigation and Title */}

      {/* 2. Toggle Tab between Documents and Folders */}
      <div className="flex space-x-1 border-b border-border mb-6">
        <button
          onClick={() => setViewMode('documents')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${viewMode === 'documents'
            ? 'border-b-2 border-primary text-primary font-bold'
            : 'text-text-secondary hover:text-text-primary'
            }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>{language === 'vi' ? 'Tất cả tài liệu' : 'All Documents'} ({documents.length})</span>
          </div>
        </button>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setViewMode('folders')}
            className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${viewMode === 'folders'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4" />
              <span>{language === 'vi' ? 'Thư mục nhóm' : 'Group Folders'} ({folders.length})</span>
            </div>
          </button>
        )}
        <button
          onClick={() => setViewMode('deleted')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${viewMode === 'deleted'
            ? 'border-b-2 border-primary text-primary font-bold'
            : 'text-text-secondary hover:text-text-primary'
            }`}
        >
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>
              {user?.role === 'admin' 
                ? (language === 'vi' ? `Tài liệu đã xóa (${deletedDocs.length})` : `Deleted Documents (${deletedDocs.length})`) 
                : (language === 'vi' ? `Yêu cầu khôi phục (${deletedDocs.length})` : `Restore Requests (${deletedDocs.length})`)
              }
            </span>
          </div>
        </button>
      </div>

      {/* 2.5. Upload Limit Indicator for Non-Pro Users */}
      {user?.role !== 'admin' && !user?.is_pro && (
        <div className="bg-amber-500/15 border border-amber-500/25 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative overflow-hidden">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Zap className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h4 className="font-bold text-text-primary text-sm">
                {language === 'vi' ? 'Giới hạn tải lên tài liệu' : 'Document Upload Limit'}
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                {language === 'vi' 
                  ? <>Bạn đã sử dụng <strong className="text-amber-500">{documents.length} / 50</strong> tài liệu miễn phí.</> 
                  : <>You have used <strong className="text-amber-500">{documents.length} / 50</strong> free documents.</>
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/#pricing')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {language === 'vi' ? 'Nâng cấp PRO để upload không giới hạn' : 'Upgrade to PRO for unlimited uploads'}
          </button>
        </div>
      )}

      {/* 3. Controls & Action Buttons toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'documents' ? (language === 'vi' ? "Nhập để tìm tài liệu, thẻ..." : "Type to search documents, tags...") : (language === 'vi' ? "Nhập để tìm thư mục..." : "Type to search folders...")}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {viewMode === 'documents' && (
          <div className="relative shrink-0">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-surface border border-border text-text-primary text-sm font-semibold rounded-lg px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors shadow-sm"
            >
              {filters.map(filter => (
                <option key={filter} value={filter}>
                  {getFilterDisplayName(filter)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2 justify-end shrink-0 ml-auto">
          {viewMode === 'documents' && (
            <>
              {isSelectMode ? (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="bg-surface border border-border text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {filteredDocs.map(d => d.id).every(id => selectedDocIds.includes(id)) 
                      ? (language === 'vi' ? 'Bỏ chọn tất cả' : 'Deselect all') 
                      : (language === 'vi' ? 'Chọn tất cả' : 'Select all')
                    }
                  </button>
                  <button
                    onClick={() => { setIsSelectMode(false); setSelectedDocIds([]); }}
                    className="bg-surface border border-border text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedDocIds.length === 0}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/40 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{(language === 'vi' ? 'Xóa đã chọn' : 'Delete selected')} ({selectedDocIds.length})</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Create Folder Button */}
                  {user?.role !== 'admin' && (
                    <button
                      onClick={() => setIsCreateFolderOpen(true)}
                      className="bg-[#52B788] hover:bg-[#409c71] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Tạo thư mục' : 'Create Folder'}</span>
                    </button>
                  )}

                  {/* Add Document Button */}
                  {user?.role !== 'admin' && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4.5 h-4.5" />
                      <span>{language === 'vi' ? 'Thêm tài liệu' : 'Add Document'}</span>
                    </button>
                  )}

                  {/* Bulk Delete Trigger Button */}
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 bg-surface px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Xóa nhiều' : 'Bulk Delete'}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. MAIN VIEW CONTENTS */}

      {/* DOCUMENTS VIEW GRID */}
      {viewMode === 'documents' && (
        <div className="space-y-4">
          {paginatedDocs.map(doc => (
            <div
              key={doc.id}
              className={`bg-surface border p-5 rounded-xl transition-all flex justify-between items-start ${isSelectMode || user?.role !== 'admin' ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
                } ${doc.id === highlightedId
                  ? 'highlight-row-active'
                  : selectedDocIds.includes(doc.id)
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm'
                    : 'border-border'
                }`}
              onClick={() => {
                if (isSelectMode) {
                  setSelectedDocIds(prev =>
                    prev.includes(doc.id)
                      ? prev.filter(id => id !== doc.id)
                      : [...prev, doc.id]
                  );
                } else if (user?.role !== 'admin') {
                  navigate(`/documents/${doc.id}`);
                } else {
                  toast.error(language === 'vi' ? 'Admin chỉ quản lý tài liệu, không thể xem chi tiết nội dung tài liệu!' : 'Admins only manage documents and cannot view detailed content!');
                }
              }}
            >
              {isSelectMode && (
                <div className="mr-4 mt-1 shrink-0 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(doc.id)}
                    onChange={() => { }} // handled by parent card onClick
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-1.5">
                    {doc.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                    <span>{doc.title}</span>
                  </h3>
                  <span className="text-[10px] font-semibold text-[#10B981] bg-[#DEF7EC] dark:bg-[#DEF7EC]/10 border border-[#10B981]/20 px-2 py-0.5 rounded text-center leading-none">
                    {language === 'vi' ? 'Đã xử lý' : 'Processed'}
                  </span>
                  {user && user.role !== 'admin' && doc.user_id !== user.id && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 px-2 py-0.5 rounded text-center leading-none">
                      👥 {language === 'vi' ? 'Được chia sẻ' : 'Shared'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-3 max-w-5xl line-clamp-1">{doc.summary || (language === 'vi' ? 'Trích xuất nội dung và phân tích dựa trên AI model...' : 'Extracting content and analyzing with AI...')}</p>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const docSubject = doc.subject || 'Khác';
                    return (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${getTagColor(docSubject)}`}>
                        {getSubjectDisplayName(docSubject)}
                      </span>
                    );
                  })()}
                  {(() => {
                    const expiryTag = doc.tags?.find(t => t?.startsWith('Hạn:') || t?.startsWith('Expiry:'));
                    const otherTags = doc.tags?.filter(t => t !== expiryTag) || [];
                    return (
                      <>
                        {expiryTag && (
                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shadow-sm">
                            <Calendar className="w-3 h-3 text-red-500 shrink-0" />
                            <span>{expiryTag}</span>
                          </span>
                        )}
                        {otherTags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="text-right flex flex-col items-end justify-between h-full">
                <div className="flex items-center space-x-3 mb-1">
                  <p className="text-text-secondary text-xs">{new Date(doc.created_at).toISOString().split('T')[0]}</p>
                  {user?.role !== 'admin' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(doc.id, doc.is_pinned);
                        }}
                        className={`transition-colors p-1 cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center ${doc.is_pinned
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-text-secondary hover:text-primary'
                          }`}
                        title={doc.is_pinned ? (language === 'vi' ? 'Bỏ ghim tài liệu' : 'Unpin document') : (language === 'vi' ? 'Ghim tài liệu lên đầu' : 'Pin document to top')}
                      >
                        <Pin className={`w-4 h-4 ${doc.is_pinned ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/documents/${doc.id}`, { state: { edit: true } });
                        }}
                        className="text-text-secondary hover:text-primary transition-colors p-1 cursor-pointer"
                        title={language === 'vi' ? "Chỉnh sửa tài liệu" : "Edit document"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => initiateDelete(e, doc.id)}
                    className="text-text-secondary hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title={language === 'vi' ? "Xóa tài liệu" : "Delete document"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <p className="text-text-secondary text-sm mt-8 text-center italic">{language === 'vi' ? 'Không tìm thấy tài liệu phù hợp.' : 'No matching documents found.'}</p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Trước' : 'Prev'}
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                      ? 'bg-primary text-white shadow-sm border border-primary'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Sau' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* FOLDERS VIEW GRID */}
      {viewMode === 'folders' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredFolders.map(f => (
            <div
              key={f.id}
              onClick={() => handleOpenFolder(f.id)}
              className="bg-surface border border-border hover:border-primary/45 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-105 transition-transform duration-200">
                  <Folder className="w-6 h-6" />
                </div>

                {!f.is_shared ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                    className="text-text-secondary hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                    title={language === 'vi' ? "Xóa thư mục" : "Delete folder"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-primary-dark/80 bg-primary/10 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Shared
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-text-primary text-base truncate mb-1">{f.name}</h3>
                <p className="text-xs text-text-secondary">
                  {f.is_shared 
                    ? (language === 'vi' ? `Bởi ${f.ownerName || 'Chủ sở hữu'}` : `By ${f.ownerName || 'Owner'}`) 
                    : (language === 'vi' ? `${f.docCount || 0} tài liệu bên trong` : `${f.docCount || 0} documents inside`)
                  }
                </p>
              </div>

              <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 translate-y-8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}

          {filteredFolders.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center p-12 bg-surface border border-border border-dashed rounded-xl">
              <Folder className="w-12 h-12 opacity-20 text-text-secondary mb-3" />
              <p className="text-text-secondary font-medium text-sm">
                {folders.length === 0 
                  ? (language === 'vi' ? "Chưa có thư mục nào được tạo." : "No folders created yet.") 
                  : (language === 'vi' ? "Không tìm thấy thư mục phù hợp." : "No matching folders found.")
                }
              </p>
              <p className="text-xs text-text-secondary/60 mt-1">
                {folders.length === 0
                  ? (language === 'vi' ? 'Nhấp vào "Tạo thư mục" ở trên để gom nhóm các tài liệu và hỏi đáp AI!' : 'Click "Create Folder" above to group documents and chat with AI!')
                  : (language === 'vi' ? 'Hãy thử tìm kiếm với từ khóa khác!' : 'Try searching with another keyword!')
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* DELETED DOCUMENTS VIEW (ADMIN ONLY) */}
      {viewMode === 'deleted' && (
        <div className="space-y-4">
          {paginatedDeletedDocs.map(doc => (
            <div
              key={doc.id}
              className={`bg-surface border p-5 rounded-xl flex justify-between items-start transition-all ${doc.id === highlightedId ? 'highlight-row-active' : 'border-border'
                }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-text-primary text-base truncate">{doc.title}</h3>
                  <span className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-center leading-none whitespace-nowrap shrink-0">
                    {language === 'vi' ? 'Đã xóa' : 'Deleted'}
                  </span>
                  {doc.restore_requested && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded text-center leading-none whitespace-nowrap shrink-0 animate-pulse">
                      {language === 'vi' ? 'Đang yêu cầu khôi phục' : 'Restore requested'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-3 max-w-5xl line-clamp-1">
                  {doc.summary || (language === 'vi' ? 'Trích xuất nội dung và phân tích dựa trên AI model...' : 'Extracting content and analyzing with AI...')}
                </p>
                <div className="flex items-center space-x-3 text-xs text-text-secondary">
                  {user?.role === 'admin' && (
                    <>
                      <span>{language === 'vi' ? 'Chủ sở hữu' : 'Owner'}: <strong>{doc.users?.name || doc.users?.email || (language === 'vi' ? 'Hệ thống' : 'System')}</strong> ({doc.users?.email || 'N/A'})</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{language === 'vi' ? 'Ngày tạo' : 'Created Date'}: {new Date(doc.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center items-end shrink-0 self-center">
                {user?.role === 'admin' ? (
                  <button
                    onClick={() => handleRestoreDoc(doc.id, doc.title)}
                    className="flex items-center space-x-1.5 text-primary hover:bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    title={language === 'vi' ? "Khôi phục tài liệu" : "Restore document"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Khôi phục' : 'Restore'}</span>
                  </button>
                ) : doc.restore_requested ? (
                  <button
                    disabled
                    className="flex items-center space-x-1.5 bg-[#FFFBEB] dark:bg-[#78350F]/20 text-[#D97706] dark:text-[#FBB024] border border-[#FDE68A] dark:border-[#D97706]/30 px-3.5 py-1.5 rounded-lg text-xs font-bold select-none whitespace-nowrap shrink-0 cursor-not-allowed opacity-90 shadow-sm"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'vi' ? 'Đang xử lý' : 'Processing'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestRestoreDoc(doc.id, doc.title)}
                    className="flex items-center space-x-1.5 text-primary hover:bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    title={language === 'vi' ? "Yêu cầu khôi phục tài liệu" : "Request document restore"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Yêu cầu khôi phục' : 'Request restore'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredDeletedDocs.length === 0 && (
            <p className="text-text-secondary text-sm mt-8 text-center italic">{language === 'vi' ? 'Không tìm thấy tài liệu đã xóa phù hợp.' : 'No matching deleted documents found.'}</p>
          )}

          {/* Pagination Controls for Deleted Docs */}
          {deletedTotalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8 py-2">
              <button
                onClick={() => setDeletedCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={deletedCurrentPage === 1}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Trước' : 'Prev'}
              </button>

              {[...Array(deletedTotalPages)].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setDeletedCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${deletedCurrentPage === pageNum
                      ? 'bg-primary text-white shadow-sm border border-primary'
                      : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setDeletedCurrentPage(prev => Math.min(prev + 1, deletedTotalPages))}
                disabled={deletedCurrentPage === deletedTotalPages}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Sau' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. OVERLAYS AND MODALS LIST */}

      <ConfirmModal
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmData.onConfirm}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
      />

      <UploadModal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); fetchDocuments(); }} />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        existingDocs={documents} // Send existing documents list to select from
        onFolderCreated={() => { fetchFolders(); fetchDocuments(); }}
      />

      <FolderDetailModal
        isOpen={isFolderDetailOpen}
        onClose={() => setIsFolderDetailOpen(false)}
        folderId={selectedFolderId}
        onFolderDeleted={() => { fetchFolders(); fetchDocuments(); }}
      />
    </div>
  );
};

export default DocumentList;
