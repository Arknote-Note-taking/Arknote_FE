import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { Search, Plus } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import UploadModal from '../components/UploadModal';
import DocumentDetail from '../components/DocumentDetail';
import { useConfirm } from '../context/ConfirmContext';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const { socket } = useContext(SocketContext);
  const { confirm } = useConfirm();

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDocuments();
      return;
    }
    try {
      // Toggle to type='semantic' if we wanted intelligent search
      const res = await API.get(`/documents/search?q=${searchQuery}&type=basic`);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc muốn xóa tài liệu này?');
    if (!isConfirmed) return;
    try {
      await API.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleCreated = (newDoc) => setDocuments(docs => [newDoc, ...docs]);
    const handleUpdated = (updatedDoc) => setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    const handleDeleted = ({ id }) => setDocuments(docs => docs.filter(d => d.id !== id));

    socket.on('document_created', handleCreated);
    socket.on('document_updated', handleUpdated);
    socket.on('document_deleted', handleDeleted);

    return () => {
      socket.off('document_created', handleCreated);
      socket.off('document_updated', handleUpdated);
      socket.off('document_deleted', handleDeleted);
    };
  }, [socket]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Library</h1>
          <p className="text-text-secondary mt-1">Manage and interact with your AI knowledge base.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center space-x-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search or ask anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface/50 border border-white/10 rounded-xl text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            <Plus className="w-5 h-5"/>
            <span>Upload</span>
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="border-2 border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-surface p-4 rounded-3xl mb-4 border border-white/5">
            <Search className="w-10 h-10 text-text-secondary/50" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No documents found</h3>
          <p className="text-text-secondary max-w-sm">Upload your first document to let AI extract knowledge and map relationships.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map(doc => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              onClick={(d) => setSelectedDoc(d)} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      {selectedDoc && <DocumentDetail doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
};

export default Dashboard;
