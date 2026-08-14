import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Transaction, InventoryItem, CURRENCY_LABELS } from '@/lib/supabase';
import {
  UserCircle, Coins, Sparkles, Skull, Package, History, Edit3,
  CheckCircle2, Clock, AlertCircle, Ghost
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [ocName, setOcName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [anonName, setAnonName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [txRes, invRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('inventories').select('*, shop_items(*)').eq('user_id', user.id).order('acquired_at', { ascending: false }),
    ]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (invRes.data) setInventory(invRes.data as InventoryItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (profile) {
      setOcName(profile.oc_name);
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setAnonName(profile.anonymous_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    const updates: any = { oc_name: ocName, bio, avatar_url: avatarUrl || null };
    if (anonName !== profile.anonymous_name && profile.anonymous_name_changes < 3) {
      updates.anonymous_name = anonName;
      updates.anonymous_name_changes = profile.anonymous_name_changes + 1;
    } else if (anonName !== profile.anonymous_name) {
      setMessage('Bạn đã hết lượt đổi danh tính ẩn danh (tối đa 3 lần)!');
      return;
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) {
      setMessage(`Lỗi: ${error.message}`);
    } else {
      setMessage('Cập nhật hồ sơ thành công!');
      setEditing(false);
      refreshProfile();
    }
    setTimeout(() => setMessage(''), 4000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Không tìm thấy hồ sơ. Vui lòng đăng nhập lại.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="p-8 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={editing ? avatarUrl : (profile.avatar_url || '')}
                alt={profile.oc_name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-[#670201]/30 shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#670201] to-[#a00404] flex items-center justify-center shadow-lg shadow-[#670201]/30">
                <UserCircle className="w-14 h-14 text-amber-100/80" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-amber-100/90">
                  {editing ? ocName : profile.oc_name}
                </h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {profile.is_approved ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã phê duyệt
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <Clock className="w-3.5 h-3.5" /> Chờ phê duyệt
                  </span>
                )}
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-amber-100 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={ocName}
                  onChange={e => setOcName(e.target.value)}
                  placeholder="Danh tính OC"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="Link ảnh đại diện"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <input
                  type="text"
                  value={anonName}
                  onChange={e => setAnonName(e.target.value)}
                  placeholder="Danh tính ẩn danh"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <p className="text-xs text-gray-500">
                  Đổi danh tính ẩn danh còn: {3 - profile.anonymous_name_changes} lần
                </p>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Trích dẫn..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="px-4 py-2 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold rounded-lg transition-all">
                    Lưu
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-lg transition-all">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Ghost className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Ẩn danh:</span>
                  <span className="text-amber-200/80">{profile.anonymous_name || 'Vô Danh'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Giới tính:</span>
                  <span className="text-gray-300">{profile.gender}</span>
                </div>
                {profile.bio && (
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-sm text-gray-400 italic">"{profile.bio}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-300">{message}</p>
          </div>
        )}
      </div>

      {/* Currencies */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
            <Coins className="w-3.5 h-3.5" /> Hoa Tiền
          </div>
          <p className="text-2xl font-bold text-amber-200">{profile.hua_tien}</p>
        </div>
        <div className="p-5 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Công Đức
          </div>
          <p className="text-2xl font-bold text-cyan-200">{profile.cong_duc}</p>
        </div>
        <div className="p-5 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
            <Skull className="w-3.5 h-3.5" /> Âm Đức
          </div>
          <p className="text-2xl font-bold text-purple-300">{profile.am_duc}</p>
        </div>
      </div>

      {/* Inventory */}
      <div className="p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-amber-300/70" />
          <h3 className="text-lg font-serif font-bold text-amber-100/90">Kho Vật Phẩm</h3>
        </div>
        {inventory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có vật phẩm nào. Hãy ghé thăm thương thành!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventory.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-[#670201]/15 flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-300/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{item.shop_items?.name}</p>
                  <p className="text-xs text-gray-500">{item.shop_items?.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-amber-300/70" />
          <h3 className="text-lg font-serif font-bold text-amber-100/90">Lịch Sử Giao Dịch</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                <div>
                  <p className="text-sm text-gray-300">{tx.reason}</p>
                  <p className="text-xs text-gray-600">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                  <p className="text-xs text-gray-500">{CURRENCY_LABELS[tx.currency_type]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
