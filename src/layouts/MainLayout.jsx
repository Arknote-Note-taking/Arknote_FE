import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutGrid, FileText, BrainCircuit, Network, Bell, User as UserIcon, Users, FolderOpen, Sun, Moon, Trash2, ClipboardList } from 'lucide-react';
import { SocketContext } from '../context/SocketContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearNotifications, deleteNotification } = useContext(SocketContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setShowNotifications(false);

    const targetDocId = notif.doc_id || notif.docId;
    if (!targetDocId) return;

    if (notif.type === 'document_restore_request' || notif.is_for_admin) {
      // Admin redirect: Deleted Documents
      navigate('/documents', { state: { viewMode: 'deleted', highlightDocId: targetDocId } });
    } else if (notif.type === 'document_restored' || !notif.is_for_admin) {
      // User redirect: Active Documents
      navigate('/documents', { state: { viewMode: 'documents', highlightDocId: targetDocId } });
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/');
  }

  const baseNavItems = [
    { name: 'Tổng quan', path: '/dashboard', icon: LayoutGrid },
    { name: 'Tài liệu', path: '/documents', icon: FileText },
    { name: 'AI phân tích', path: '/ai', icon: BrainCircuit },
    { name: 'Knowledge Map', path: '/graph', icon: Network },
    { name: 'Lịch sử Quiz', path: '/quizzes', icon: ClipboardList },
  ];

  const navItems = user?.role === 'admin'
    ? [
      ...baseNavItems.filter(item => item.path !== '/ai' && item.path !== '/graph'),
      { name: 'Khách hàng', path: '/users', icon: Users }
    ]
    : baseNavItems;

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 h-full transition-colors duration-300">
        <div>
          <NavLink to="/" className="h-16 flex items-center px-6 hover:opacity-85 transition-opacity">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">Arknote</h1>
          </NavLink>
          <nav className="mt-4 px-3 space-y-0.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group
                    ${active
                      ? 'bg-primary/10 dark:bg-primary/15 text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <item.icon className={`w-4.5 h-4.5 transition-colors ${active ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`} />
                  <span>{item.name}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border space-y-4">
          {/* Plan status card */}
          {user?.role !== 'admin' && (
            <div className="bg-background border border-border p-3.5 rounded-2xl flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Gói tài khoản</span>
                {user?.is_pro ? (
                  <span className="text-[9px] bg-amber-500 text-white font-black px-2.5 py-1 rounded-full shadow-md shadow-amber-500/20 uppercase tracking-wider animate-pulse">
                    Pro
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-500 text-white font-black px-2.5 py-1 rounded-full shadow-md shadow-slate-500/25 uppercase tracking-wider">
                    Free
                  </span>
                )}
              </div>
              {!user?.is_pro && (
                <button
                  onClick={() => navigate('/#pricing')}
                  className="text-[10px] text-primary hover:text-primary-dark font-extrabold w-fit hover:underline text-left cursor-pointer transition"
                >
                  Nâng cấp lên PRO
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all rounded-xl text-left px-4 cursor-pointer flex items-center space-x-2"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 transition-colors duration-300">
          <div className="flex items-center text-text-secondary">
            <div className="text-xs text-text-secondary/50 font-medium hidden sm:block">Arknote AI Platform</div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative p-1.5 rounded-xl transition-all cursor-pointer flex items-center text-xs font-medium px-2 border ${darkMode
                ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                }`}
              title="Chuyển chế độ Sáng/Tối"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-text-secondary hover:text-text-primary transition cursor-pointer relative p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                title="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-[250] overflow-hidden transform origin-top-right transition-all">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-background">
                    <span className="font-extrabold text-sm text-text-primary">Thông báo</span>
                    <div className="flex space-x-2 text-[10px]">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => { markAllAsRead(); }}
                          className="text-primary hover:underline font-bold cursor-pointer"
                        >
                          Đọc tất cả
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={() => { clearNotifications(); }}
                          className="text-text-secondary hover:text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Xóa hết
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-y-auto divide-y divide-border custom-scrollbar" style={{ maxHeight: '225px' }}>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                          !notif.read ? 'bg-primary/5 font-medium' : 'text-text-secondary'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className={`font-bold ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {notif.title}
                          </span>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-[9px] text-text-secondary whitespace-nowrap">
                              {new Date(notif.created_at || notif.createdAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-text-secondary hover:text-red-500 p-0.5 rounded transition-all opacity-60 hover:opacity-100 cursor-pointer"
                              title="Xóa thông báo này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-1 leading-normal">
                          {notif.message}
                        </p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-text-secondary text-xs italic">
                        Không có thông báo nào.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/profile" className="flex items-center space-x-2 border border-border p-1 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 hover:border-primary/30 transition group">
              <div className="w-7 h-7 bg-text-secondary/10 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:5000${user.avatar_url}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                )}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Outlet / Children */}
        <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-background text-text-primary transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
