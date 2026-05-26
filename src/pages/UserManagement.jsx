import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, Trash2, Loader2, ShieldAlert, FileText, RotateCcw, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'deletedDocs'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useContext(AuthContext);
  const [confirmData, setConfirmData] = useState({ isOpen: false, userId: null });

  // Soft deleted docs states
  const [deletedDocs, setDeletedDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      // Hide the current admin using email to bypass any old localStorage cache issues
      const filteredUsers = res.data.filter(u => u.email !== currentUser?.email);
      setUsers(filteredUsers);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách người dùng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedDocs = async () => {
    setDocsLoading(true);
    try {
      const res = await API.get('/documents/deleted');
      setDeletedDocs(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách tài liệu đã xóa!');
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'deletedDocs') {
      fetchDeletedDocs();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const initiateDelete = (id) => {
    setConfirmData({ isOpen: true, userId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmData.userId) return;
    try {
      await API.delete(`/users/${confirmData.userId}`);
      toast.success('Người dùng đã bị xóa vĩnh viễn cùng với các tài liệu liên quan!');
      setUsers(users.filter(u => u.id !== confirmData.userId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xóa thất bại');
    }
  };

  const handleRestoreDoc = async (docId) => {
    try {
      await API.post(`/documents/${docId}/restore`);
      toast.success('Khôi phục tài liệu thành công!');
      setDeletedDocs(deletedDocs.filter(d => d.id !== docId));
    } catch (err) {
      toast.error('Lỗi khi khôi phục tài liệu!');
    }
  };

  if (loading && activeTab === 'users') {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Quản lý hệ thống (Admin Console)</h1>
      <p className="text-text-secondary text-sm mb-6">Thống kê, kiểm soát tài khoản và khôi phục dữ liệu đã xóa</p>

      {/* Tabs list */}
      <div className="flex space-x-1 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Danh sách Khách hàng</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('deletedDocs')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'deletedDocs'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Khôi phục tài liệu đã xóa</span>
          </div>
        </button>
      </div>

      {/* TAB CONTENT: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-background border-b border-border text-xs uppercase font-bold text-text-primary">
                <tr>
                  <th className="px-6 py-4">Tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-primary">{u.name || 'No Name'}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.role === 'admin' 
                            ? 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]' 
                            : 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]'
                       }`}>
                          {u.role}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => initiateDelete(u.id)}
                        className="text-text-secondary hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Xóa người dùng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
               <div className="flex flex-col items-center justify-center p-8 text-text-secondary">
                 <ShieldAlert className="w-8 h-8 opacity-30 mb-2" />
                 <p>Không có kết nối dữ liệu người dùng.</p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DELETED DOCUMENTS RESTORATION */}
      {activeTab === 'deletedDocs' && (
        <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          {docsLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-text-secondary">
                <thead className="bg-background border-b border-border text-xs uppercase font-bold text-text-primary">
                  <tr>
                    <th className="px-6 py-4">Tên tài liệu</th>
                    <th className="px-6 py-4">Chủ sở hữu (Email)</th>
                    <th className="px-6 py-4">Thẻ danh mục</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-text-primary max-w-xs truncate">{doc.title}</td>
                      <td className="px-6 py-4">{doc.user_email}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-semibold">
                          {doc.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRestoreDoc(doc.id)}
                          className="text-primary hover:text-primary-dark transition-all p-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg cursor-pointer flex items-center space-x-1 ml-auto text-xs font-bold"
                          title="Khôi phục tài liệu này"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deletedDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-text-secondary">
                  <HelpCircle className="w-8 h-8 opacity-30 mb-2" />
                  <p>Không tìm thấy tài liệu nào đã bị xóa trong thùng rác.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
         isOpen={confirmData.isOpen}
         onClose={() => setConfirmData({ isOpen: false, userId: null })}
         onConfirm={handleConfirmDelete}
         title="Cảnh báo: Xóa Người dùng?"
         message="Tài khoản này sẽ bị xóa. Toàn bộ các tài liệu (Document) mà tài khoản này đã tải lên củng sẽ bị XÓA VĨNH VIỄN theo hệ lụy Dữ liệu (Cascade). Điều này không thể được hoàn tác."
      />
    </div>
  );
};

export default UserManagement;
