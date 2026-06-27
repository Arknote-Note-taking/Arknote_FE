import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, Trash2, Loader2, ShieldAlert, RotateCcw, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const USER_PAGE_SIZE = 10;

// Reusable Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Trang trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${page === currentPage
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Trang tiếp"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'deletedUsers'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useContext(AuthContext);
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    onConfirm: null
  });

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [deletedUsersPage, setDeletedUsersPage] = useState(1);

  // Soft deleted users states
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [deletedUsersLoading, setDeletedUsersLoading] = useState(false);

  const triggerConfirm = (title, message, confirmText, onConfirm) => {
    setConfirmData({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

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

  const fetchDeletedUsers = async () => {
    setDeletedUsersLoading(true);
    try {
      const res = await API.get('/users/deleted');
      // Hide current admin if they are deleted (should not happen, but for safety)
      const filteredDeleted = res.data.filter(u => u.email !== currentUser?.email);
      setDeletedUsers(filteredDeleted);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách tài khoản đã xóa!');
    } finally {
      setDeletedUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'deletedUsers') {
      fetchDeletedUsers();
    } else {
      fetchUsers();
    }
  }, [activeTab, currentUser]);

  // Auto-adjust userPage if it becomes out of range after a delete
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(users.length / USER_PAGE_SIZE));
    if (userPage > totalPages) {
      setUserPage(totalPages);
    }
  }, [users]);

  // Auto-adjust deletedUsersPage if it becomes out of range after a restore
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(deletedUsers.length / USER_PAGE_SIZE));
    if (deletedUsersPage > totalPages) {
      setDeletedUsersPage(totalPages);
    }
  }, [deletedUsers]);

  const initiateDelete = (id, userEmail) => {
    if (id === currentUser?.id || userEmail === currentUser?.email) {
      toast.error('Trầm trọng: Bạn không thể tự xóa chính mình!');
      return;
    }
    triggerConfirm(
      'Xóa tạm thời Người dùng?',
      `Tài khoản "${userEmail || 'này'}" sẽ bị xóa tạm thời (vô hiệu hóa). Bạn có thể khôi phục tài khoản này bất cứ lúc nào trong tab Khôi phục tài khoản đã xóa.`,
      'Xóa tạm thời',
      async () => {
        try {
          await API.delete(`/users/${id}`);
          toast.success('Tài khoản người dùng đã được xóa tạm thời!');
          setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          toast.error(err.response?.data?.error || 'Xóa thất bại');
        }
      }
    );
  };

  const handleRestoreUser = (id, userEmail) => {
    triggerConfirm(
      'Khôi phục Tài khoản?',
      `Bạn có chắc chắn muốn khôi phục tài khoản "${userEmail || 'này'}"? Người dùng này sẽ hoạt động trở lại bình thường và có thể đăng nhập.`,
      'Khôi phục ngay',
      async () => {
        try {
          await API.post(`/users/${id}/restore`);
          toast.success('Khôi phục tài khoản thành công!');
          setDeletedUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          toast.error('Lỗi khi khôi phục tài khoản!');
        }
      }
    );
  };

  const handlePermanentDelete = (id, userEmail) => {
    triggerConfirm(
      'Xóa vĩnh viễn Tài khoản?',
      `Hành động này sẽ XÓA VĨNH VIỄN tài khoản "${userEmail || 'này'}" khỏi cơ sở dữ liệu. Dữ liệu của người dùng này không thể khôi phục lại. Bạn có chắc chắn?`,
      'Xóa vĩnh viễn',
      async () => {
        try {
          await API.delete(`/users/${id}/permanent`);
          toast.success('Đã xóa vĩnh viễn tài khoản thành công!');
          setDeletedUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          toast.error(err.response?.data?.error || 'Lỗi khi xóa vĩnh viễn tài khoản!');
        }
      }
    );
  };

  // Paginated slices
  const userTotalPages = Math.max(1, Math.ceil(users.length / USER_PAGE_SIZE));
  const pagedUsers = users.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE);

  const deletedUsersTotalPages = Math.max(1, Math.ceil(deletedUsers.length / USER_PAGE_SIZE));
  const pagedDeletedUsers = deletedUsers.slice((deletedUsersPage - 1) * USER_PAGE_SIZE, deletedUsersPage * USER_PAGE_SIZE);

  if (loading && activeTab === 'users') {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-[1600px] w-full mx-auto flex flex-col pb-12">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Quản lý hệ thống (Admin Console)</h1>
      <p className="text-text-secondary text-sm mb-6">Thống kê, kiểm soát và khôi phục tài khoản người dùng đã xóa</p>

      {/* Tabs list */}
      <div className="flex space-x-1 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'users'
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
          onClick={() => setActiveTab('deletedUsers')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'deletedUsers'
            ? 'border-b-2 border-primary text-primary'
            : 'text-text-secondary hover:text-text-primary'
            }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-red-500" />
            <span>Tài khoản đã xóa</span>
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
                {pagedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-primary">{u.name || 'No Name'}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin'
                        ? 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]'
                        : 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => initiateDelete(u.id, u.email)}
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

          {/* Users Pagination */}
          {users.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-xs text-text-secondary">
                  Hiển thị {(userPage - 1) * USER_PAGE_SIZE + 1}–{Math.min(userPage * USER_PAGE_SIZE, users.length)} / {users.length} người dùng
                </span>
                <Pagination
                  currentPage={userPage}
                  totalPages={userTotalPages}
                  onPageChange={setUserPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DELETED USERS RESTORATION */}
      {activeTab === 'deletedUsers' && (
        <div className="bg-surface border border-border rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          {deletedUsersLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
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
                    {pagedDeletedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-text-primary">{u.name || 'No Name'}</span>
                            {u.restore_requested && (
                              <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full leading-none animate-pulse whitespace-nowrap">
                                Đang yêu cầu khôi phục
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin'
                            ? 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#D97706]/15 dark:text-[#FBB024]'
                            : 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0284C7]/15 dark:text-[#38BDF8]'
                            }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleRestoreUser(u.id, u.email)}
                              className="text-primary hover:text-primary-dark transition-all p-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg cursor-pointer flex items-center space-x-1 text-xs font-bold"
                              title="Khôi phục tài khoản này"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Khôi phục</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(u.id, u.email)}
                              className="text-red-500 hover:text-red-600 transition-all p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg cursor-pointer flex items-center space-x-1 text-xs font-bold"
                              title="Xóa vĩnh viễn tài khoản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa vĩnh viễn</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deletedUsers.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-12 text-text-secondary">
                    <HelpCircle className="w-8 h-8 opacity-30 mb-2" />
                    <p>Không tìm thấy tài khoản nào đã bị xóa.</p>
                  </div>
                )}
              </div>

              {/* Deleted Users Pagination */}
              {deletedUsers.length > 0 && (
                <div className="px-4">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-xs text-text-secondary">
                      Hiển thị {(deletedUsersPage - 1) * USER_PAGE_SIZE + 1}–{Math.min(deletedUsersPage * USER_PAGE_SIZE, deletedUsers.length)} / {deletedUsers.length} tài khoản
                    </span>
                    <Pagination
                      currentPage={deletedUsersPage}
                      totalPages={deletedUsersTotalPages}
                      onPageChange={setDeletedUsersPage}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmData.onConfirm}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
      />
    </div>
  );
};

export default UserManagement;
