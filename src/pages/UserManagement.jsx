import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useContext(AuthContext);
  const [confirmData, setConfirmData] = useState({ isOpen: false, userId: null });

  const fetchUsers = async () => {
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

  useEffect(() => {
    fetchUsers();
  }, []);

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

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl h-full flex flex-col">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Quản lý người dùng</h1>
      <p className="text-text-secondary text-sm mb-6">Thống kê và kiểm soát toàn bộ tài khoản tại hệ thống</p>

      <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-[#F8F9FA] border-b border-border text-xs uppercase font-bold text-text-primary">
              <tr>
                <th className="px-6 py-4">Tên</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-black/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-text-primary">{u.name || 'No Name'}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#E0F2FE] text-[#0284C7]'
                     }`}>
                        {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => initiateDelete(u.id)}
                      className="text-text-secondary hover:text-red-500 transition-colors p-1"
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
