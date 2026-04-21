import React, { useContext, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutGrid, FileText, BrainCircuit, Network, Bell, User as UserIcon, Users } from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  const baseNavItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutGrid },
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
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 h-full">
        <div>
          <div className="h-16 flex items-center px-6">
            <h1 className="text-2xl font-bold tracking-tight">Arknote</h1>
          </div>
          <nav className="mt-6 px-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink 
                  key={item.name} 
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
                    ${active ? 'bg-secondary text-primary' : 'text-text-secondary hover:bg-black/5'}`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-text-secondary'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <button 
             onClick={handleLogout}
             className="w-full py-2 text-sm text-text-secondary hover:text-red-500 hover:bg-red-50 transition rounded-xl text-left px-4"
          >
             Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center text-text-secondary">
             <div className="w-6 h-6 border border-border rounded flex items-center justify-center bg-background">
               <span className="text-xs">⌘</span>
             </div>
          </div>
          <div className="flex items-center space-x-5">
            <button className="text-text-secondary hover:text-text-primary transition">
              <Bell className="w-5 h-5" />
            </button>
            <NavLink to="/profile" className="flex items-center space-x-2 border border-border p-1 rounded-full cursor-pointer hover:bg-black/5 hover:border-primary/30 transition group">
              <div className="w-7 h-7 bg-text-secondary/10 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors overflow-hidden">
                {user?.avatar_url ? (
                  <img src={`http://localhost:5000${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                )}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Outlet / Children */}
        <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
