import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleTheme } from '../store/slices/themeSlice';
import { logout } from '../store/slices/authSlice';
import { Sun, Moon, LogOut, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);

  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            TaskCraft
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {/* User Section */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={() => dispatch(logout())}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};