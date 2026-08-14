import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile, ShopItem, SitePage, Transaction, CURRENCY_LABELS, ADMIN_EMAILS, ADMIN_PASSWORD_DEFAULT } from '@/lib/supabase';
import {
  Shield, Users, Coins, Store, BookOpen, Ghost, Check, X, Plus, Trash2,
  AlertCircle, CheckCircle2, History, Edit3, Eye, EyeOff, Dices
} from 'lucide-react';

type Tab = 'accounts' | 'currency' | 'identities' | 'shop' | 'pages' | 'wheel';

export default function AdminDashboard() {
  const { profile, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

  // Data states
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [approvedProfiles, setApprovedProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Currency management
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currencyType, setCurrencyType] = useState('HUA_TIEN');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  // Shop management
  const [newItem, setNewItem] = useState({
    name: '', category: '', price: 0, currency_type: 'CONG_DUC',
    price_secondary: 0, currency_type_secondary: '',
    shop_area: 'Thường', purchase_limit: '', description: '', stock: 99,
  });

  // Page management
  const [newPage, setNewPage] = useState({ page_number: 1, title: '', category: '', content: '' });

  // Identity reveal
  const [revealIds, setRevealIds] = useState<Set<string>>(new Set());

  // Wheel spins management
  const [spinUserId, setSpinUserId] = useState('');
  const [spinAmount, setSpinAmount] = useState(1);
  const [spinMsg, setSpinMsg] = useState('');

  const handleGrantSpins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spinUserId || spinAmount < 1) return;
    setSpinMsg('');
    const { error } = await supabase.rpc('admin_grant_spins', {
      p_user_id: spinUserId,
      p_amount: spinAmount,
    });
    if (error) {
      setSpinMsg(`Lỗi: ${error.message}`);
      return;
    }
    setSpinMsg(`Đã cấp ${spinAmount} lượt quay thành công.`);
    setSpinUserId('');
    setSpinAmount(1);
    fetchAllData();
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ADMIN_EMAILS.includes(email) && password === ADMIN_PASSWORD_DEFAULT) {
      setIsAdminLoggedIn(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Tài khoản hoặc mật khẩu quản trị không chính xác!');
    }
  };

  const fetchAllData = useCallback(async () => {
    const [pending, approved, all, items, pages, txs] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('shop_items').select('*').order('price', { ascending: true }),
      supabase.from('site_pages').select('*').order('page_number', { ascending: true }),
      supabase.from('transactions').select('*, profiles(oc_name, email)').order('created_at', { ascending: false }).limit(50),
    ]);
    if (pending.data) setPendingProfiles(pending.data as Profile[]);
    if (approved.data) setApprovedProfiles(approved.data as Profile[]);
    if (all.data) setAllProfiles(all.data as Profile[]);
    if (items.data) setShopItems(items.data as ShopItem[]);
    if (pages.data) setSitePages(pages.data as SitePage[]);
    if (txs.data) setTransactions(txs.data as Transaction[]);
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) fetchAllData();
  }, [isAdminLoggedIn, fetchAllData]);

  const approveUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
    if (!error) fetchAllData();
  };

  const rejectUser = async (userId: string) => {
    if (!confirm('Từ chối và xóa tài khoản này?')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    fetchAllData();
  };

  const handleCurrencyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !reason || amount === 0) return;
    const targetProfile = allProfiles.find(p => p.id === selectedUserId);
    if (!targetProfile) return;

    const column = currencyType === 'HUA_TIEN' ? 'hua_tien' : currencyType === 'CONG_DUC' ? 'cong_duc' : 'am_duc';
    const newValue = (targetProfile as any)[column] + amount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [column]: newValue })
      .eq('id', selectedUserId);

    if (updateError) {
      alert(`Lỗi: ${updateError.message}`);
      return;
    }

    await supabase.from('transactions').insert([
      { user_id: selectedUserId, amount, currency_type: currencyType, reason },
    ]);

    setAmount(0);
    setReason('');
    setSelectedUserId('');
    fetchAllData();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: newItem.name,
      category: newItem.category,
      price: newItem.price,
      currency_type: newItem.currency_type,
      shop_area: newItem.shop_area,
      description: newItem.description,
      stock: newItem.stock,
    };
    if (newItem.price_secondary > 0 && newItem.currency_type_secondary) {
      payload.price_secondary = newItem.price_secondary;
      payload.currency_type_secondary = newItem.currency_type_secondary;
    }
    if (newItem.purchase_limit) payload.purchase_limit = newItem.purchase_limit;
    const { error } = await supabase.from('shop_items').insert([payload]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    setNewItem({
      name: '', category: '', price: 0, currency_type: 'CONG_DUC',
      price_secondary: 0, currency_type_secondary: '',
      shop_area: 'Thường', purchase_limit: '', description: '', stock: 99,
    });
    fetchAllData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Xóa vật phẩm này?')) return;
    await supabase.from('shop_items').delete().eq('id', itemId);
    fetchAllData();
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('site_pages').insert([newPage]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    setNewPage({ page_number: 1, title: '', category: '', content: '' });
    fetchAllData();
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Xóa trang này?')) return;
    await supabase.from('site_pages').delete().eq('id', pageId);
    fetchAllData();
  };

  const toggleReveal = (id: string) => {
    setRevealIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto pt-16">
        <div className="p-8 rounded-2xl bg-black/40 border border-[#670201]/30 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#670201] to-[#a00404] items-center justify-center mb-4 shadow-lg shadow-[#670201]/30">
              <Shield className="w-8 h-8 text-amber-100" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-amber-100">Ban Điều Hành Tối Thượng</h2>
            <p className="text-sm text-gray-500 mt-2">Truy cập bảng điều khiển quản trị</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email Quản trị viên"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
            />
            <input
              type="password"
              placeholder="Mật khẩu Quản trị"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
            />
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-lg shadow-lg shadow-[#670201]/30 hover:shadow-[#670201]/50 transition-all">
              Truy Cập Bảng Điều Hành
            </button>
          </form>
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{errorMsg}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'accounts', label: 'Phê Duyệt', icon: Users },
    { id: 'currency', label: 'Tài Sản', icon: Coins },
    { id: 'identities', label: 'Danh Tính', icon: Ghost },
    { id: 'shop', label: 'Thương Thành', icon: Store },
    { id: 'pages', label: 'Bách Khoa', icon: BookOpen },
    { id: 'wheel', label: 'Vòng Quay', icon: Dices },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#670201] to-[#a00404] flex items-center justify-center shadow-lg shadow-[#670201]/30">
          <Shield className="w-6 h-6 text-amber-100" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-amber-100/90">Bảng Điều Khiển Quản Trị</h2>
          <p className="text-sm text-gray-500">Ban Điều Hành Tối Thượng Trùng Hoan Tái</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 flex-wrap border-b border-white/10 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#670201]/30 text-amber-100'
                  : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'accounts' && pendingProfiles.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">{pendingProfiles.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Chờ Phê Duyệt</h3>
            {pendingProfiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không có tài khoản nào chờ phê duyệt.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProfiles.map(p => (
                  <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-amber-100/90">{p.oc_name}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{p.gender} · {p.anonymous_name}</p>
                        {p.bio && <p className="text-xs text-gray-500 mt-2 italic">"{p.bio}"</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveUser(p.id)} className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => rejectUser(p.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Tài Khoản Đã Phê Duyệt ({approvedProfiles.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <p className="text-sm font-semibold text-amber-100/90">{p.oc_name}</p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-amber-300">🪙 {p.hua_tien}</span>
                    <span className="text-cyan-300">✨ {p.cong_duc}</span>
                    <span className="text-purple-300">🌑 {p.am_duc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Tab */}
      {activeTab === 'currency' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Điều Chỉnh Tài Sản</h3>
            <form onSubmit={handleCurrencyChange} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Người chơi</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Loại tiền tệ</label>
                  <select value={currencyType} onChange={e => setCurrencyType(e.target.value)} className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Số lượng (+/-)</label>
                  <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} required className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Lý do (bắt buộc)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} required placeholder="Lý do thay đổi..." className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                Áp Dụng Thay Đổi
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-lg font-serif font-bold text-amber-100/80">Lịch Sử Giao Dịch Hệ Thống</h3>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào.</p>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                    <div>
                      <p className="text-sm text-gray-300">{tx.reason}</p>
                      <p className="text-xs text-gray-500">
                        {tx.profiles?.oc_name || 'N/A'} · {new Date(tx.created_at).toLocaleString('vi-VN')}
                      </p>
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
      )}

      {/* Identities Tab */}
      {activeTab === 'identities' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Ghost className="w-4 h-4 inline mr-1" />
              Quản trị viên có thể xem danh tính thật của các tài khoản ẩn danh. Nhấn vào biểu tượng mắt để hiện/ẩn.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allProfiles.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-100/90">{p.oc_name}</p>
                    <p className="text-xs text-gray-500">Ẩn danh: {p.anonymous_name}</p>
                  </div>
                  <button onClick={() => toggleReveal(p.id)} className="p-2 text-gray-500 hover:text-amber-300 rounded-lg hover:bg-white/5 transition-all">
                    {revealIds.has(p.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {revealIds.has(p.id) && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-400">Email thật: <span className="text-amber-200">{p.email}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Giới tính: {p.gender}</p>
                    <p className="text-xs text-gray-400 mt-1">Đã đổi danh tính: {p.anonymous_name_changes}/3 lần</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Thêm Vật Phẩm Mới</h3>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Tên vật phẩm" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <input type="text" placeholder="Danh mục" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} required className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <select value={newItem.shop_area} onChange={e => setNewItem({ ...newItem, shop_area: e.target.value })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="Thường">Thương Thành Thường</option>
                <option value="Hiếm">Thương Thành Hiếm</option>
                <option value="Sự kiện">Thương Thành Sự Kiện</option>
              </select>
              <input type="text" placeholder="Giới hạn mua (vd: 2 lá/tuần)" value={newItem.purchase_limit} onChange={e => setNewItem({ ...newItem, purchase_limit: e.target.value })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <input type="number" placeholder="Giá chính" value={newItem.price || ''} onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })} required className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <select value={newItem.currency_type} onChange={e => setNewItem({ ...newItem, currency_type: e.target.value })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="HUA_TIEN">Hoa Tiền</option>
                <option value="CONG_DUC">Công Đức</option>
                <option value="AM_DUC">Âm Đức</option>
              </select>
              <input type="number" placeholder="Giá phụ (0 = không có)" value={newItem.price_secondary || ''} onChange={e => setNewItem({ ...newItem, price_secondary: parseInt(e.target.value) || 0 })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <select value={newItem.currency_type_secondary} onChange={e => setNewItem({ ...newItem, currency_type_secondary: e.target.value })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="">Không giá phụ</option>
                <option value="HUA_TIEN">Hoa Tiền</option>
                <option value="CONG_DUC">Công Đức</option>
                <option value="AM_DUC">Âm Đức</option>
              </select>
              <input type="number" placeholder="Tồn kho" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <input type="text" placeholder="Mô tả" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <button type="submit" className="md:col-span-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Vật Phẩm
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Vật Phẩm ({shopItems.length})</h3>
            <div className="space-y-2">
              {shopItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{item.name} <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 ml-1">{item.shop_area}</span></p>
                    <p className="text-xs text-gray-500 truncate">{item.category} · {item.price} {CURRENCY_LABELS[item.currency_type]}{item.price_secondary && item.currency_type_secondary ? ` / ${item.price_secondary} ${CURRENCY_LABELS[item.currency_type_secondary]}` : ''} · Kho: {item.stock}</p>
                    {item.purchase_limit && <p className="text-[10px] text-gray-600">Giới hạn: {item.purchase_limit}</p>}
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wheel Tab */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Cấp Lượt Quay May Mắn</h3>
            <form onSubmit={handleGrantSpins} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Người chơi</label>
                <select value={spinUserId} onChange={e => setSpinUserId(e.target.value)} required className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} ({p.email}) — Đang có {(p as any).wheel_spins ?? 0} lượt</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Số lượt cấp (1-1000)</label>
                <input type="number" min={1} max={1000} value={spinAmount} onChange={e => setSpinAmount(parseInt(e.target.value) || 1)} required className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all" />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Dices className="w-4 h-4" /> Cấp Lượt Quay
              </button>
              {spinMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${spinMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                  {spinMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {spinMsg}
                </div>
              )}
            </form>
          </div>

          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Lượt Quay Của Người Chơi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <p className="text-sm font-semibold text-amber-100/90">{p.oc_name}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Dices className="h-3.5 w-3.5 text-amber-300/70" />
                    <span className="text-gray-400">Lượt quay:</span>
                    <span className="font-bold text-amber-200">{(p as any).wheel_spins ?? 0}</span>
                  </div>
                  {(p as any).wheel_special_claimed && (
                    <p className="mt-1 text-[10px] text-rose-300/70">Đã nhận Quà Đặc Biệt</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Thêm Trang Bách Khoa</h3>
            <form onSubmit={handleAddPage} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Số trang" value={newPage.page_number || ''} onChange={e => setNewPage({ ...newPage, page_number: parseInt(e.target.value) || 1 })} required className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
                <input type="text" placeholder="Thể loại" value={newPage.category} onChange={e => setNewPage({ ...newPage, category: e.target.value })} required className="col-span-2 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              </div>
              <input type="text" placeholder="Tiêu đề" value={newPage.title} onChange={e => setNewPage({ ...newPage, title: e.target.value })} required className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              <textarea placeholder="Nội dung..." value={newPage.content} onChange={e => setNewPage({ ...newPage, content: e.target.value })} required rows={5} className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none" />
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Trang
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Trang ({sitePages.length})</h3>
            <div className="space-y-2">
              {sitePages.map(page => (
                <div key={page.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">Trang {page.page_number}: {page.title}</p>
                    <p className="text-xs text-gray-500">{page.category}</p>
                  </div>
                  <button onClick={() => handleDeletePage(page.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
