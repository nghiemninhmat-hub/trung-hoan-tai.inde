import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, ShopItem, CartItem, CURRENCY_LABELS, SHOP_AREA_LABELS } from '@/lib/supabase';
import {
  Store, ShoppingCart, Trash2, CheckCircle2, AlertCircle, Package, Coins,
  Sparkles, Skull, Search, X, Crown, Star, Flame
} from 'lucide-react';

export default function ShopPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterArea, setFilterArea] = useState<string>('all');

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase.from('shop_items').select('*').order('price', { ascending: true });
    if (!error && data) setItems(data as ShopItem[]);
    setLoading(false);
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('carts')
      .select('*, shop_items(*)')
      .eq('user_id', user.id);
    if (!error && data) setCart(data as CartItem[]);
  }, [user]);

  useEffect(() => {
    fetchItems();
    fetchCart();
  }, [fetchItems, fetchCart]);

  const addToCart = async (item: ShopItem) => {
    if (!user) return;
    if (cart.length >= 10) {
      showNotification('Giỏ hàng đã đạt giới hạn tối đa 10 món!', 'error');
      return;
    }
    const { error } = await supabase.from('carts').insert([{ user_id: user.id, item_id: item.id }]);
    if (error) {
      showNotification(`Lỗi: ${error.message}`, 'error');
    } else {
      showNotification(`Đã thêm "${item.name}" vào giỏ hàng.`);
      fetchCart();
    }
  };

  const removeFromCart = async (cartId: string) => {
    const { error } = await supabase.from('carts').delete().eq('id', cartId);
    if (!error) fetchCart();
  };

  const handleCheckout = async () => {
    if (!user || !profile) return;
    setProcessing(true);

    let totalHuaTien = 0;
    let totalCongDuc = 0;
    let totalAmDuc = 0;

    cart.forEach(c => {
      if (c.shop_items) {
        if (c.shop_items.currency_type === 'HUA_TIEN') totalHuaTien += c.shop_items.price;
        if (c.shop_items.currency_type === 'CONG_DUC') totalCongDuc += c.shop_items.price;
        if (c.shop_items.currency_type === 'AM_DUC') totalAmDuc += c.shop_items.price;
        if (c.shop_items.currency_type_secondary === 'HUA_TIEN') totalHuaTien += c.shop_items.price_secondary || 0;
        if (c.shop_items.currency_type_secondary === 'CONG_DUC') totalCongDuc += c.shop_items.price_secondary || 0;
        if (c.shop_items.currency_type_secondary === 'AM_DUC') totalAmDuc += c.shop_items.price_secondary || 0;
      }
    });

    if (totalHuaTien > profile.hua_tien || totalCongDuc > profile.cong_duc || totalAmDuc > profile.am_duc) {
      showNotification('Không đủ tài sản để thanh toán!', 'error');
      setProcessing(false);
      return;
    }

    const newHuaTien = profile.hua_tien - totalHuaTien;
    const newCongDuc = profile.cong_duc - totalCongDuc;
    const newAmDuc = profile.am_duc - totalAmDuc;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ hua_tien: newHuaTien, cong_duc: newCongDuc, am_duc: newAmDuc })
      .eq('id', user.id);

    if (updateError) {
      showNotification(`Lỗi thanh toán: ${updateError.message}`, 'error');
      setProcessing(false);
      return;
    }

    const inventoryInserts = cart.map(c => ({ user_id: user.id, item_id: c.item_id }));
    await supabase.from('inventories').insert(inventoryInserts);

    const transactionInserts = [];
    if (totalHuaTien > 0) transactionInserts.push({ user_id: user.id, amount: -totalHuaTien, currency_type: 'HUA_TIEN', reason: 'Mua sắm thương thành' });
    if (totalCongDuc > 0) transactionInserts.push({ user_id: user.id, amount: -totalCongDuc, currency_type: 'CONG_DUC', reason: 'Mua sắm thương thành' });
    if (totalAmDuc > 0) transactionInserts.push({ user_id: user.id, amount: -totalAmDuc, currency_type: 'AM_DUC', reason: 'Mua sắm thương thành' });
    if (transactionInserts.length > 0) await supabase.from('transactions').insert(transactionInserts);

    await supabase.from('carts').delete().eq('user_id', user.id);

    setCheckoutOpen(false);
    setProcessing(false);
    showNotification('Thanh toán thành công! Vật phẩm đã vào kho.');
    fetchCart();
    refreshProfile();
  };

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];
  const areas = ['all', 'Thường', 'Hiếm', 'Sự kiện'];
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesArea = filterArea === 'all' || item.shop_area === filterArea;
    return matchesSearch && matchesCategory && matchesArea;
  });

  const cartTotals = cart.reduce(
    (acc, c) => {
      if (c.shop_items) {
        if (c.shop_items.currency_type === 'HUA_TIEN') acc.huaTien += c.shop_items.price;
        if (c.shop_items.currency_type === 'CONG_DUC') acc.congDuc += c.shop_items.price;
        if (c.shop_items.currency_type === 'AM_DUC') acc.amDuc += c.shop_items.price;
        if (c.shop_items.currency_type_secondary === 'HUA_TIEN') acc.huaTien += c.shop_items.price_secondary || 0;
        if (c.shop_items.currency_type_secondary === 'CONG_DUC') acc.congDuc += c.shop_items.price_secondary || 0;
        if (c.shop_items.currency_type_secondary === 'AM_DUC') acc.amDuc += c.shop_items.price_secondary || 0;
      }
      return acc;
    },
    { huaTien: 0, congDuc: 0, amDuc: 0 }
  );

  const getCurrencyIcon = (type: string, size = 'w-3.5 h-3.5') => {
    if (type === 'HUA_TIEN') return <Coins className={`${size} text-amber-400 inline`} />;
    if (type === 'CONG_DUC') return <Sparkles className={`${size} text-cyan-400 inline`} />;
    if (type === 'AM_DUC') return <Skull className={`${size} text-purple-400 inline`} />;
    return null;
  };

  const getAreaIcon = (area: string) => {
    if (area === 'Hiếm') return <Crown className="w-4 h-4 text-amber-400" />;
    if (area === 'Sự kiện') return <Flame className="w-4 h-4 text-red-400" />;
    return <Package className="w-4 h-4 text-gray-400" />;
  };

  const getAreaBadgeColor = (area: string) => {
    if (area === 'Hiếm') return 'bg-amber-500/15 text-amber-300/90 border-amber-500/30';
    if (area === 'Sự kiện') return 'bg-red-500/15 text-red-300/90 border-red-500/30';
    return 'bg-white/5 text-gray-400 border-white/10';
  };

  const renderPrice = (item: ShopItem) => {
    const parts = [
      <span key="primary" className="flex items-center gap-1">
        {getCurrencyIcon(item.currency_type)}
        <span className="text-sm font-bold text-amber-200">{item.price}</span>
        <span className="text-xs text-gray-500">{CURRENCY_LABELS[item.currency_type]}</span>
      </span>,
    ];
    if (item.price_secondary && item.currency_type_secondary) {
      parts.push(
        <span key="secondary" className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">/</span>
          {getCurrencyIcon(item.currency_type_secondary)}
          <span className="text-sm font-bold text-amber-200">{item.price_secondary}</span>
          <span className="text-xs text-gray-500">{CURRENCY_LABELS[item.currency_type_secondary]}</span>
        </span>
      );
    }
    return <div className="flex items-center gap-1.5 flex-wrap">{parts}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Thương Thành</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Thương Thành Hệ Thống</h2>
        <p className="text-sm text-gray-500 mt-2">Giao dịch vật phẩm, pháp khí, linh dược — mọi giao dịch đều được ghi vết</p>
      </div>

      {notification && (
        <div className={`p-3 rounded-lg border flex items-center gap-2 ${
          notificationType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
        }`}>
          {notificationType === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span className={`text-sm ${notificationType === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{notification}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm vật phẩm..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
          />
        </div>
        <select
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
        >
          {areas.map(area => (
            <option key={area} value={area}>{area === 'all' ? 'Tất cả khu vực' : SHOP_AREA_LABELS[area] || area}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'Tất cả danh mục' : cat}</option>
          ))}
        </select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="group relative p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm hover:border-[#670201]/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#670201]/15 flex items-center justify-center">
                {getAreaIcon(item.shop_area)}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-1 rounded border ${getAreaBadgeColor(item.shop_area)}`}>
                  {item.shop_area}
                </span>
                <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-white/5">{item.category}</span>
              </div>
            </div>
            <h4 className="font-bold text-base text-amber-100/90 mb-1">{item.name}</h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3 min-h-[2.5rem]">{item.description}</p>
            {item.purchase_limit && (
              <p className="text-[10px] text-gray-600 mb-3 flex items-center gap-1">
                <Star className="w-3 h-3" /> Giới hạn: {item.purchase_limit}
              </p>
            )}
            <div className="flex items-center justify-between">
              {renderPrice(item)}
              <button
                onClick={() => addToCart(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#670201]/80 hover:bg-[#670201] text-amber-100 text-xs font-semibold rounded-lg transition-all hover:scale-105"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Thêm
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy vật phẩm nào.</p>
        </div>
      )}

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setCheckoutOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-full shadow-2xl shadow-[#670201]/40 hover:scale-105 transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{cart.length}/10</span>
        </button>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)}>
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#1a0a0a] border border-[#670201]/30 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-amber-100">Giỏ Hàng ({cart.length}/10)</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {cart.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{c.shop_items?.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getCurrencyIcon(c.shop_items?.currency_type || '')}
                      <span className="text-xs text-amber-200">{c.shop_items?.price}</span>
                      {c.shop_items?.price_secondary && c.shop_items?.currency_type_secondary && (
                        <>
                          <span className="text-gray-600 text-xs">/</span>
                          {getCurrencyIcon(c.shop_items.currency_type_secondary)}
                          <span className="text-xs text-amber-200">{c.shop_items.price_secondary}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(c.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              {cartTotals.huaTien > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5"><Coins className="w-4 h-4 text-amber-400" /> Hoa Tiền</span>
                  <span className="text-amber-200 font-bold">{cartTotals.huaTien}</span>
                </div>
              )}
              {cartTotals.congDuc > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-cyan-400" /> Công Đức</span>
                  <span className="text-cyan-200 font-bold">{cartTotals.congDuc}</span>
                </div>
              )}
              {cartTotals.amDuc > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1.5"><Skull className="w-4 h-4 text-purple-400" /> Âm Đức</span>
                  <span className="text-purple-300 font-bold">{cartTotals.amDuc}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0}
              className="w-full mt-6 py-3 bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 font-bold rounded-lg hover:shadow-lg hover:shadow-[#670201]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? 'Đang xử lý...' : 'Thanh Toán'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
