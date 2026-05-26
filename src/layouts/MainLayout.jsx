import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutGrid, FileText, BrainCircuit, Network, Bell, User as UserIcon, Users, FolderOpen, Sun, Moon } from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

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
          <div className="h-16 flex items-center px-6">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-[#52B788] bg-clip-text text-transparent">Arknote</h1>
          </div>
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
        <div className="p-4 border-t border-border">
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
              className={`relative p-1.5 rounded-xl transition-all cursor-pointer flex items-center text-xs font-medium px-2 border ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
              }`}
              title="Chuyển chế độ Sáng/Tối"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="text-text-secondary hover:text-text-primary transition cursor-pointer">
              <Bell className="w-5 h-5" />
            </button>
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
