import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Folder, FolderPlus, Trash2, FileText, Send, Loader2, MessageSquare, ArrowLeft, Plus, Edit2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DocumentSelectModal from '../components/DocumentSelectModal';
import { useConfirm } from '../context/ConfirmContext';

const Folders = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Folder CRUD & Document Add states
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [allDocs, setAllDocs] = useState([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Reset selected docs when folder changes
  useEffect(() => {
    setSelectedDocIds([]);
  }, [selectedFolder?.id]);

  const handleToggleDocSelect = (docId) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAllDocs = () => {
    if (selectedDocIds.length === selectedFolder?.documents?.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(selectedFolder?.documents?.map(d => d.id) || []);
    }
  };

  const handleBulkRemoveDocs = async () => {
    if (selectedDocIds.length === 0) return;
    const isConfirmed = await confirm(
      language === 'vi' 
        ? `Bạn có chắc muốn loại bỏ ${selectedDocIds.length} tài liệu đã chọn khỏi thư mục này?` 
        : `Are you sure you want to remove the ${selectedDocIds.length} selected documents from this folder?`
    );
    if (!isConfirmed) return;
    try {
      await Promise.all(selectedDocIds.map(docId => API.put(`/documents/${docId}`, { folder_id: null })));
      toast.success(
        language === 'vi' 
          ? `Đã loại bỏ thành công ${selectedDocIds.length} tài liệu!` 
          : `Successfully removed ${selectedDocIds.length} documents!`
      );
      setSelectedDocIds([]);
      // Refresh folder detail view
      const updatedFolderRes = await API.get(`/documents/folders/${selectedFolder.id}`);
      setSelectedFolder(updatedFolderRes.data);
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi loại bỏ tài liệu khỏi thư mục' : 'Error removing documents from folder');
    }
  };

  // Folder Chat states
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý AI thư mục. Tôi đã sẵn sàng phân tích toàn bộ tài liệu trong thư mục này. Hãy đặt câu hỏi cho tôi!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const fetchFolders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/documents/folders');
      setFolders(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách thư mục!');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, chatLoading]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await API.post('/documents/folders', { name: newFolderName.trim() });
      toast.success(language === 'vi' ? 'Đã tạo thư mục thành công!' : 'Folder created successfully!');
      setFolders(prev => [res.data, ...prev]);
      setNewFolderName('');
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'vi' ? 'Tạo thư mục thất bại' : 'Failed to create folder'));
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFolder = async (folder) => {
    try {
      const res = await API.get(`/documents/folders/${folder.id}`);
      setSelectedFolder(res.data);
      setChatMessages([
        { 
          role: 'ai', 
          text: language === 'vi' 
            ? `Tôi đã sẵn sàng phân tích ${res.data.documents?.length || 0} tài liệu trong thư mục "${res.data.name}". Bạn muốn tìm hiểu điều gì?` 
            : `I am ready to analyze ${res.data.documents?.length || 0} documents in the folder "${res.data.name}". What would you like to know?` 
        }
      ]);
    } catch (err) {
      toast.error(language === 'vi' ? 'Không thể mở thư mục này.' : 'Failed to open this folder.');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    const isConfirmed = await confirm(
      language === 'vi' 
        ? 'Bạn có chắc muốn xóa thư mục này? (Các tài liệu bên trong sẽ không bị xóa, chỉ được đưa ra ngoài thư mục)' 
        : 'Are you sure you want to delete this folder? (Documents inside will not be deleted, they will just be moved outside)'
    );
    if (!isConfirmed) return;
    try {
      await API.delete(`/documents/folders/${folderId}`);
      toast.success(language === 'vi' ? 'Đã xóa thư mục!' : 'Folder deleted!');
      if (selectedFolder && selectedFolder.id === folderId) {
        setSelectedFolder(null);
      }
      fetchFolders(true);
    } catch (err) {
      toast.error(language === 'vi' ? 'Xóa thư mục thất bại' : 'Failed to delete folder');
    }
  };

  const handleRenameFolder = async (e) => {
    e.preventDefault();
    if (!renameInput.trim() || renameInput.trim() === selectedFolder.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await API.put(`/documents/folders/${selectedFolder.id}`, { name: renameInput.trim() });
      toast.success('Đã đổi tên thư mục!');
      setSelectedFolder(prev => ({ ...prev, name: res.data.name }));
      setFolders(prev => prev.map(f => f.id === selectedFolder.id ? { ...f, name: res.data.name } : f));
      setIsEditingName(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đổi tên thư mục thất bại');
    }
  };

  const handleRenameFolderInList = async (e, folderId) => {
    e.preventDefault();
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    try {
      const res = await API.put(`/documents/folders/${folderId}`, { name: editFolderName.trim() });
      toast.success('Đổi tên thư mục thành công!');
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: res.data.name } : f));
      setEditingFolderId(null);
    } catch (err) {
      toast.error('Lỗi khi đổi tên thư mục');
    }
  };

  const handleOpenAddDocModal = async () => {
    try {
      const res = await API.get('/documents');
      const activeDocIds = selectedFolder?.documents?.map(d => d.id) || [];
      const available = res.data.filter(d => !activeDocIds.includes(d.id));
      setAllDocs(available);
      setIsDocModalOpen(true);
    } catch (err) {
      toast.error('Không thể tải kho tài liệu.');
    }
  };

  const handleAddDocToFolder = async (selectedIds) => {
    try {
      await API.post(`/documents/folders/${selectedFolder.id}/add-documents`, { documentIds: selectedIds });
      toast.success(`Đã thêm ${selectedIds.length} tài liệu vào thư mục!`);
      setIsDocModalOpen(false);
      // Refresh folder detail view
      const updatedFolderRes = await API.get(`/documents/folders/${selectedFolder.id}`);
      setSelectedFolder(updatedFolderRes.data);
    } catch (err) {
      toast.error('Lỗi khi thêm tài liệu vào thư mục');
    }
  };

  const handleUploadSuccess = async () => {
    if (!selectedFolder) return;
    try {
      const updatedFolderRes = await API.get(`/documents/folders/${selectedFolder.id}`);
      setSelectedFolder(updatedFolderRes.data);
    } catch (err) {
      toast.error('Lỗi khi làm mới danh sách tài liệu');
    }
  };

  const handleRemoveDocFromFolder = async (e, docId) => {
    e.stopPropagation();
    const isConfirmed = await confirm(
      language === 'vi' 
        ? 'Bạn có chắc muốn loại bỏ tài liệu này khỏi thư mục?' 
        : 'Are you sure you want to remove this document from the folder?'
    );
    if (!isConfirmed) return;
    try {
      await API.put(`/documents/${docId}`, { folder_id: null });
      toast.success(language === 'vi' ? 'Đã loại bỏ tài liệu khỏi thư mục!' : 'Successfully removed document from the folder!');
      // Refresh folder detail view
      const updatedFolderRes = await API.get(`/documents/folders/${selectedFolder.id}`);
      setSelectedFolder(updatedFolderRes.data);
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi loại bỏ tài liệu' : 'Error removing document');
    }
  };



  const handleSendFolderChat = async () => {
    if (!chatInput.trim() || !selectedFolder) return;
    const userQuestion = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userQuestion }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await API.post('/ai/folder-chat', { folderId: selectedFolder.id, question: userQuestion });
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Gặp sự cố khi kết nối AI. Vui lòng kiểm tra lại.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading && folders.length === 0) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // IF A FOLDER IS OPENED: Show split detail view (Left documents list, Right AI Chat)
  if (selectedFolder) {
    return (
      <div className="max-w-7xl mx-auto pb-12 flex flex-col lg:h-full">
        {/* Back navigation */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <button
            onClick={() => { setSelectedFolder(null); fetchFolders(); }}
            className="flex items-center space-x-2 text-text-secondary hover:text-text-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách thư mục</span>
          </button>

          <button
            onClick={() => handleDeleteFolder(selectedFolder.id)}
            className="flex items-center space-x-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa thư mục</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:flex-1 lg:overflow-hidden">

          {/* LEFT SIDE: Documents List in Folder */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col lg:h-[calc(100vh-200px)] h-[350px] lg:min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-4 shrink-0">
              <div className="flex items-center space-x-3 w-full min-w-0">
                <Folder className="w-6 h-6 text-primary shrink-0" />
                {isEditingName ? (
                  <form onSubmit={handleRenameFolder} className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary text-text-primary font-semibold flex-1 min-w-0"
                      autoFocus
                    />
                    <button type="submit" className="text-primary hover:text-primary-dark font-bold text-xs shrink-0">Lưu</button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="text-text-secondary hover:text-text-primary text-xs shrink-0">Hủy</button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <div className="min-w-0 pr-2">
                      <h2 className="font-extrabold text-lg text-text-primary truncate max-w-[150px]">{selectedFolder.name}</h2>
                      <p className="text-xs text-text-secondary">{selectedFolder.documents?.length || 0} tài liệu</p>
                    </div>
                    <button
                      onClick={() => { setIsEditingName(true); setRenameInput(selectedFolder.name); }}
                      className="text-text-secondary hover:text-primary transition-colors p-1 cursor-pointer shrink-0"
                      title="Đổi tên thư mục"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 shrink-0 gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFolder.documents?.length > 0 && selectedDocIds.length === selectedFolder.documents.length}
                  onChange={handleSelectAllDocs}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary"
                />
                <span className="text-xs font-semibold text-text-secondary">
                  {selectedDocIds.length > 0 ? `Đã chọn ${selectedDocIds.length}` : 'Danh sách tài liệu'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                {selectedDocIds.length > 0 && (
                  <button
                    onClick={handleBulkRemoveDocs}
                    className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa đã chọn</span>
                  </button>
                )}
                <button
                  onClick={handleOpenAddDocModal}
                  className="bg-primary hover:bg-primary-dark text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tài liệu</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {selectedFolder.documents?.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden mr-2 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleDocSelect(doc.id);
                      }}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer accent-primary"
                    />
                    <div
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="flex items-start space-x-3 overflow-hidden cursor-pointer flex-1"
                    >
                      <FileText className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs text-text-primary truncate hover:text-primary hover:underline transition-colors">{doc.title}</h4>
                        <span className="text-[10px] text-text-secondary font-medium">Tag: {doc.subject}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveDocFromFolder(e, doc.id)}
                    className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer duration-200 shrink-0"
                    title="Loại khỏi thư mục"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {(!selectedFolder.documents || selectedFolder.documents.length === 0) && (
                <div className="text-center py-12 text-text-secondary text-xs italic">
                  Không có tài liệu nào trong thư mục này. Hãy nhấp "Thêm tài liệu" để gom nhóm tài liệu phân tích!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Folder AI Chat Box */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col lg:h-[calc(100vh-200px)] h-[500px] max-h-[75vh] lg:max-h-none lg:min-h-[400px]">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text-primary">Trợ lý AI thư mục</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                FOLDER AI KNOWLEDGE
              </span>
            </div>

            {/* Chat message space */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'ai' && (
                    <span className="text-[9px] font-bold text-primary mb-1 uppercase tracking-wider pl-1">FOLDER BOT</span>
                  )}
                  <div className={`p-3 text-xs leading-relaxed max-w-[85%] rounded-xl shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-black/5 dark:bg-white/5 border border-border text-text-primary rounded-tl-sm'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-start">
                  <div className="bg-black/5 dark:bg-white/5 border border-border rounded-xl rounded-tl-sm p-3 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat entry bar */}
            <div className="border-t border-border pt-4 shrink-0">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendFolderChat()}
                  placeholder={`Đặt câu hỏi tổng hợp cho toàn bộ các tài liệu trong thư mục "${selectedFolder.name}"...`}
                  className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-3 focus:outline-none focus:border-primary transition"
                />
                <button
                  onClick={handleSendFolderChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // IF VIEWING MAIN LIST: Grid of Folders
  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Thư mục tài liệu</h1>
          <p className="text-text-secondary text-sm">Gộp nhóm các tài liệu để phân tích AI đa diện</p>
        </div>
      </div>

      {/* Creating new folder panel */}
      <form onSubmit={handleCreateFolder} className="bg-surface border border-border p-6 rounded-xl mb-8 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex items-center space-x-3 w-full md:flex-1">
          <FolderPlus className="w-6 h-6 text-primary shrink-0" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={language === 'vi' ? "Nhập tên thư mục muốn tạo (VD: Luật Lao Động 2026, Dự Án Marketing...)" : "Enter folder name (e.g. Labor Law 2026, Marketing Project...)"}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !newFolderName.trim()}
          className="w-full md:w-auto bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{language === 'vi' ? 'Tạo thư mục' : 'Create Folder'}</span>
        </button>
      </form>

      {/* Folder Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {folders.map(f => (
          <div
            key={f.id}
            onClick={() => {
              if (editingFolderId === f.id) return;
              handleSelectFolder(f);
            }}
            className="bg-surface border border-border hover:border-primary/40 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 group relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-105 transition-transform duration-200">
                <Folder className="w-6 h-6" />
              </div>

              <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(f.id);
                    setEditFolderName(f.name);
                  }}
                  className="text-text-secondary hover:text-primary p-1 cursor-pointer"
                  title="Đổi tên thư mục"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                  className="text-text-secondary hover:text-red-500 p-1 cursor-pointer"
                  title="Xóa thư mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              {editingFolderId === f.id ? (
                <form
                  onSubmit={(e) => handleRenameFolderInList(e, f.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-2 w-full mt-2"
                >
                  <input
                    type="text"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary text-text-primary font-bold flex-1 min-w-0"
                    autoFocus
                  />
                  <button type="submit" className="text-primary hover:text-primary-dark font-bold text-xs shrink-0">Lưu</button>
                  <button type="button" onClick={() => setEditingFolderId(null)} className="text-text-secondary hover:text-text-primary text-xs shrink-0"><X className="w-4 h-4" /></button>
                </form>
              ) : (
                <>
                  <h3 className="font-extrabold text-text-primary text-base truncate mb-1">{f.name}</h3>
                  <p className="text-xs text-text-secondary">{f.docCount || 0} tài liệu bên trong</p>
                </>
              )}
            </div>

            {/* Subtle background glow on hover */}
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 translate-y-8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border border-dashed rounded-xl mt-4">
          <Folder className="w-12 h-12 opacity-20 text-text-secondary mb-3" />
          <p className="text-text-secondary font-medium text-sm">Chưa có thư mục nào được tạo.</p>
          <p className="text-xs text-text-secondary/60 mt-1">Hãy nhập tên thư mục ở trên để bắt đầu nhóm các tài liệu lại với nhau!</p>
        </div>
      )}

      {/* Document Selection Overlay Modal */}
      <DocumentSelectModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documents={allDocs}
        onSelect={handleAddDocToFolder}
        isMultiSelect={true}
        folderId={selectedFolder?.id}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Folders;
