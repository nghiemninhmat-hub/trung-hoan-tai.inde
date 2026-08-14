import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENCY_ICONS } from '@/lib/supabase';
import {
  Store, MessageSquare, Scroll, BookOpen, UserCircle, Shield,
  Ghost, Sparkles, Coins, Skull, ArrowRight, Flame
} from 'lucide-react';

export default function HomePage() {
  const { profile, isAdmin } = useAuth();

  const categories = [
    {
      title: 'Thương Thành',
      desc: 'Giao dịch vật phẩm, pháp khí, linh dược. Dùng Hoa Tiền, Công Đức hoặc Âm Đức để mua.',
      icon: Store,
      path: '/shop',
      color: 'from-amber-900/20 to-amber-950/10',
      border: 'border-amber-800/30',
    },
    {
      title: 'Diễn Đàn Ẩn Danh',
      desc: 'Thảo luận roleplay với danh tính ẩn danh. Mọi bài đăng đều để lại dấu tích.',
      icon: MessageSquare,
      path: '/forum',
      color: 'from-cyan-900/20 to-cyan-950/10',
      border: 'border-cyan-800/30',
    },
    {
      title: 'Thư Tín Nội Bộ',
      desc: 'Gửi thư tín trực tiếp cho người chơi khác. Hệ thống tin nhắn thuần văn bản.',
      icon: Scroll,
      path: '/messages',
      color: 'from-slate-800/20 to-slate-950/10',
      border: 'border-slate-700/30',
    },
    {
      title: 'Thế Giới Quan',
      desc: 'Khám phá bách khoa toàn thư Trùng Hoan Tái. Lịch sử, quy tắc, dị sự, bách quỷ.',
      icon: BookOpen,
      path: '/world',
      color: 'from-emerald-900/20 to-emerald-950/10',
      border: 'border-emerald-800/30',
    },
    {
      title: 'Hồ Sơ Nhân Vật',
      desc: 'Xem hồ sơ OC, chỉnh sửa danh tính, kiểm tra tài sản và lịch sử giao dịch.',
      icon: UserCircle,
      path: '/profile',
      color: 'from-rose-900/20 to-rose-950/10',
      border: 'border-rose-800/30',
    },
  ];

  if (isAdmin) {
    categories.push({
      title: 'Bảng Điều Khiển',
      desc: 'Quản trị hệ thống: phê duyệt tài khoản, quản lý tài sản, giám sát danh tính.',
      icon: Shield,
      path: '/admin',
      color: 'from-red-900/20 to-red-950/10',
      border: 'border-red-800/30',
    });
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative text-center pt-8 pb-12">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-[#670201]/10 rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-6">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Hệ Thống Trùng Hoan</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold text-amber-100/90 mb-4 tracking-wider">
            Trùng Hoan Tái
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 font-serif max-w-2xl mx-auto leading-relaxed">
            Nơi linh hồn bị giam giữ, sinh tử song hành.
            <br />
            <span className="text-amber-200/60">Mười lăm dị sự — con đường duy nhất trở về hiện thực.</span>
          </p>
          {!profile && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link
                to="/register"
                className="px-6 py-3 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-lg shadow-lg shadow-[#670201]/30 hover:shadow-[#670201]/50 hover:scale-105 transition-all duration-300"
              >
                Nhập Vụ Trùng Hoan
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-[#670201]/40 text-amber-100/80 font-bold rounded-lg hover:bg-[#670201]/10 transition-all duration-300"
              >
                Đăng Nhập
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Player Status Bar */}
      {profile && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
              <UserCircle className="w-3.5 h-3.5" />
              Danh Tính
            </div>
            <p className="text-lg font-bold text-amber-100 truncate">{profile.oc_name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {profile.is_approved ? (
                <span className="text-emerald-400">Đã phê duyệt</span>
              ) : (
                <span className="text-amber-400">Chờ phê duyệt</span>
              )}
            </p>
          </div>
          <div className="p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
              <Coins className="w-3.5 h-3.5" />
              Hoa Tiền
            </div>
            <p className="text-2xl font-bold text-amber-200">{profile.hua_tien}</p>
          </div>
          <div className="p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Công Đức
            </div>
            <p className="text-2xl font-bold text-cyan-200">{profile.cong_duc}</p>
          </div>
          <div className="p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
              <Skull className="w-3.5 h-3.5" />
              Âm Đức
            </div>
            <p className="text-2xl font-bold text-purple-300">{profile.am_duc}</p>
          </div>
        </section>
      )}

      {/* Category Cards */}
      <section>
        <h2 className="text-2xl font-serif font-bold text-amber-100/80 mb-6 text-center">
          Sáu Cõi Trùng Hoan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.path}
                to={cat.path}
                className={`group relative p-6 rounded-xl bg-gradient-to-br ${cat.color} border ${cat.border} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 overflow-hidden`}
              >
                <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center mb-4 group-hover:bg-black/40 transition-colors">
                    <Icon className="w-6 h-6 text-amber-200/80" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-100/90 mb-2 font-serif">{cat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{cat.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-xs text-amber-300/60 group-hover:text-amber-300 transition-colors">
                    <span>Khám phá</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lore Section */}
      <section className="p-8 rounded-2xl bg-black/20 border border-[#670201]/20 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#670201]/20 flex items-center justify-center flex-shrink-0">
            <Ghost className="w-7 h-7 text-amber-300/70" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-amber-100/80 mb-3">Lịch Sử</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Trong thế giới Trùng Hoan Tái, bạn là một linh hồn bị giam giữ nơi sinh tử song hành.
              Để tìm con đường trở về hiện thực, bạn phải hoàn thành 15 dị sự — mỗi dị sự là một thử thách
              với quỷ dị, cạm bẫy và phần thưởng riêng. Giao dịch vật phẩm, tu hành công đức, hoặc
              dấn thân vào cấm thuật âm đức — mọi lựa chọn đều để lại dấu vết trong lịch sử.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mt-3 italic">
              "Bách Quỷ Âm ghi chép trăm loại quỷ dị. Nắm vững nó là chìa khóa sinh tồn."
            </p>
          </div>
        </div>
      </section>

      {/* Điều hành & Liên hệ */}
      <section className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#1b0b0a] via-[#100706] to-[#090506] p-6 sm:p-8 shadow-[0_0_40px_rgba(103,2,1,0.16)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#670201]/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                <Shield className="h-3.5 w-3.5" />
                Ban Điều Hành
              </div>
              <h3 className="font-serif text-2xl font-bold text-amber-100 sm:text-3xl">Kết nối cùng Trùng Hoan</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">Theo dõi thông báo, sự kiện và những cập nhật mới nhất từ Ban Điều Hành trên Facebook.</p>
            </div>
            <a href="https://www.facebook.com/groups/1385121653516597" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-200 transition-all hover:-translate-y-0.5 hover:bg-amber-400/20 hover:text-amber-100">
              <ExternalLink className="h-4 w-4" />
              Vào Group Trùng Hoan
            </a>
          </div>
          <div className="my-6 h-px bg-gradient-to-r from-amber-500/30 via-[#670201]/40 to-transparent" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Vịnh Quyển Trà', 'https://www.facebook.com/profile.php?id=61592344791540'],
              ['Biện Thừa Chí', 'https://www.facebook.com/profile.php?id=61590919357024'],
              ['Ngôn Cảnh Tắc', 'https://www.facebook.com/ngon.canhtac'],
              ['Kinh Trung', 'https://www.facebook.com/k.nihtrung'],
              ['Đức Diểu Quỳnh', 'https://www.facebook.com/profile.php?id=61590717492629'],
              ['Facebook Page', 'https://www.facebook.com/profile.php?id=61591857702519'],
            ].map(([name, url]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3 transition-all hover:border-amber-400/30 hover:bg-amber-400/5">
                <span className="text-sm font-semibold text-gray-300 transition-colors group-hover:text-amber-200">{name}</span>
                <ExternalLink className="h-4 w-4 text-gray-600 transition-colors group-hover:text-amber-300" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
