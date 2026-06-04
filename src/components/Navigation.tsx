import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Settings, Shield, BookOpen } from 'lucide-react';

interface NavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: (open: boolean) => void;
}

export default function Navigation({
  activeScreen,
  onNavigate,
  mobileMenuOpen,
  onToggleMobileMenu,
}: NavigationProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Attendly</h1>
                <p className="text-slate-400 text-xs">Hudur Institute</p>
              </div>
            </div>

            {/* User Badge */}
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
              <div className="bg-slate-700 text-slate-300 p-2 rounded-lg">
                {user?.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{user?.name}</p>
                <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
