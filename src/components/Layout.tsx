import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CURRENCY_ICONS } from '@/lib/supabase';
import {
  Home, Store, MessageSquare, Users, Shield, Moon, Sun, LogOut,
  BookOpen, Scroll, Menu, X, UserCircle, MapPinned, Dices, ShieldAlert
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Trang Chủ', icon: Home },
  { path: '/shop', label: 'Thương Thành', icon: Store },
  { path: '/forum', label: 'Diễn Đàn', icon: MessageSquare },
  { path: '/messages', label: 'Thư Tín', icon: Scroll },
  { path: '/world', label: 'Thế Giới', icon: BookOpen },
  { path: '/map', label: 'Địa Đồ', icon: MapPinned },
  { path: '/bach-phap', label: 'Bách Pháp', icon: Dices },
  { path: '/wanted', label: 'Truy Nã', icon: ShieldAlert },
  { path: '/profile', label: 'Hồ Sơ', icon: UserCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems.push({ path: '/admin', label: 'Quản Trị', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a0a] to-[#0a0a0f] text-gray-200 transition-colors duration-500">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#670201]/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-[#670201]/30">
        <div className="max-w-7xl mx-auto w-[108.7%] max-w-none -ml-[4.35%] px-4 sm:px-6 scale-[0.92] origin-top-center">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#670201] to-[#a00404] flex items-center justify-center shadow-md shadow-[#670201]/30 group-hover:shadow-[#670201]/50 transition-shadow">
                <span className="text-amber-100 font-serif text-sm font-bold">重</span>
              </div>
              <div className="hidden sm:block leading-tight">
                <h1 className="text-base font-serif font-bold text-amber-100/90 tracking-wide">Trùng Hoan Tái</h1>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase">Linh Hồn Bị Giam Cầm</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {allNavItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      active
                        ? 'bg-[#670201]/30 text-amber-100 shadow-inner'
                        : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {profile && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-black/30 border border-white/5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{CURRENCY_ICONS.HUA_TIEN}</span>
                    <span className="text-amber-200 font-semibold">{profile.hua_tien}</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{CURRENCY_ICONS.CONG_DUC}</span>
                    <span className="text-cyan-200 font-semibold">{profile.cong_duc}</span>
                  </div>
                  {profile.am_duc > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>{CURRENCY_ICONS.AM_DUC}</span>
                        <span className="text-purple-300 font-semibold">{profile.am_duc}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-400 hover:text-amber-100 hover:bg-white/5 transition-colors"
                title="Chuyển giao diện"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {profile && (
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-amber-100 hover:bg-white/5 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-[#670201]/20 bg-black/60 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {allNavItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#670201]/30 text-amber-100'
                        : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#670201]/20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-gray-500 font-serif">
            Trùng Hoan Tái — Nơi linh hồn sinh tử song hành
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Mọi giao dịch đều được ghi vết. Mọi danh tính đều có dấu tích.
          </p>
        </div>
      </footer>
    </div>
  );
}
