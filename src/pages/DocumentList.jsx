import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { Search, Trash2, Plus, Folder, FolderPlus, FolderOpen, FileText, Edit2, RotateCcw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import FolderDetailModal from '../components/FolderDetailModal';
import { AuthContext } from '../context/AuthContext';

const getTagColor = (subject) => {
  const s = subject?.toLowerCase?.() || '';
  if (s.includes('nhân sự')) return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]';
  if (s.includes('hành chính')) return 'bg-[#FAE8FF] text-[#C026D3] dark:bg-[#C026D3]/15 dark:text-[#E879F9]';
  if (s.includes('pháp luật')) return 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]';
  if (s.includes('học tập')) return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/15 dark:text-[#4ADE80]';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
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

  const [filters, setFilters] = useState(['Tất cả', 'Nhân sự', 'Hành chính', 'Pháp luật', 'Học tập']);

  // Folders Integration States
  const [viewMode, setViewMode] = useState('documents'); // 'documents' or 'folders'
  const [folders, setFolders] = useState([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isFolderDetailOpen, setIsFolderDetailOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  // Pagination Integration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Bulk Delete Integration
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Deleted Documents (Admin Only)
  const [deletedDocs, setDeletedDocs] = useState([]);

  const fetchDeletedDocs = async () => {
    try {
      const res = await API.get('/documents/deleted');
      setDeletedDocs(res.data);
    } catch (err) {
      console.error("Lỗi tải danh mục tài liệu đã xóa", err);
    }
  };

  const handleRestoreDoc = (docId, docTitle) => {
    triggerConfirm(
      'Khôi phục tài liệu?',
      `Bạn có chắc chắn muốn khôi phục tài liệu "${docTitle || 'này'}"? Tài liệu này sẽ hoạt động trở lại bình thường đối với người sở hữu.`,
      'Khôi phục ngay',
      async () => {
        try {
          await API.post(`/documents/${docId}/restore`);
          toast.success('Khôi phục tài liệu thành công!');
          setDeletedDocs(prev => prev.filter(d => d.id !== docId));
          fetchDocuments(); // Refresh active list
        } catch (err) {
          toast.error('Lỗi khi khôi phục tài liệu!');
        }
      }
    );
  };

  useEffect(() => {
    setCurrentPage(1);
    setIsSelectMode(false);
    setSelectedDocIds([]);
  }, [searchQuery, activeFilter, viewMode]);

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await API.get('/documents/folders');
      setFolders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
    if (user?.role === 'admin') {
      fetchDeletedDocs();
    }
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
      setDocuments(docs => [newDoc, ...docs]);
      fetchFolders(); // Sync folders counts
    };
    const handleUpdated = (updatedDoc) => {
      setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      fetchFolders();
    };
    const handleDeleted = ({ id }) => {
      setDocuments(docs => docs.filter(d => d.id !== id));
      fetchFolders();
    };

    socket.on('document_created', handleCreated);
    socket.on('document_updated', handleUpdated);
    socket.on('document_deleted', handleDeleted);

    return () => {
      socket.off('document_created', handleCreated);
      socket.off('document_updated', handleUpdated);
      socket.off('document_deleted', handleDeleted);
    };
  }, [socket]);

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
      'Xóa tài liệu này?',
      'Tài liệu bị xóa sẽ không thể phục hồi và toàn bộ các liên kết đồ thị ngữ nghĩa liên quan cũng sẽ bị gỡ bỏ.',
      'Xác nhận xóa',
      async () => {
        try {
          await API.delete(`/documents/${id}`);
          toast.success("Đã xóa tài liệu thành công!");
        } catch (err) {
          toast.error(err.response?.data?.error || "Xóa thất bại");
        }
      }
    );
  };

  const handleDeleteFolder = (folderId) => {
    triggerConfirm(
      'Xóa thư mục này?',
      'Bạn có chắc muốn xóa thư mục này? (Các tài liệu bên trong sẽ không bị xóa, chỉ được đưa ra ngoài thư mục)',
      'Xác nhận xóa',
      async () => {
        try {
          await API.delete(`/documents/folders/${folderId}`);
          toast.success('Đã xóa thư mục!');
          fetchFolders();
        } catch (err) {
          toast.error('Xóa thư mục thất bại');
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
      `Xóa ${selectedDocIds.length} tài liệu đã chọn?`,
      `Các tài liệu bị xóa sẽ được đưa vào thùng rác hệ thống và có thể khôi phục lại bởi Admin.`,
      `Xác nhận xóa (${selectedDocIds.length})`,
      async () => {
        const toastId = toast.loading(`Đang xóa ${selectedDocIds.length} tài liệu...`);
        try {
          await Promise.all(selectedDocIds.map(id => API.delete(`/documents/${id}`)));
          toast.success("Đã xóa các tài liệu thành công!", { id: toastId });
          setSelectedDocIds([]);
          setIsSelectMode(false);
          fetchDocuments();
        } catch (err) {
          toast.error("Xóa tài liệu thất bại", { id: toastId });
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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);

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

  return (
    <div className="max-w-[1600px] w-full mx-auto relative">

      {/* 1. Header Navigation and Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Tài liệu của tôi</h1>
          <p className="text-text-secondary text-sm">Tìm kiếm, lưu trữ tài liệu và gộp nhóm thư mục tiện lợi</p>
        </div>
      </div>

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
            <span>Tất cả tài liệu ({documents.length})</span>
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
              <span>Thư mục nhóm ({folders.length})</span>
            </div>
          </button>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={() => setViewMode('deleted')}
            className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${viewMode === 'deleted'
                ? 'border-b-2 border-primary text-primary font-bold'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            <div className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Tài liệu đã xóa ({deletedDocs.length})</span>
            </div>
          </button>
        )}
      </div>

      {/* 2.5. Upload Limit Indicator for Non-Pro Users */}
      {user?.role !== 'admin' && !user?.is_pro && (
        <div className="bg-amber-500/15 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative overflow-hidden">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Zap className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h4 className="font-bold text-text-primary text-sm">Giới hạn tải lên tài liệu</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Bạn đã sử dụng <strong className="text-amber-500">{documents.length} / 5</strong> tài liệu miễn phí.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/#pricing')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Nâng cấp PRO để upload không giới hạn
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
            placeholder={viewMode === 'documents' ? "Nhập để tìm tài liệu, thẻ..." : "Nhập để tìm thư mục..."}
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
                  {filter === 'Tất cả' ? '📁 Tất cả danh mục' : `${filter}`}
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
                    {filteredDocs.map(d => d.id).every(id => selectedDocIds.includes(id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                  <button
                    onClick={() => { setIsSelectMode(false); setSelectedDocIds([]); }}
                    className="bg-surface border border-border text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedDocIds.length === 0}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/40 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa đã chọn ({selectedDocIds.length})</span>
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
                      <span>Tạo thư mục</span>
                    </button>
                  )}

                  {/* Add Document Button */}
                  {user?.role !== 'admin' && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4.5 h-4.5" />
                      <span>Thêm tài liệu</span>
                    </button>
                  )}

                  {/* Bulk Delete Trigger Button */}
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 bg-surface px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa nhiều</span>
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
              className={`bg-surface border p-5 rounded-xl hover:shadow-md transition-all cursor-pointer flex justify-between items-start ${selectedDocIds.includes(doc.id)
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
                } else {
                  navigate(`/documents/${doc.id}`);
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
                  <h3 className="font-bold text-text-primary text-base">{doc.title}</h3>
                  <span className="text-[10px] font-semibold text-[#10B981] bg-[#DEF7EC] dark:bg-[#DEF7EC]/10 border border-[#10B981]/20 px-2 py-0.5 rounded text-center leading-none">
                    Đã xử lý
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3 max-w-5xl line-clamp-1">{doc.summary || 'Trích xuất nội dung và phân tích dựa trên AI model...'}</p>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const docSubject = doc.subject || 'Khác';
                    const norm = docSubject.trim().toLowerCase();
                    const resolvedSubject = (norm === 'auto' || norm === 'general' || norm === 'unknown' || !docSubject.trim()) ? 'Khác' : docSubject;
                    return (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${getTagColor(resolvedSubject)}`}>
                        {resolvedSubject}
                      </span>
                    );
                  })()}
                  {doc.tags?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex flex-col items-end justify-between h-full">
                <div className="flex items-center space-x-3 mb-1">
                  <p className="text-text-secondary text-xs">{new Date(doc.created_at).toISOString().split('T')[0]}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/documents/${doc.id}`, { state: { edit: true } });
                    }}
                    className="text-text-secondary hover:text-primary transition-colors p-1 cursor-pointer"
                    title="Chỉnh sửa tài liệu"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => initiateDelete(e, doc.id)}
                    className="text-text-secondary hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <p className="text-text-secondary text-sm mt-8 text-center italic">Không tìm thấy tài liệu phù hợp.</p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trước
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
                Sau
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
              className="bg-surface border border-border hover:border-primary/45 rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-105 transition-transform duration-200">
                  <Folder className="w-6 h-6" />
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                  className="text-text-secondary hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-200"
                  title="Xóa thư mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-text-primary text-base truncate mb-1">{f.name}</h3>
                <p className="text-xs text-text-secondary">{f.docCount || 0} tài liệu bên trong</p>
              </div>

              <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 translate-y-8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}

          {filteredFolders.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center p-12 bg-surface border border-border border-dashed rounded-2xl">
              <Folder className="w-12 h-12 opacity-20 text-text-secondary mb-3" />
              <p className="text-text-secondary font-medium text-sm">
                {folders.length === 0 ? "Chưa có thư mục nào được tạo." : "Không tìm thấy thư mục phù hợp."}
              </p>
              <p className="text-xs text-text-secondary/60 mt-1">
                {folders.length === 0
                  ? 'Nhấp vào "Tạo thư mục" ở trên để gom nhóm các tài liệu và hỏi đáp AI!'
                  : 'Hãy thử tìm kiếm với từ khóa khác!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* DELETED DOCUMENTS VIEW (ADMIN ONLY) */}
      {viewMode === 'deleted' && (
        <div className="space-y-4">
          {filteredDeletedDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-surface border border-border p-5 rounded-xl flex justify-between items-start"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-text-primary text-base truncate">{doc.title}</h3>
                  <span className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-center leading-none whitespace-nowrap shrink-0">
                    Đã xóa
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3 max-w-5xl line-clamp-1">
                  {doc.summary || 'Trích xuất nội dung và phân tích dựa trên AI model...'}
                </p>
                <div className="flex items-center space-x-3 text-xs text-text-secondary">
                  <span>Chủ sở hữu: <strong>{doc.users?.name || doc.users?.email || 'Hệ thống'}</strong> ({doc.users?.email || 'N/A'})</span>
                  <span>•</span>
                  <span>Ngày tạo: {new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center items-end shrink-0 self-center">
                <button
                  onClick={() => handleRestoreDoc(doc.id, doc.title)}
                  className="flex items-center space-x-1.5 text-primary hover:bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Khôi phục tài liệu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục</span>
                </button>
              </div>
            </div>
          ))}

          {filteredDeletedDocs.length === 0 && (
            <p className="text-text-secondary text-sm mt-8 text-center italic">Không tìm thấy tài liệu đã xóa phù hợp.</p>
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
