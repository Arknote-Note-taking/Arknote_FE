import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Folder, FolderPlus, Trash2, FileText, Send, Loader2, MessageSquare, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Folders = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Folder Chat states
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý AI thư mục. Tôi đã sẵn sàng phân tích toàn bộ tài liệu trong thư mục này. Hãy đặt câu hỏi cho tôi!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/documents/folders');
      setFolders(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách thư mục!');
    } finally {
      setLoading(false);
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
      toast.success('Đã tạo thư mục thành công!');
      setFolders(prev => [res.data, ...prev]);
      setNewFolderName('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Tạo thư mục thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFolder = async (folder) => {
    try {
      const res = await API.get(`/documents/folders/${folder.id}`);
      setSelectedFolder(res.data);
      setChatMessages([
        { role: 'ai', text: `Tôi đã sẵn sàng phân tích ${res.data.documents?.length || 0} tài liệu trong thư mục "${res.data.name}". Bạn muốn tìm hiểu điều gì?` }
      ]);
    } catch (err) {
      toast.error('Không thể mở thư mục này.');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thư mục này? (Các tài liệu bên trong sẽ không bị xóa, chỉ được đưa ra ngoài thư mục)')) return;
    try {
      await API.delete(`/documents/folders/${folderId}`);
      toast.success('Đã xóa thư mục!');
      if (selectedFolder && selectedFolder.id === folderId) {
        setSelectedFolder(null);
      }
      fetchFolders();
    } catch (err) {
      toast.error('Xóa thư mục thất bại');
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
      <div className="max-w-7xl mx-auto pb-12 flex flex-col h-full">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          {/* LEFT SIDE: Documents List in Folder */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
            <div className="flex items-center space-x-3 mb-4 border-b border-border pb-4 shrink-0">
              <Folder className="w-6 h-6 text-primary" />
              <div>
                <h2 className="font-extrabold text-lg text-text-primary truncate max-w-[200px]">{selectedFolder.name}</h2>
                <p className="text-xs text-text-secondary">{selectedFolder.documents?.length || 0} tài liệu</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {selectedFolder.documents?.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="flex items-start space-x-3 p-3 bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl cursor-pointer transition-all"
                >
                  <FileText className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-text-primary truncate">{doc.title}</h4>
                    <span className="text-[10px] text-text-secondary font-medium">Tag: {doc.subject}</span>
                  </div>
                </div>
              ))}

              {(!selectedFolder.documents || selectedFolder.documents.length === 0) && (
                <div className="text-center py-12 text-text-secondary text-xs italic">
                  Không có tài liệu nào trong thư mục này. Hãy tải lên tài liệu mới và chọn phân vào thư mục này!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Folder AI Chat Box */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
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
                  <div className={`p-3 text-xs leading-relaxed max-w-[85%] rounded-xl shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
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
      <form onSubmit={handleCreateFolder} className="bg-surface border border-border p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex items-center space-x-3 w-full md:flex-1">
          <FolderPlus className="w-6 h-6 text-primary shrink-0" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nhập tên thư mục muốn tạo (VD: Luật Lao Động 2026, Dự Án Marketing...)"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !newFolderName.trim()}
          className="w-full md:w-auto bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Tạo thư mục</span>
        </button>
      </form>

      {/* Folder Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {folders.map(f => (
          <div 
            key={f.id}
            onClick={() => handleSelectFolder(f)}
            className="bg-surface border border-border hover:border-primary/40 rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 group relative overflow-hidden"
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
            
            {/* Subtle background glow on hover */}
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 translate-y-8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border border-dashed rounded-2xl mt-4">
          <Folder className="w-12 h-12 opacity-20 text-text-secondary mb-3" />
          <p className="text-text-secondary font-medium text-sm">Chưa có thư mục nào được tạo.</p>
          <p className="text-xs text-text-secondary/60 mt-1">Hãy nhập tên thư mục ở trên để bắt đầu nhóm các tài liệu lại với nhau!</p>
        </div>
      )}
    </div>
  );
};

export default Folders;
