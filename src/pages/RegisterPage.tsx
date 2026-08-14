import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ocName, setOcName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const wordCount = bio.trim() ? bio.trim().split(/\s+/).length : 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (wordCount > 100) {
      setError('Trích dẫn vượt quá giới hạn 100 từ!');
      return;
    }

    setLoading(true);
    const { error: signUpError, data } = await signUp(email, password);

    if (signUpError) {
      setError(`Lỗi: ${signUpError}`);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const anonymousName = `Vô Danh #${Math.floor(Math.random() * 9000) + 1000}`;
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email,
          oc_name: ocName,
          gender,
          bio,
          avatar_url: avatarUrl || null,
          hua_tien: 300,
          cong_duc: 30,
          am_duc: 0,
          is_approved: false,
          anonymous_name: anonymousName,
        },
      ]);

      if (profileError) {
        setError(`Lỗi tạo hồ sơ: ${profileError.message}`);
      } else {
        setMessage('Đăng ký thành công! Vui lòng chờ Quản trị viên phê duyệt tài khoản.');
        setTimeout(() => navigate('/login'), 3000);
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto pt-8">
      <div className="relative p-8 rounded-2xl bg-black/40 border border-[#670201]/30 backdrop-blur-xl shadow-2xl shadow-[#670201]/10">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#670201]/50 to-transparent" />

        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#670201] to-[#a00404] items-center justify-center mb-4 shadow-lg shadow-[#670201]/30">
            <UserPlus className="w-8 h-8 text-amber-100" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-amber-100">Đăng Ký Nhập Vụ</h2>
          <p className="text-sm text-gray-500 mt-2">Trùng Hoan Tái — Nơi linh hồn bị giam cầm</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 focus:ring-1 focus:ring-[#670201]/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 focus:ring-1 focus:ring-[#670201]/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Danh tính OC</label>
            <input
              type="text"
              placeholder="Tên nhân vật của bạn..."
              value={ocName}
              onChange={e => setOcName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 focus:ring-1 focus:ring-[#670201]/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Giới tính</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-gray-400 uppercase tracking-wider">Trích dẫn</label>
              <span className={`text-xs ${wordCount > 100 ? 'text-red-400' : 'text-gray-500'}`}>
                {wordCount}/100 từ
              </span>
            </div>
            <textarea
              placeholder="Câu nói tiêu biểu của nhân vật (tối đa 100 từ)..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 focus:ring-1 focus:ring-[#670201]/30 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Link ảnh đại diện</label>
            <input
              type="text"
              placeholder="https://..."
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 focus:ring-1 focus:ring-[#670201]/30 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-lg shadow-lg shadow-[#670201]/30 hover:shadow-[#670201]/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? 'Đang gửi hồ sơ...' : 'Gửi Hồ Sơ Phê Duyệt'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300">{message}</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-amber-300 hover:text-amber-200 transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
