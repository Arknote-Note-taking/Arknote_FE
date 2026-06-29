import React, { useState, useEffect, useRef, useContext } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useLanguage } from '../context/LanguageContext';
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
  X,
  ChevronLeft,
  ChevronRight,
  History,
  FileVideo,
  FileSpreadsheet,
  Presentation,
  FileText,
  Image,
  File,
  ChevronDown,
  Mic,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DocumentSelectModal from '../components/DocumentSelectModal';
import FolderSelectModal from '../components/FolderSelectModal';

const preprocessMarkdown = (content) => {
  if (!content) return '';
  return content.replace(/\n\s*\n/g, '\n\n');
};

const getDocumentIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return FileVideo;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pptx', 'ppt'].includes(ext)) return Presentation;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return Image;
  return FileText;
};

const MarkdownRenderer = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
      strong: ({ children }) => <strong className="font-bold text-text-primary">{children}</strong>,
      em: ({ children }) => <em className="italic opacity-90">{children}</em>,
      ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1.5 my-2">{children}</ol>,
      ul: ({ children }) => <ul className="list-none ml-0 space-y-1.5 my-2">{children}</ul>,
      li: ({ children, ordered }) =>
        ordered
          ? <li className="pl-1 leading-relaxed">{children}</li>
          : <li className="flex items-start space-x-2 leading-relaxed"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0"></span><span className="flex-1">{children}</span></li>,
      h1: ({ children }) => <h1 className="text-base font-extrabold text-text-primary mt-3 mb-1.5 border-b border-border pb-1">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-extrabold text-text-primary mt-3 mb-1.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-bold text-primary mt-2 mb-1">{children}</h3>,
      code: ({ inline, children }) =>
        inline
          ? <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
          : <code className="block bg-black/10 dark:bg-white/10 rounded-lg p-3 text-xs font-mono mt-2 mb-2 overflow-x-auto whitespace-pre">{children}</code>,
      pre: ({ children }) => <>{children}</>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-3 italic opacity-80 my-2">{children}</blockquote>,
      hr: () => <hr className="border-border my-3" />,
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">{children}</a>,
    }}
  >
    {preprocessMarkdown(content)}
  </ReactMarkdown>
);

