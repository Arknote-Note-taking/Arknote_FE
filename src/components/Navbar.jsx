import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, LogOut, Network, Search } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed w-full z-50 bg-surface/80 backdrop-blur-md border-b border-white/10 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <BrainCircuit className="w-8 h-8"/>
            <span className="text-white">Arknote <span className="text-primary font-light">AI</span></span>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-6">
              <Link 
                to="/" 
                className={`flex items-center space-x-1 transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
              >
                <Search className="w-5 h-5"/>
                <span>Library</span>
              </Link>
              <Link 
                to="/graph" 
                className={`flex items-center space-x-1 transition-colors ${location.pathname === '/graph' ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
              >
                <Network className="w-5 h-5"/>
                <span>Knowledge Graph</span>
              </Link>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-text-secondary">
                  {user.name || user.email.split('@')[0]}
                  {user.role === 'admin' && <span className="ml-2 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full border border-secondary/30">Admin</span>}
                </span>
                <button onClick={handleLogout} className="p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-full transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
