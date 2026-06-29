import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, Trash2, Loader2, ShieldAlert, RotateCcw, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '../context/LanguageContext';

const USER_PAGE_SIZE = 10;

// Reusable Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { language } = useLanguage();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        title={language === 'vi' ? "Trang trước" : "Prev Page"}
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
        title={language === 'vi' ? "Trang tiếp" : "Next Page"}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const UserManagement = () => {
  const { language } = useLanguage();
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
      toast.error(language === 'vi' ? 'Lỗi khi tải danh sách người dùng!' : 'Error loading user list!');
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
      toast.error(language === 'vi' ? 'Lỗi khi tải danh sách tài khoản đã xóa!' : 'Error loading deleted users list!');
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
      toast.error(language === 'vi' ? 'Trầm trọng: Bạn không thể tự xóa chính mình!' : 'Critical: You cannot delete yourself!');
      return;
    }
    triggerConfirm(
      language === 'vi' ? 'Xóa tạm thời Người dùng?' : 'Soft Delete User?',
      language === 'vi' 
        ? `Tài khoản "${userEmail || 'này'}" sẽ bị xóa tạm thời (vô hiệu hóa). Bạn có thể khôi phục tài khoản này bất cứ lúc nào trong tab Khôi phục tài khoản đã xóa.`
        : `Account "${userEmail || 'this user'}" will be temporarily deleted (disabled). You can restore this account at any time in the Restorations tab.`,
      language === 'vi' ? 'Xóa tạm thời' : 'Delete Temporarily',
      async () => {
        try {
          await API.delete(`/users/${id}`);
          toast.success(language === 'vi' ? 'Tài khoản người dùng đã được xóa tạm thời!' : 'User account has been temporarily deleted!');
          setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          toast.error(err.response?.data?.error || (language === 'vi' ? 'Xóa thất bại' : 'Delete failed'));
        }
      }
    );
  };

  const handleRestoreUser = (id, userEmail) => {
    triggerConfirm(
      language === 'vi' ? 'Khôi phục Tài khoản?' : 'Restore User Account?',
      language === 'vi'
        ? `Bạn có chắc chắn muốn khôi phục tài khoản "${userEmail || 'này'}"? Người dùng này sẽ hoạt động trở lại bình thường và có thể đăng nhập.`
        : `Are you sure you want to restore "${userEmail || 'this'}"? This user will be active again and can log in.`,
      language === 'vi' ? 'Khôi phục ngay' : 'Restore Now',
      async () => {
        try {
          await API.post(`/users/${id}/restore`);
          toast.success(language === 'vi' ? 'Khôi phục tài khoản thành công!' : 'Restored user account successfully!');
          setDeletedUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          toast.error(language === 'vi' ? 'Lỗi khi khôi phục tài khoản!' : 'Error restoring user account!');
        }
      }
    );
  };

  const handlePermanentDelete = (id, userEmail) => {
    triggerConfirm(
      language === 'vi' ? 'Xóa vĩnh viễn Tài khoản?' : 'Permanently Delete User Account?',
      language === 'vi'
        ? `Hành động này sẽ XÓA VĨNH VIỄN tài khoản "${userEmail || 'này'}" khỏi cơ sở dữ liệu. Dữ liệu của người dùng này không thể khôi phục lại. Bạn có chắc chắn?`
        : `This action will PERMANENTLY DELETE "${userEmail || 'this user'}" from the database. This user data cannot be recovered. Are you sure?`,
      language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete Permanently',
      async () => {
        try {
          await API.delete(`/users/${id}/permanent`);
          toast.success(language === 'vi' ? 'Đã xóa vĩnh viễn tài khoản thành công!' : 'Permanently deleted user account successfully!');
          setDeletedUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          toast.error(err.response?.data?.error || (language === 'vi' ? 'Lỗi khi xóa vĩnh viễn tài khoản!' : 'Error permanently deleting user account!'));
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
    <div className="max-w-[1600px] w-full mx-auto flex flex-col pb-12">      {/* Tabs list */}
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
            <span>{language === 'vi' ? 'Danh sách Khách hàng' : 'User List'}</span>
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
            <span>{language === 'vi' ? 'Tài khoản đã xóa' : 'Deleted Accounts'}</span>
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
                  <th className="px-6 py-4">{language === 'vi' ? 'Tên' : 'Name'}</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                  <th className="px-6 py-4 text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-primary">{u.name || (language === 'vi' ? 'Chưa đặt tên' : 'No Name')}</td>
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
                        title={language === 'vi' ? "Xóa người dùng" : "Delete user"}
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
                <p>{language === 'vi' ? 'Không có kết nối dữ liệu người dùng.' : 'No user data connection.'}</p>
              </div>
            )}
          </div>

          {/* Users Pagination */}
          {users.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-xs text-text-secondary">
                  {language === 'vi' 
                    ? `Hiển thị ${(userPage - 1) * USER_PAGE_SIZE + 1}–${Math.min(userPage * USER_PAGE_SIZE, users.length)} / ${users.length} người dùng` 
                    : `Showing ${(userPage - 1) * USER_PAGE_SIZE + 1}–${Math.min(userPage * USER_PAGE_SIZE, users.length)} / ${users.length} users`
                  }
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
                      <th className="px-6 py-4">{language === 'vi' ? 'Tên' : 'Name'}</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                      <th className="px-6 py-4 text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDeletedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-text-primary">{u.name || (language === 'vi' ? 'Chưa đặt tên' : 'No Name')}</span>
                            {u.restore_requested && (
                              <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full leading-none animate-pulse whitespace-nowrap">
                                {language === 'vi' ? 'Đang yêu cầu khôi phục' : 'Restore requested'}
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
                              title={language === 'vi' ? "Khôi phục tài khoản này" : "Restore this account"}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Khôi phục' : 'Restore'}</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(u.id, u.email)}
                              className="text-red-500 hover:text-red-600 transition-all p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg cursor-pointer flex items-center space-x-1 text-xs font-bold"
                              title={language === 'vi' ? "Xóa vĩnh viễn tài khoản này" : "Permanently delete this account"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete Permanently'}</span>
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
                    <p>{language === 'vi' ? 'Không tìm thấy tài khoản nào đã bị xóa.' : 'No deleted accounts found.'}</p>
                  </div>
                )}
              </div>

              {/* Deleted Users Pagination */}
              {deletedUsers.length > 0 && (
                <div className="px-4">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-xs text-text-secondary">
                      {language === 'vi' 
                        ? `Hiển thị ${(deletedUsersPage - 1) * USER_PAGE_SIZE + 1}–${Math.min(deletedUsersPage * USER_PAGE_SIZE, deletedUsers.length)} / ${deletedUsers.length} tài khoản` 
                        : `Showing ${(deletedUsersPage - 1) * USER_PAGE_SIZE + 1}–${Math.min(deletedUsersPage * USER_PAGE_SIZE, deletedUsers.length)} / ${deletedUsers.length} accounts`
                      }
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
        confirmText={confirmData.confirmText === 'Xác nhận' ? (language === 'vi' ? 'Xác nhận' : 'Confirm') : confirmData.confirmText}
      />
    </div>
  );
};

export default UserManagement;