const AiAnalysis = () => {
  const { user, refreshProfile } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const { language, t } = useLanguage();
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

  // Sidebar collapse state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [aiModel, setAiModel] = useState('Flash');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const studioCommands = [
    {
      name: language === 'vi' ? 'Tạo Quiz' : 'Create Quiz',
      icon: BookOpen,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/20',
      prompt: language === 'vi'
        ? 'Hãy tạo 5 câu hỏi trắc nghiệm (quiz) chất lượng cao dựa trên nội dung tài liệu này, có kèm đáp án và giải thích chi tiết cho từng câu.'
        : 'Please create 5 high-quality multiple choice questions (quiz) based on this document, with answers and detailed explanations for each.'
    },
    {
      name: language === 'vi' ? 'Tóm tắt sâu' : 'Deep Summary',
      icon: Sparkles,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-500/20',
      prompt: language === 'vi'
        ? 'Hãy tóm tắt chi tiết các nội dung cốt lõi, sơ đồ lập luận hoặc cấu trúc chính của tài liệu này dưới dạng danh sách rõ ràng.'
        : 'Please summarize in detail the core contents, reasoning diagrams, or main structure of this document in a clear list.'
    },
    {
      name: language === 'vi' ? 'Trích từ khóa' : 'Keywords',
      icon: Key,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/20',
      prompt: language === 'vi'
        ? 'Hãy liệt kê 5-10 từ khóa/thuật ngữ chuyên ngành quan trọng nhất xuất hiện trong tài liệu này kèm theo giải thích ngắn gọn ngữ nghĩa của chúng.'
        : 'Please list 5-10 most important keywords/specialized terms appearing in this document along with brief explanations of their meaning.'
    },
    {
      name: language === 'vi' ? 'Phân tích rủi ro' : 'Risks',
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/20',
      prompt: language === 'vi'
        ? 'Dưới góc độ chuyên gia pháp lý và vận hành, hãy rà soát tìm các điểm rủi ro tiềm ẩn, mâu thuẫn hoặc lỗ hổng (nếu có) trong tài liệu này.'
        : 'From a legal and operational expert perspective, please review this document to find potential risks, contradictions, or gaps (if any).'
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
      // Default to new chat upon entering the page, do not auto-select the first chat
      setCurrentChatId(null);
      setContextDocId(null);
      setContextFolderId(null);
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

      setExistingDocs(prev => [res.data, ...prev]);
      setContextDocId(res.data.id);
      setContextFolderId(null);

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

    const updatedMessagesWithUser = [...existingMessages, { role: 'user', text: userMsg }];
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessagesWithUser } : c));

    try {
      const localUpdatedMsgs = [...updatedMessagesWithUser, { role: 'ai', text: '' }];
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: localUpdatedMsgs } : c));

      const userObj = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
      };
      if (userObj?.token) {
        headers['Authorization'] = `Bearer ${userObj.token}`;
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = contextDocId
        ? `${baseUrl}/ai/qna`
        : contextFolderId
          ? `${baseUrl}/ai/folder-chat`
          : `${baseUrl}/ai/chat`;

      const body = contextDocId
        ? { documentId: contextDocId, question: userMsg, chatId: activeChatId }
        : contextFolderId
          ? { folderId: contextFolderId, question: userMsg, chatId: activeChatId }
          : { message: userMsg, chatId: activeChatId };

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

      const finalMessages = [...updatedMessagesWithUser, { role: 'ai', text: textBuffer }];
      await API.put(`/ai/chats/${activeChatId}`, { messages: finalMessages });
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: finalMessages } : c));
      refreshProfile();
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
      toast.success(language === 'vi' ? 'Đã đổi tên cuộc trò chuyện!' : 'Chat session renamed successfully!');
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi đổi tên cuộc trò chuyện' : 'Error renaming chat session');
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    const isConfirmed = await confirm(language === 'vi' ? 'Bạn có chắc muốn xóa cuộc trò chuyện này?' : 'Are you sure you want to delete this chat session?');
    if (!isConfirmed) return;
    try {
      await API.delete(`/ai/chats/${chatId}`);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setContextDocId(null);
        setContextFolderId(null);
      }
      toast.success(language === 'vi' ? 'Đã xóa cuộc trò chuyện' : 'Chat session deleted successfully');
    } catch (err) {
      toast.error(language === 'vi' ? 'Lỗi khi xóa cuộc trò chuyện' : 'Error deleting chat session');
    }
  };

  const activeChat = chats.find(c => c.id === currentChatId);
  const displayMessages = activeChat
    ? (typeof activeChat.messages === 'string' ? JSON.parse(activeChat.messages) : activeChat.messages)
    : [
      {
        role: 'ai',
        text: 'Xin chào! Tôi là AI trợ lý phân tích tài liệu. Bạn có thể:\n- Chọn hoặc tải lên tài liệu / thư mục để phân tích\n- Hỏi về nội dung tài liệu / thư mục\n- Yêu cầu tóm tắt nội dung\n- Tìm kiếm thông tin cốt lõi'
      }
    ];

  const activeDoc = existingDocs.find(d => d.id === contextDocId);
  const activeFolder = existingFolders.find(f => f.id === contextFolderId);
  const isNewChat = !activeChat || (displayMessages.length === 1 && displayMessages[0].role === 'ai' && displayMessages[0].text.includes('Xin chào!'));
  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(chatSearchQuery.toLowerCase()));

  return (
    <div className="w-[calc(100%+4rem)] -mx-8 -my-8 flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-background">
      <div className="flex flex-row items-stretch flex-1 h-full overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden animate-fadeIn"
          />
        )}

        {/* LEFT COLUMN: Collapsible Sidebar styled like Gemini */}
        <div className={`shrink-0 flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden z-30 absolute md:static bg-surface border-r border-border shadow-xl md:shadow-none ${
          sidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:w-[48px] md:translate-x-0'
        }`}>
          {/* Collapsed view: just a toggle button */}
          {!sidebarOpen ? (
            <div className="hidden md:flex flex-col items-center h-full bg-surface py-4 gap-3 shrink-0 w-[48px]">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer"
                title={language === 'vi' ? "Mở lịch sử trò chuyện" : "Open chat history"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center justify-center">
                <History className="w-4 h-4 text-text-secondary/40 rotate-90" />
              </div>
            </div>
          ) : (
            <div className="bg-surface border-r border-border flex flex-col h-full overflow-hidden p-4">
              {/* Header row with toggle */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <button
                  onClick={handleCreateNewChat}
                  className="flex-1 bg-slate-100 hover:bg-black/5 dark:bg-slate-800/40 dark:hover:bg-slate-855 border border-border rounded-full py-2 px-4 text-xs font-bold text-text-primary transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer mr-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('newChat')}</span>
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all cursor-pointer shrink-0"
                  title={language === 'vi' ? "Ẩn lịch sử trò chuyện" : "Hide chat history"}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Search chats input */}
              <div className="relative mb-4 shrink-0">
                <input
                  type="text"
                  placeholder={language === 'vi' ? "Tìm kiếm trò chuyện..." : "Search chats..."}
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-full py-2 pl-8 pr-4 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-text-secondary/50 absolute left-3 top-2.5" />
                {chatSearchQuery && (
                  <button
                    onClick={() => setChatSearchQuery('')}
                    className="absolute right-3 top-2 text-text-secondary hover:text-text-primary cursor-pointer p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Recent chats list */}
              <div className="border-b border-border/50 pb-2 mb-3 shrink-0">
                <span className="text-[10px] uppercase font-extrabold text-text-secondary tracking-wider">
                  {language === 'vi' ? 'Trò chuyện gần đây' : 'Recent Chats'}
                </span>
              </div>

              <div className="overflow-y-auto space-y-1.5 pr-1 custom-scrollbar flex-1">
                {filteredChats.map(chat => {
                  const isSelected = chat.id === currentChatId;
                  const isRenaming = chat.id === renamingChatId;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => !isRenaming && handleSelectChat(chat)}
                      className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all text-xs cursor-pointer ${isSelected
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
                          <button onClick={(e) => handleStartRename(e, chat)} className="text-text-secondary hover:text-primary p-0.5" title={language === 'vi' ? "Đổi tên" : "Rename"}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDeleteChat(e, chat.id)} className="text-text-secondary hover:text-red-500 p-0.5" title={language === 'vi' ? "Xóa" : "Delete"}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredChats.length === 0 && (
                  <div className="text-center text-text-secondary text-xs italic py-8">
                    {language === 'vi' ? 'Không tìm thấy cuộc trò chuyện nào.' : 'No conversations found.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT WORKSPACE: Main Chat Area with Drag & Drop */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          className="flex-1 flex flex-col h-full overflow-hidden bg-background dark:bg-slate-900/10"
        >
          {/* Top Header Row */}
          <div className="pb-3 border-b border-border flex items-center justify-between shrink-0 px-6 pt-4">
            <div className="flex items-center space-x-2">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer mr-2 shrink-0 border border-border"
                  title={language === 'vi' ? "Mở lịch sử" : "Open history"}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {contextDocId && activeDoc ? (
                <div className="flex items-center space-x-2 text-primary font-bold text-xs bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full animate-fade-in">
                  <FolderSearch className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px] sm:max-w-[400px]">📚 {language === 'vi' ? 'Tài liệu' : 'Document'}: {activeDoc.title}</span>
                </div>
              ) : contextFolderId && activeFolder ? (
                <div className="flex items-center space-x-2 text-[#117A65] font-bold text-xs bg-[#117A65]/5 border border-[#117A65]/20 px-3 py-1.5 rounded-full animate-fade-in">
                  <Folder className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px] sm:max-w-[400px]">📁 {language === 'vi' ? 'Thư mục' : 'Folder'}: {activeFolder.name}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-text-secondary font-bold text-xs bg-slate-100 dark:bg-slate-800/60 border border-border px-3 py-1.5 rounded-full animate-fade-in">
                  <MessageSquare className="w-3.5 h-3.5 opacity-70" />
                  <span>💬 {language === 'vi' ? 'Trò chuyện tự do (Không tài liệu)' : 'Free Chat (No document)'}</span>
                </div>
              )}
            </div>

            {/* Context Status Indicator */}
            <div className="flex items-center space-x-3">
              {contextDocId ? (
                <span className="text-emerald-500 font-bold text-[10px] items-center hidden sm:flex bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span>
                  {language === 'vi' ? 'Đã nạp tệp' : 'File Loaded'}
                </span>
              ) : contextFolderId ? (
                <span className="text-[#117A65] font-bold text-[10px] items-center hidden sm:flex bg-[#117A65]/5 px-2 py-1 rounded border border-[#117A65]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#117A65] mr-1 animate-ping"></span>
                  {language === 'vi' ? 'Đã nạp thư mục' : 'Folder Loaded'}
                </span>
              ) : null}

              {(contextDocId || contextFolderId) && (
                <button
                  onClick={() => {
                    setContextDocId(null);
                    setContextFolderId(null);
                    toast.success(language === 'vi' ? 'Đã gỡ bỏ tài liệu, chuyển về trò chuyện tự do.' : 'Removed document context, switched to free chat.');
                  }}
                  className="text-xs text-text-secondary hover:text-red-500 font-semibold px-2 py-1 rounded transition-colors cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
                  title={language === 'vi' ? "Gỡ tài liệu" : "Unlink document"}
                >
                  {language === 'vi' ? 'Gỡ tài liệu' : 'Unlink document'}
                </button>
              )}
            </div>
          </div>

          {/* Conditional Layout Rendering */}
          {isNewChat ? (
            /* CASE A: Centered welcome screen like Gemini */
            <div className="flex-1 flex flex-col max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto py-10 px-4 overflow-y-auto custom-scrollbar">
              <div className="w-full my-auto flex flex-col items-center">
              {/* Greeting with animated gradient colors */}
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-8 leading-tight animate-fade-in">
                <span className="bg-gradient-to-r from-primary via-[#52B788] to-[#117A65] bg-clip-text text-transparent">
                  Hi {user?.name || 'User'}, what's the plan?
                </span>
              </h2>

              {/* AI Studio Commands Cards Grid - Exact 4 suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
                {studioCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStudioCommandClick(cmd)}
                    disabled={chatLoading}
                    className={`flex flex-col p-5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-sm ${cmd.color}`}
                  >
                    <div className="flex items-center space-x-2.5 mb-2 font-bold text-xs">
                      <cmd.icon className="w-4 h-4 shrink-0" />
                      <span>{cmd.name}</span>
                    </div>
                    <p className="text-[11px] opacity-75 leading-relaxed truncate-2-lines line-clamp-2">
                      {cmd.prompt}
                    </p>
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="w-full shrink-0">
                {/* File Upload settings popup overlay */}
                {file && (() => {
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                  const isExcel = ['xlsx', 'xls', 'csv'].includes(ext);
                  const isPpt = ['pptx', 'ppt'].includes(ext);
                  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
                  const FileIcon = isVideo ? FileVideo : isExcel ? FileSpreadsheet : isPpt ? Presentation : isImage ? Image : FileText;
                  const iconColor = isVideo ? 'text-purple-500 bg-purple-500/10' : isExcel ? 'text-green-600 bg-green-500/10' : isPpt ? 'text-orange-500 bg-orange-500/10' : isImage ? 'text-blue-500 bg-blue-500/10' : 'text-red-500 bg-red-500/10';
                  const sizeMB = (file.size / 1024 / 1024).toFixed(1);
                  return (
                    <div className="mb-4 p-4 bg-background border border-border rounded-xl flex flex-col space-y-3.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${iconColor}`}>
                          <FileIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary font-bold truncate">{file.name}</p>
                          <p className="text-[10px] text-text-secondary">{sizeMB} MB · {ext?.toUpperCase()}</p>
                        </div>
                        <button onClick={() => setFile(null)} className="text-text-secondary hover:text-red-500 transition-colors shrink-0 cursor-pointer p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <div className="flex-1">
                          <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-surface dark:bg-slate-900 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer h-8.5"
                          >
                            <option value="Auto">✨ AI Tự động nhận diện danh mục</option>
                            <option value="Nhân sự">Nhân sự</option>
                            <option value="Hành chính">Hành chính</option>
                            <option value="Pháp luật">Pháp luật</option>
                            <option value="Học tập">Học tập</option>
                            <option value="Khác">Khác (Tự điền...)</option>
                          </select>
                        </div>

                        {subject === 'Khác' && (
                          <div className="flex-1">
                            <input
                              type="text"
                              value={customSubject}
                              onChange={(e) => setCustomSubject(e.target.value)}
                              placeholder="Tên danh mục riêng..."
                              className="w-full bg-surface dark:bg-slate-900 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary h-8.5"
                            />
                          </div>
                        )}

                        <button
                          onClick={handleUpload}
                          disabled={loading}
                          className="bg-primary hover:bg-primary-dark text-white text-xs px-4 py-1.5 rounded-lg font-bold flex items-center justify-center transition-colors shrink-0 h-8.5 cursor-pointer shadow-sm disabled:opacity-50 animate-pulse"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                          <span>Nạp tài liệu</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Pill-Shaped Chat Input Container matching Gemini UI */}
                <div className="relative flex items-center bg-[#F0F4F9] dark:bg-slate-800/75 border border-transparent focus-within:border-primary/20 focus-within:bg-background focus-within:dark:bg-slate-800 rounded-full px-4 py-2.5 shadow-none transition-all">
                  {/* Left Plus Attachment Trigger */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="p-2 text-text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title="Tùy chọn nạp tài liệu"
                    >
                      <Plus className={`w-5 h-5 transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45 text-primary' : ''}`} />
                    </button>
                    {showAttachmentMenu && (
                      <div
                        onMouseLeave={() => setShowAttachmentMenu(false)}
                        className="absolute bottom-full left-0 mb-3.5 w-60 bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-xl py-1.5 z-55 animate-in fade-in slide-in-from-bottom-2 duration-150"
                      >
                        <button
                          type="button"
                          onClick={() => { setIsSelectModalOpen(true); setShowAttachmentMenu(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-text-primary font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <FolderSearch className="w-4 h-4 text-primary" />
                          <span className="flex-1">📚 Chọn tài liệu đã có</span>
                          <span className="text-[9px] text-text-secondary bg-background px-1.5 py-0.5 rounded border border-border">{existingDocs.length}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsFolderSelectModalOpen(true); setShowAttachmentMenu(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-text-primary font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Folder className="w-4 h-4 text-[#117A65]" />
                          <span className="flex-1">📁 Chọn thư mục đã có</span>
                          <span className="text-[9px] text-text-secondary bg-background px-1.5 py-0.5 rounded border border-border">{existingFolders.length}</span>
                        </button>
                        <div className="border-t border-border my-1"></div>
                        <button
                          type="button"
                          onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-text-primary font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-[#52B788]" />
                          <span>📤 Tải lên tài liệu mới</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Main Input Text Field */}
                  <input
                    type="text"
                    placeholder="Ask Gemini..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 focus:outline-none text-sm text-text-primary placeholder:text-text-secondary/50 py-2.5 pl-2"
                  />

                  {/* Right Options (Model Selector & Mic/Send Button) */}
                  <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                    {/* Model Selector Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <span>{aiModel}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>
                      {showModelDropdown && (
                        <div
                          onMouseLeave={() => setShowModelDropdown(false)}
                          className="absolute bottom-full right-0 mb-3.5 w-48 bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-xl py-1.5 z-55 animate-in fade-in slide-in-from-bottom-2 duration-150"
                        >
                          <button
                            type="button"
                            onClick={() => { setAiModel('Flash'); setShowModelDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex flex-col transition-colors cursor-pointer text-text-primary"
                          >
                            <span>Gemini 1.5 Flash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAiModel('Pro'); setShowModelDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex flex-col transition-colors cursor-pointer text-text-primary"
                          >
                            <span>Gemini 1.5 Pro</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Send / Mic Icon Action Button */}
                    {message.trim() ? (
                      <button
                        onClick={handleSendChat}
                        className="p-2 bg-primary text-white rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95 w-8.5 h-8.5 shrink-0 flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toast.success('🎤 Tính năng giọng nói sẽ được mở rộng trong tương lai!')}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-full transition-colors cursor-pointer flex items-center justify-center w-8.5 h-8.5 shrink-0 flex items-center justify-center"
                      >
                        <Mic className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* NotebookLM-style Quick Add / Drop Zone */}
              {!contextDocId && !contextFolderId && (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  className="w-full mt-8 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-[#F9FBFD] dark:bg-slate-900/10 rounded-[32px] py-12 px-6 flex flex-col items-center justify-center text-center transition-all hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 animate-fade-in group"
                >
                  <p className="text-xl font-normal text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-center space-x-2">
                    <span>{language === 'vi' ? 'hoặc thả tài liệu của bạn vào đây' : 'or drag and drop your document here'}</span>
                  </p>
                  <p className="text-xs text-text-secondary/60 mb-8">
                    {language === 'vi' 
                      ? 'pdf, docx, xlsx, pptx, ảnh, video, và nhiều hơn nữa' 
                      : 'pdf, docx, xlsx, pptx, images, videos, and more'
                    }
                  </p>
 
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-surface border border-border rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-semibold text-text-primary shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-primary" />
                      <span>{t('uploadDoc')}</span>
                    </button>
 
                    <button
                      onClick={() => setIsSelectModalOpen(true)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-surface border border-border rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-semibold text-text-primary shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <FolderSearch className="w-4 h-4 text-[#117A65]" />
                      <span>{language === 'vi' ? 'Tài liệu đã có' : 'Existing documents'}</span>
                    </button>
 
                    <button
                      onClick={() => setIsFolderSelectModalOpen(true)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-surface border border-border rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-semibold text-text-primary shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <Folder className="w-4 h-4 text-amber-500" />
                      <span>{language === 'vi' ? 'Thư mục đã có' : 'Existing folders'}</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          ) : (
            /* CASE B: Chat message streaming history & input pinned at the bottom */
            <>
              {/* Chat Message List Area */}
              <div ref={chatContainerRef} className="flex-1 mb-4 flex flex-col pt-4 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto px-4">
                {displayMessages.map((chat, idx) => (
                  <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {chat.role === 'ai' && (
                      <div className="flex items-center space-x-2 mb-1 pl-4 animate-fade-in">
                        <span className="text-primary text-[10px] font-bold">AI ASSISTANT</span>
                      </div>
                    )}
                    <div className={`p-4 text-sm rounded-2xl ${
                      chat.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm max-w-[85%]'
                        : `bg-background dark:bg-surface/80 text-text-primary rounded-tl-sm border border-border shadow-sm ${!chat.text ? 'w-fit py-3 px-4' : 'w-full'}`
                    }`}>
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
                      ) : chat.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{chat.text}</p>
                      ) : !chat.text ? (
                        <div className="flex space-x-1.5 py-1 px-1.5 items-center">
                          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-300ms' }}></span>
                          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-150ms' }}></span>
                          <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                        </div>
                      ) : (
                        <MarkdownRenderer content={chat.text || ''} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pinned Input Area */}
              <div className="border-t border-border/40 pt-4 shrink-0 max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto pb-6 px-4 animate-slide-up">
                {/* Horizontal scrolling Compact suggestion pills */}
                <div className="flex space-x-2.5 overflow-x-auto pb-3 hide-scrollbar px-1 shrink-0 mb-3 justify-start items-center">
                  {studioCommands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStudioCommandClick(cmd)}
                      disabled={chatLoading}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-sm ${cmd.color}`}
                    >
                      <cmd.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{cmd.name}</span>
                    </button>
                  ))}
                </div>

                {/* File Upload settings popup overlay */}
                {file && (() => {
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                  const isExcel = ['xlsx', 'xls', 'csv'].includes(ext);
                  const isPpt = ['pptx', 'ppt'].includes(ext);
                  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
                  const FileIcon = isVideo ? FileVideo : isExcel ? FileSpreadsheet : isPpt ? Presentation : isImage ? Image : FileText;
                  const iconColor = isVideo ? 'text-purple-500 bg-purple-500/10' : isExcel ? 'text-green-600 bg-green-500/10' : isPpt ? 'text-orange-500 bg-orange-500/10' : isImage ? 'text-blue-500 bg-blue-500/10' : 'text-red-500 bg-red-500/10';
                  const sizeMB = (file.size / 1024 / 1024).toFixed(1);
                  return (
                    <div className="mb-4 p-4 bg-background border border-border rounded-xl flex flex-col space-y-3.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${iconColor}`}>
                          <FileIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary font-bold truncate">{file.name}</p>
                          <p className="text-[10px] text-text-secondary">{sizeMB} MB · {ext?.toUpperCase()}</p>
                        </div>
                        <button onClick={() => setFile(null)} className="text-text-secondary hover:text-red-500 transition-colors shrink-0 cursor-pointer p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <div className="flex-1">
                          <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-surface dark:bg-slate-900 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer h-8.5"
                          >
                            <option value="Auto">{language === 'vi' ? '✨ AI Tự động nhận diện danh mục' : '✨ AI Auto Category'}</option>
                            <option value="Nhân sự">{language === 'vi' ? 'Nhân sự' : 'HR'}</option>
                            <option value="Hành chính">{language === 'vi' ? 'Hành chính' : 'Admin'}</option>
                            <option value="Pháp luật">{language === 'vi' ? 'Pháp luật' : 'Legal'}</option>
                            <option value="Học tập">{language === 'vi' ? 'Học tập' : 'Study'}</option>
                            <option value="Khác">{language === 'vi' ? 'Khác (Tự điền...)' : 'Other (Type...)'}</option>
                          </select>
                        </div>

                        {subject === 'Khác' && (
                          <div className="flex-1">
                            <input
                              type="text"
                              value={customSubject}
                              onChange={(e) => setCustomSubject(e.target.value)}
                              placeholder={language === 'vi' ? "Tên danh mục riêng..." : "Custom category name..."}
                              className="w-full bg-surface dark:bg-slate-900 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary h-8.5"
                            />
                          </div>
                        )}

                        <button
                          onClick={handleUpload}
                          disabled={loading}
                          className="bg-primary hover:bg-primary-dark text-white text-xs px-4 py-1.5 rounded-lg font-bold flex items-center justify-center transition-colors shrink-0 h-8.5 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                          <span>{language === 'vi' ? 'Nạp tài liệu' : 'Ingest Document'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Pill-Shaped Chat Input Container matching Gemini UI */}
                <div className="relative flex items-center bg-[#F0F4F9] dark:bg-slate-800/75 border border-transparent focus-within:border-primary/20 focus-within:bg-background focus-within:dark:bg-slate-800 rounded-full px-4 py-2 shadow-none transition-all">
                  {/* Left Plus Attachment Trigger */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="p-2 text-text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
                      title={language === 'vi' ? "Tùy chọn nạp tài liệu" : "Document upload options"}
                    >
                      <Plus className={`w-5 h-5 transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45 text-primary' : ''}`} />
                    </button>
                    
                    {/* Floating Popover Attachment Menu */}
                    {showAttachmentMenu && (
                      <div
                        onMouseLeave={() => setShowAttachmentMenu(false)}
                        className="absolute bottom-full left-0 mb-3.5 w-60 bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-xl py-1.5 z-55 animate-in fade-in slide-in-from-bottom-2 duration-150"
                      >
                        <button
                          type="button"
                          onClick={() => { setIsSelectModalOpen(true); setShowAttachmentMenu(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-text-primary font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <FolderSearch className="w-4 h-4 text-primary" />
                          <span className="flex-1">{language === 'vi' ? '📚 Chọn tài liệu đã có' : '📚 Select existing document'}</span>
                          <span className="text-[9px] text-text-secondary bg-background px-1.5 py-0.5 rounded border border-border">{existingDocs.length}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsFolderSelectModalOpen(true); setShowAttachmentMenu(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-text-primary font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Folder className="w-4 h-4 text-[#117A65]" />
                          <span className="flex-1">{language === 'vi' ? '📁 Chọn thư mục đã có' : '📁 Select existing folder'}</span>
                          <span className="text-[9px] text-text-secondary bg-background px-1.5 py-0.5 rounded border border-border">{existingFolders.length}</span>
                        </button>
                        <div className="border-t border-border my-1"></div>
                        <button
                          type="button"
                          onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-text-primary font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-[#52B788]" />
                          <span>{language === 'vi' ? '📤 Tải lên tài liệu mới' : '📤 Upload new document'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Main Input Text Field */}
                  <textarea
                    placeholder="Ask Gemini..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    rows={1}
                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 focus:outline-none text-sm text-text-primary placeholder:text-text-secondary/50 py-2.5 pl-2 resize-none custom-scrollbar max-h-32"
                  />

                  {/* Right Options (Model Selector & Mic/Send Button) */}
                  <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                    {/* Model Selector Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <span>{aiModel}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>
                      {showModelDropdown && (
                        <div
                          onMouseLeave={() => setShowModelDropdown(false)}
                          className="absolute bottom-full right-0 mb-3.5 w-48 bg-surface dark:bg-slate-900 border border-border rounded-2xl shadow-xl py-1.5 z-55 animate-in fade-in slide-in-from-bottom-2 duration-150"
                        >
                          <button
                            type="button"
                            onClick={() => { setAiModel('Flash'); setShowModelDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex flex-col transition-colors cursor-pointer text-text-primary"
                          >
                            <span>Gemini 1.5 Flash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAiModel('Pro'); setShowModelDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex flex-col transition-colors cursor-pointer text-text-primary"
                          >
                            <span>Gemini 1.5 Pro</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Send / Mic Icon Action Button */}
                    {message.trim() ? (
                      <button
                        onClick={handleSendChat}
                        className="p-2 bg-primary text-white rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95 w-8.5 h-8.5 shrink-0 flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toast.success('🎤 Tính năng giọng nói sẽ được mở rộng trong tương lai!')}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-full transition-colors cursor-pointer flex items-center justify-center w-8.5 h-8.5 shrink-0 flex items-center justify-center"
                      >
                        <Mic className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.html,.htm,.txt,.png,.jpg,.jpeg,.mp4,.mov,.avi,.mkv"
          />
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
