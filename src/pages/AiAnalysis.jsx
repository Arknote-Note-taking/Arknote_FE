import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Upload, MessageSquare, Loader2, Send, FolderSearch } from 'lucide-react';
import DocumentSelectModal from '../components/DocumentSelectModal';

const AiAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Auto');
  const [contextDocId, setContextDocId] = useState(null);
  const [existingDocs, setExistingDocs] = useState([]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'ai',
      text: 'Xin chào! Tôi là AI trợ lý phân tích tài liệu. Bạn có thể:\n- Chọn hoặc tài lên tài liệu để phân tích\n- Hỏi về nội dung tài liệu\n- Yêu cầu tóm tắt nội dung\n- Tìm kiếm thông tin'
    }
  ]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await API.get('/documents');
        setExistingDocs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, []);

  const handleSelectExistingDoc = (docId) => {
    if (!docId) return;
    
    const doc = existingDocs.find(d => d.id === docId);
    if (doc) {
      setContextDocId(doc.id);
      setIsSelectModalOpen(false);
      setChatHistory(prev => [
        ...prev,
        { role: 'user', type: 'file', docName: doc.title },
        { role: 'ai', text: `Trong không gian của tài liệu "${doc.title}" đã chọn, bạn có yêu cầu gì?` }
      ]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (subject !== 'Auto') {
         formData.append('subject', subject);
      }
      
      const res = await API.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update the existing document list locally so it shows up in Modal immediately.
      setExistingDocs(prev => [res.data, ...prev]);

      setContextDocId(res.data.id);
      setChatHistory(prev => [
        ...prev, 
        { role: 'user', type: 'file', docName: file.name },
        { role: 'ai', text: `Đã tiếp nhận không gian ngữ nghĩa từ tài liệu "${file.name}". Bạn muốn tôi giúp gì từ dữ liệu này?` }
      ]);
      toast.success('Đã nạp tài liệu vào khung Chat!');
      setFile(null);
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.error || 'Tải lên thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!message.trim()) return;
    
    const userMsg = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      if (contextDocId) {
         const res = await API.post('/ai/qna', { documentId: contextDocId, question: userMsg });
         setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
      } else {
         const res = await API.post('/ai/chat', { message: userMsg });
         setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Xin lỗi, kết nối API bị lỗi. Vui lòng thử lại.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-4xl max-h-full flex flex-col h-full">
      <h1 className="text-2xl font-bold text-text-primary mb-1">AI Phân tích tài liệu</h1>
      <p className="text-text-secondary text-sm mb-6">Chat với AI để phân tích, phân loại và tìm kiếm tài liệu</p>

      <div className="bg-surface border border-border rounded-2xl flex-1 flex flex-col p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] relative min-h-[500px]">
        
        {/* Chat Area */}
        <div className="flex-1 mb-6 flex flex-col pt-4 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
           {chatHistory.map((chat, idx) => (
             <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                {chat.role === 'ai' && (
                  <div className="flex items-center space-x-2 mb-1 pl-4">
                    <span className="text-primary text-[10px] font-bold">AI ASSISTANT</span>
                  </div>
                )}
                <div className={`p-4 text-sm max-w-[80%] rounded-2xl ${chat.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-[#F1F5F9] text-text-primary rounded-tl-sm'}`}>
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
               <div className="bg-[#F1F5F9] rounded-2xl rounded-tl-sm p-4 text-sm text-text-primary">
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
           
           <div className="flex items-center mb-5 px-1">
             <button 
               onClick={() => setIsSelectModalOpen(true)}
               className="w-full bg-white hover:bg-black/5 border border-border rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm cursor-pointer group"
             >
               <div className="flex items-center space-x-3 text-text-primary font-medium">
                 <div className="bg-secondary text-primary p-2 rounded-lg group-hover:scale-105 transition-transform">
                   <FolderSearch className="w-5 h-5" />
                 </div>
                 <span>📚 Chọn tài liệu từ kho lưu trữ...</span>
               </div>
               <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded-md border border-border">
                 {existingDocs.length} tài liệu
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
             <p className="text-xs text-text-secondary mb-4">PDF, DOCX, TXT, XLSX (Tối đa 20MB)</p>
             <button className="bg-surface border border-border px-4 py-2 text-xs font-semibold rounded-lg hover:bg-black/5 transition">
               Chọn tệp
             </button>
             
             <input 
               type="file" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={(e) => setFile(e.target.files[0])}
               accept=".pdf,.png,.jpg,.jpeg"
             />
           </div>

           {file && (
             <div className="mt-4 p-4 bg-white border border-border rounded-xl flex flex-col space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-text-primary font-medium truncate">{file.name}</span>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-semibold text-text-secondary mb-1">Danh mục (Tùy chọn)</label>
                   <select 
                     value={subject} 
                     onChange={(e) => setSubject(e.target.value)}
                     className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                   >
                     <option value="Auto">✨ AI Tự động nhận diện</option>
                     <option value="Nhân sự">Nhân sự</option>
                     <option value="Hành chính">Hành chính</option>
                     <option value="Pháp luật">Pháp luật</option>
                     <option value="Học tập">Học tập</option>
                     <option value="Khác">Khác</option>
                   </select>
                 </div>

                 <button onClick={handleUpload} disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg font-medium flex items-center justify-center transition-colors">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null} 
                   {loading ? 'Đang tải & Phân tích...' : 'Xác nhận tải lên'}
                 </button>
             </div>
           )}
        </div>
      </div>
      
      <DocumentSelectModal 
        isOpen={isSelectModalOpen} 
        onClose={() => setIsSelectModalOpen(false)} 
        documents={existingDocs} 
        onSelect={handleSelectExistingDoc} 
      />
    </div>
  );
};

export default AiAnalysis;
