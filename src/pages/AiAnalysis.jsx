import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload,
  MessageSquare,
  Loader2,
  Send,
  FolderSearch,
  Sparkles,
  BookOpen,
  Key,
  AlertTriangle,
  Folder,
  Plus,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import DocumentSelectModal from '../components/DocumentSelectModal';
import FolderSelectModal from '../components/FolderSelectModal';

const AiAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Auto');
  const [customSubject, setCustomSubject] = useState('');

  // Context states
  const [contextDocId, setContextDocId] = useState(null);
  const [contextFolderId, setContextFolderId] = useState(null);

  // Existing data states
  const [existingDocs, setExistingDocs] = useState([]);
  const [existingFolders, setExistingFolders] = useState([]);

  // Modals state
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isFolderSelectModalOpen, setIsFolderSelectModalOpen] = useState(false);

  // Chat histories state
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Exact 4 Commands with open-book, sparkles, key, alert icons and corresponding premium styling
  const studioCommands = [
    {
      name: 'Tạo Quiz',
      icon: BookOpen,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/20',
      prompt: 'Hãy tạo 5 câu hỏi trắc nghiệm (quiz) chất lượng cao dựa trên nội dung tài liệu này, có kèm đáp án và giải thích chi tiết cho từng câu.'
    },
    {
      name: 'Tóm tắt sâu',
      icon: Sparkles,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-500/20',
      prompt: 'Hãy phân tích và tóm tắt sâu sắc tài liệu này, làm rõ: Bối cảnh ra đời, Nội dung cốt lõi chi tiết và Ý nghĩa thực tiễn.'
    },
    {
      name: 'Trích từ khóa',
      icon: Key,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/20',
      prompt: 'Hãy liệt kê 5-10 từ khóa/thuật ngữ chuyên ngành quan trọng nhất xuất hiện trong tài liệu này kèm theo giải thích ngắn gọn ngữ nghĩa của chúng.'
    },
    {
      name: 'Phân tích rủi ro',
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/20',
      prompt: 'Dưới góc độ chuyên gia pháp lý và vận hành, hãy rà soát tìm các điểm rủi ro tiềm ẩn, mâu thuẫn hoặc lỗ hổng (nếu có) trong tài liệu này.'
    }
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chats, currentChatId, chatLoading]);

  const fetchDocsAndFolders = async () => {
    try {
      const [docsRes, foldersRes] = await Promise.all([
        API.get('/documents'),
        API.get('/documents/folders')
      ]);
      setExistingDocs(docsRes.data);
      setExistingFolders(foldersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await API.get('/ai/chats');
      setChats(res.data);
      if (res.data.length > 0) {
        setCurrentChatId(res.data[0].id);
        setContextDocId(res.data[0].context_doc_id);
        setContextFolderId(res.data[0].context_folder_id);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  useEffect(() => {
    fetchDocsAndFolders();
    fetchChats();
  }, []);

  const handleSelectExistingDoc = async (docId) => {
    if (!docId) return;
    const doc = existingDocs.find(d => d.id === docId);
    if (doc) {
      setContextDocId(doc.id);
      setContextFolderId(null);
      setIsSelectModalOpen(false);

      if (currentChatId) {
        // Update context doc of existing chat in DB
        try {
          const chatObj = chats.find(c => c.id === currentChatId);
          const currentMsgs = chatObj ? (typeof chatObj.messages === 'string' ? JSON.parse(chatObj.messages) : chatObj.messages) : [];
          const updatedMsgs = [
            ...currentMsgs,
            { role: 'user', type: 'file', docName: doc.title },
            { role: 'ai', text: `Trong không gian của tài liệu "${doc.title}" đã chọn, bạn có yêu cầu gì?` }
          ];
          setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: updatedMsgs, context_doc_id: doc.id, context_folder_id: null } : c));
          await API.put(`/ai/chats/${currentChatId}`, { 
            context_doc_id: doc.id, 
            context_folder_id: null,
            messages: updatedMsgs
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        // Auto-create chat session
        try {
          const defaultMsgs = [
            { role: 'user', type: 'file', docName: doc.title },
            { role: 'ai', text: `Trong không gian của tài liệu "${doc.title}" đã chọn, bạn có yêu cầu gì?` }
          ];
          const createRes = await API.post('/ai/chats', {
            title: `Phân tích: ${doc.title.slice(0, 20)}`,
            context_doc_id: doc.id,
            context_folder_id: null
          });
          const newChat = { ...createRes.data, messages: defaultMsgs };
          await API.put(`/ai/chats/${newChat.id}`, { messages: defaultMsgs });
          setChats(prev => [newChat, ...prev]);
          setCurrentChatId(newChat.id);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleSelectExistingFolder = async (folderId) => {
    if (!folderId) return;
    const folder = existingFolders.find(f => f.id === folderId);
    if (folder) {
      setContextFolderId(folder.id);
      setContextDocId(null);
      setIsFolderSelectModalOpen(false);

      if (currentChatId) {
        try {
          const chatObj = chats.find(c => c.id === currentChatId);
          const currentMsgs = chatObj ? (typeof chatObj.messages === 'string' ? JSON.parse(chatObj.messages) : chatObj.messages) : [];
          const updatedMsgs = [
            ...currentMsgs,
            { role: 'user', type: 'file', docName: `Thư mục: ${folder.name}` },
            { role: 'ai', text: `Đã kích hoạt không gian Thư mục "${folder.name}". Tôi sẽ phân tích tổng hợp từ tất cả các tài liệu có trong thư mục này để trả lời bạn. Bạn muốn tôi giúp gì?` }
          ];
          setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: updatedMsgs, context_doc_id: null, context_folder_id: folder.id } : c));
          await API.put(`/ai/chats/${currentChatId}`, { 
            context_doc_id: null, 
            context_folder_id: folder.id,
            messages: updatedMsgs
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          const defaultMsgs = [
            { role: 'user', type: 'file', docName: `Thư mục: ${folder.name}` },
            { role: 'ai', text: `Đã kích hoạt không gian Thư mục "${folder.name}". Tôi sẽ phân tích tổng hợp từ tất cả các tài liệu có trong thư mục này để trả lời bạn. Bạn muốn tôi giúp gì?` }
          ];
          const createRes = await API.post('/ai/chats', {
            title: `Thư mục: ${folder.name.slice(0, 20)}`,
            context_doc_id: null,
            context_folder_id: folder.id
          });
          const newChat = { ...createRes.data, messages: defaultMsgs };
          await API.put(`/ai/chats/${newChat.id}`, { messages: defaultMsgs });
          setChats(prev => [newChat, ...prev]);
          setCurrentChatId(newChat.id);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (subject !== 'Auto') {
        formData.append('subject', subject === 'Khác' ? customSubject.trim() || 'Khác' : subject);
      }

      const res = await API.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update lists locally
      setExistingDocs(prev => [res.data, ...prev]);
      setContextDocId(res.data.id);
      setContextFolderId(null);

      // Auto create or append to chat
      if (currentChatId) {
        const chatObj = chats.find(c => c.id === currentChatId);
        const currentMsgs = chatObj ? (typeof chatObj.messages === 'string' ? JSON.parse(chatObj.messages) : chatObj.messages) : [];
        const updatedMsgs = [
          ...currentMsgs,
          { role: 'user', type: 'file', docName: file.name },
          { role: 'ai', text: `Đã tiếp nhận không gian ngữ nghĩa từ tài liệu "${file.name}". Bạn muốn tôi giúp gì từ dữ liệu này?` }
        ];
        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: updatedMsgs, context_doc_id: res.data.id, context_folder_id: null } : c));
        await API.put(`/ai/chats/${currentChatId}`, { 
          context_doc_id: res.data.id, 
          context_folder_id: null,
          messages: updatedMsgs
        });
      } else {
        const defaultMsgs = [
          { role: 'user', type: 'file', docName: file.name },
          { role: 'ai', text: `Đã tiếp nhận không gian ngữ nghĩa từ tài liệu "${file.name}". Bạn muốn tôi giúp gì từ dữ liệu này?` }
        ];
        const createRes = await API.post('/ai/chats', {
          title: `Upload: ${file.name.slice(0, 20)}`,
          context_doc_id: res.data.id,
          context_folder_id: null
        });
        const newChat = { ...createRes.data, messages: defaultMsgs };
        await API.put(`/ai/chats/${newChat.id}`, { messages: defaultMsgs });
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
      }

      toast.success('Đã nạp tài liệu vào khung Chat!');
      setFile(null);
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.error || 'Tải lên thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (directMsg) => {
    const userMsg = typeof directMsg === 'string' ? directMsg : message.trim();
    if (!userMsg) return;

    if (typeof directMsg !== 'string') {
      setMessage('');
    }
    setChatLoading(true);

    let activeChatId = currentChatId;
    let existingMessages = [];

    // 1. Create chat session if none selected
    if (!activeChatId) {
      try {
        const titleText = userMsg.slice(0, 30) + (userMsg.length > 30 ? '...' : '');
        const createRes = await API.post('/ai/chats', {
          title: titleText,
          context_doc_id: contextDocId,
          context_folder_id: contextFolderId
        });
        activeChatId = createRes.data.id;
        existingMessages = typeof createRes.data.messages === 'string' ? JSON.parse(createRes.data.messages) : createRes.data.messages;
        setChats(prev => [createRes.data, ...prev]);
        setCurrentChatId(activeChatId);
      } catch (err) {
        console.error('Failed to create chat:', err);
        toast.error('Lỗi khởi tạo chat');
        setChatLoading(false);
        return;
      }
    } else {
      const chatObj = chats.find(c => c.id === activeChatId);
      if (chatObj) {
        existingMessages = typeof chatObj.messages === 'string' ? JSON.parse(chatObj.messages) : chatObj.messages;
      }
    }

    // 2. Append User message
    const updatedMessagesWithUser = [...existingMessages, { role: 'user', text: userMsg }];
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessagesWithUser } : c));

    try {
      // Add empty AI placeholder message to stream text into
      const localUpdatedMsgs = [...updatedMessagesWithUser, { role: 'ai', text: '' }];
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: localUpdatedMsgs } : c));

      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = contextDocId
        ? `${baseUrl}/ai/qna`
        : contextFolderId
          ? `${baseUrl}/ai/folder-chat`
          : `${baseUrl}/ai/chat`;

      const body = contextDocId
        ? { documentId: contextDocId, question: userMsg }
        : contextFolderId
          ? { folderId: contextFolderId, question: userMsg }
          : { message: userMsg };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Streaming request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let textBuffer = '';

      setChatLoading(false);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          textBuffer += chunk;
          
          setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            messages: [...updatedMessagesWithUser, { role: 'ai', text: textBuffer }]
          } : c));
        }
      }

      // 4. Persist to DB on success
      const finalMessages = [...updatedMessagesWithUser, { role: 'ai', text: textBuffer }];
      await API.put(`/ai/chats/${activeChatId}`, { messages: finalMessages });
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: finalMessages } : c));
    } catch (err) {
      console.error('Streaming Chat Error:', err);
      setChatLoading(false);
      
      const chatObj = chats.find(c => c.id === activeChatId);
      const currentMsgs = chatObj ? (typeof chatObj.messages === 'string' ? JSON.parse(chatObj.messages) : chatObj.messages) : [];
      const lastMsg = currentMsgs[currentMsgs.length - 1];
      let errorText = 'Xin lỗi, kết nối API bị lỗi hoặc tài khoản của bạn hết credits AI. Vui lòng nâng cấp PRO!';
      if (lastMsg && lastMsg.role === 'ai') {
        errorText = lastMsg.text + '\n\n[Lỗi kết nối API hoặc hết lượt hạn mức free]';
      }
      
      const finalErrorMessages = lastMsg && lastMsg.role === 'ai'
        ? [...currentMsgs.slice(0, -1), { role: 'ai', text: errorText }]
        : [...currentMsgs, { role: 'ai', text: errorText }];
        
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: finalErrorMessages } : c));
      API.put(`/ai/chats/${activeChatId}`, { messages: finalErrorMessages }).catch(console.error);
    }
  };

  const handleStudioCommandClick = (cmd) => {
    if (!contextDocId && !contextFolderId) {
      toast.error('Vui lòng chọn tài liệu hoặc thư mục ở phần bên trái để thực hiện phân tích nhanh này!');
      return;
    }
    let prompt = cmd.prompt;
    if (contextFolderId) {
      prompt = prompt.replaceAll('tài liệu này', 'các tài liệu trong thư mục này');
    }
    handleSendChat(prompt);
  };

  const handleCreateNewChat = () => {
    setCurrentChatId(null);
    setContextDocId(null);
    setContextFolderId(null);
    toast.success('Bắt đầu cuộc trò chuyện mới!');
  };

  const handleSelectChat = (chat) => {
    setCurrentChatId(chat.id);
    setContextDocId(chat.context_doc_id);
    setContextFolderId(chat.context_folder_id);
  };

  const handleStartRename = (e, chat) => {
    e.stopPropagation();
    setRenamingChatId(chat.id);
    setRenameTitle(chat.title);
  };

  const handleSaveRename = async (chatId) => {
    if (!renameTitle.trim()) return;
    try {
      const res = await API.put(`/ai/chats/${chatId}`, { title: renameTitle.trim() });
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: res.data.title } : c));
      setRenamingChatId(null);
      toast.success('Đã đổi tên cuộc trò chuyện!');
    } catch (err) {
      toast.error('Lỗi khi đổi tên cuộc trò chuyện');
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;
    try {
      await API.delete(`/ai/chats/${chatId}`);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setContextDocId(null);
        setContextFolderId(null);
      }
      toast.success('Đã xóa cuộc trò chuyện');
    } catch (err) {
      toast.error('Lỗi khi xóa cuộc trò chuyện');
    }
  };

  // Extract display messages
  const activeChat = chats.find(c => c.id === currentChatId);
  const displayMessages = activeChat 
    ? (typeof activeChat.messages === 'string' ? JSON.parse(activeChat.messages) : activeChat.messages)
    : [
        {
          role: 'ai',
          text: 'Xin chào! Tôi là AI trợ lý phân tích tài liệu. Bạn có thể:\n- Chọn hoặc tải lên tài liệu / thư mục để phân tích\n- Hỏi về nội dung tài liệu / thư mục\n- Yêu cầu tóm tắt nội dung\n- Tìm kiếm thông tin cốt lõi'
        }
      ];

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full">
      <h1 className="text-2xl font-bold text-text-primary mb-1">AI Phân tích tài liệu</h1>
      <p className="text-text-secondary text-sm mb-6">Chat với AI để phân tích, phân loại và tìm kiếm tài liệu</p>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1">
        
        {/* LEFT COLUMN: Chat History List */}
        <div className="w-full lg:w-[260px] shrink-0 bg-surface border border-border rounded-2xl p-4 flex flex-col h-[calc(100vh-230px)] min-h-[700px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
          <button 
            onClick={handleCreateNewChat}
            className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition mb-4 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Trò chuyện mới</span>
          </button>
          
          <div className="border-b border-border/50 pb-2 mb-3">
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Trò chuyện gần đây</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {chats.map(chat => {
              const isSelected = chat.id === currentChatId;
              const isRenaming = chat.id === renamingChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => !isRenaming && handleSelectChat(chat)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border bg-background hover:bg-black/5 text-text-primary dark:bg-slate-800/40 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden mr-2 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-text-secondary'}`} />
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(chat.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface border border-border rounded px-1.5 py-0.5 text-xs text-text-primary font-semibold w-full focus:outline-none focus:border-primary"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate font-semibold flex-1 leading-snug">{chat.title}</span>
                    )}
                  </div>
                  
                  {isRenaming ? (
                    <div className="flex items-center space-x-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleSaveRename(chat.id); }} className="text-emerald-500 hover:text-emerald-600 p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setRenamingChatId(null); }} className="text-red-500 hover:text-red-600 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 shrink-0 ml-1.5 transition-opacity">
                      <button onClick={(e) => handleStartRename(e, chat)} className="text-text-secondary hover:text-primary p-0.5" title="Đổi tên">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDeleteChat(e, chat.id)} className="text-text-secondary hover:text-red-500 p-0.5" title="Xóa">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {chats.length === 0 && (
              <div className="text-center text-text-secondary text-xs italic py-8">
                Chưa có lịch sử trò chuyện.
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Main Chat Card */}
        <div className="flex-1 bg-surface border border-border rounded-2xl flex flex-col p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] h-[calc(100vh-230px)] min-h-[700px]">

          {/* Chat Area */}
          <div ref={chatContainerRef} className="flex-1 mb-6 flex flex-col pt-4 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {displayMessages.map((chat, idx) => (
              <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                {chat.role === 'ai' && (
                  <div className="flex items-center space-x-2 mb-1 pl-4">
                    <span className="text-primary text-[10px] font-bold">AI ASSISTANT</span>
                  </div>
                )}
                <div className={`p-4 text-sm max-w-[80%] rounded-2xl ${chat.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-background dark:bg-surface/80 text-text-primary rounded-tl-sm border border-border'}`}>
                  {chat.type === 'file' ? (
                    <div className="flex items-center space-x-3 bg-white/20 p-2 rounded-lg">
                      <div className="bg-white/90 p-2 rounded text-primary">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Upload File</span>
                        <span className="text-white/80 text-xs truncate max-w-[150px]">{chat.docName}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{chat.text}</p>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-start">
                <div className="bg-background dark:bg-surface/80 rounded-2xl rounded-tl-sm p-4 text-sm text-text-primary border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input & Dropzone Area */}
          <div className="border-t border-border pt-4 shrink-0">
            <div className="relative mb-4 flex space-x-2">
              <input type="text" placeholder="Hỏi AI về tài liệu... (VD: phân loại, tìm kiếm, tóm tắt)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !message.trim()}
                className="bg-[#52B788] hover:bg-primary disabled:opacity-50 text-white px-5 rounded-xl transition-colors flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Dual Context Selector (File vs Folder) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 px-1 shrink-0">
              {/* Document Selector Button */}
              <button
                onClick={() => setIsSelectModalOpen(true)}
                className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm cursor-pointer group"
              >
                <div className="flex items-center space-x-3 text-text-primary font-medium">
                  <div className="bg-secondary text-primary p-2 rounded-lg group-hover:scale-105 transition-transform">
                    <FolderSearch className="w-5 h-5" />
                  </div>
                  <span className="text-xs">📚 Chọn tài liệu</span>
                </div>
                <span className="text-[10px] text-text-secondary bg-background px-2 py-1 rounded-md border border-border">
                  {existingDocs.length} tệp
                </span>
              </button>

              {/* Folder Selector Button */}
              <button
                onClick={() => setIsFolderSelectModalOpen(true)}
                className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm cursor-pointer group"
              >
                <div className="flex items-center space-x-3 text-text-primary font-medium">
                  <div className="bg-secondary dark:bg-[#117A65]/20 text-[#117A65] dark:text-[#4DB6AC] p-2 rounded-lg group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5 text-[#117A65]" />
                  </div>
                  <span className="text-xs">📁 Chọn thư mục</span>
                </div>
                <span className="text-[10px] text-text-secondary bg-background px-2 py-1 rounded-md border border-border">
                  {existingFolders.length} mục
                </span>
              </button>
            </div>

            <div className="relative flex items-center justify-center text-xs text-text-secondary font-medium mb-5 px-1">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-3 bg-surface text-[10px] tracking-wider uppercase text-text-secondary/60">Hoặc tải lên mới</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            <div
              className="border-2 border-dashed border-border hover:border-primary/50 bg-background rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-text-secondary mb-2" />
              <p className="text-sm font-semibold text-text-primary mb-1">Kéo thả tài liệu vào đây</p>
              <p className="text-xs text-text-secondary mb-4">Hỗ trợ PDF, DOCX, XLSX, PPTX, PPT, XLS, CSV, MP4, MOV, AVI, HTML, TXT (Tối đa 100MB)</p>
              <button className="bg-surface border border-border px-4 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 transition">
                Chọn tệp
              </button>

              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.html,.htm,.txt,.png,.jpg,.jpeg,.mp4,.mov,.avi,.mkv"
              />
            </div>

            {file && (
              <div className="mt-4 p-4 bg-surface border border-border rounded-xl flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary font-medium truncate">{file.name}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Danh mục (Tùy chọn)</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Auto">✨ AI Tự động nhận diện</option>
                    <option value="Nhân sự">Nhân sự</option>
                    <option value="Hành chính">Hành chính</option>
                    <option value="Pháp luật">Pháp luật</option>
                    <option value="Học tập">Học tập</option>
                    <option value="Khác">Khác (Tự điền...)</option>
                  </select>
                </div>

                {subject === 'Khác' && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Tên danh mục riêng của bạn</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="VD: Tài chính, Dự án A..."
                      className="w-full bg-surface dark:bg-slate-900 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                <button onClick={handleUpload} disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg font-medium flex items-center justify-center transition-colors animate-pulse">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? 'Đang tải & Phân tích...' : 'Xác nhận tải lên'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI Studio Commands Panel */}
        <div className="w-full lg:w-[280px] shrink-0 bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col h-[calc(100vh-230px)] min-h-[700px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="font-extrabold text-text-primary text-sm">AI Studio</h3>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full uppercase">
              Commands
            </span>
          </div>

          <p className="text-xs text-text-secondary mb-5 shrink-0 leading-relaxed">
            {contextDocId || contextFolderId
              ? "Ngữ cảnh hoạt động! Chọn một câu lệnh nhanh dưới đây để bắt đầu phân tích:"
              : "Vui lòng chọn hoặc nạp tài liệu / thư mục bên trái để sử dụng câu lệnh phân tích nhanh:"}
          </p>

          {/* Quick Commands List - Exact 4 Commands (Tạo Quiz, Tóm tắt sâu, Trích từ khóa, Phân tích rủi ro) */}
          <div className="flex-1 overflow-y-auto space-y-3.5 custom-scrollbar pr-1 py-1">
            {studioCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleStudioCommandClick(cmd)}
                disabled={chatLoading}
                className={`w-full flex flex-col p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-sm ${cmd.color}`}
              >
                <div className="flex items-center space-x-2 mb-1.5 font-bold text-xs">
                  <cmd.icon className="w-4 h-4 shrink-0" />
                  <span>{cmd.name}</span>
                </div>
                <p className="text-[10px] opacity-75 leading-relaxed truncate-2-lines line-clamp-2">
                  {cmd.prompt}
                </p>
              </button>
            ))}
          </div>

          {/* Sidebar footer status indicator */}
          <div className="mt-5 pt-3 border-t border-border shrink-0 flex items-center justify-between text-[10px] text-text-secondary">
            <span>Trạng thái ngữ cảnh:</span>
            {contextDocId ? (
              <span className="text-emerald-500 font-bold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span>
                Đã nạp tệp
              </span>
            ) : contextFolderId ? (
              <span className="text-[#117A65] font-bold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#117A65] mr-1 animate-ping"></span>
                Đã nạp thư mục
              </span>
            ) : (
              <span className="text-text-secondary/70 font-semibold">Trò chuyện tự do</span>
            )}
          </div>
        </div>

      </div>

      <DocumentSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        documents={existingDocs}
        onSelect={handleSelectExistingDoc}
      />

      <FolderSelectModal
        isOpen={isFolderSelectModalOpen}
        onClose={() => setIsFolderSelectModalOpen(false)}
        folders={existingFolders}
        onSelect={handleSelectExistingFolder}
      />
    </div>
  );
};

export default AiAnalysis;
