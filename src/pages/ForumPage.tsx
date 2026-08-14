import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Post } from '@/lib/supabase';
import { MessageSquare, Send, Trash2, Ghost, Clock } from 'lucide-react';

const CATEGORIES = ['Thảo luận', 'Roleplay', 'Hỏi đáp', 'Dị sự', 'Tâm sự'];

export default function ForumPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Thảo luận');
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(anonymous_name, oc_name)')
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!profile.is_approved) {
      alert('Tài khoản của bạn chưa được phê duyệt!');
      return;
    }
    const { error } = await supabase.from('posts').insert([
      { author_id: user.id, title: newTitle, content: newContent, category: newCategory },
    ]);
    if (error) {
      alert(`Lỗi: ${error.message}`);
      return;
    }
    setNewTitle('');
    setNewContent('');
    setNewCategory('Thảo luận');
    fetchPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) fetchPosts();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredPosts = filterCategory === 'all' ? posts : posts.filter(p => p.category === filterCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Diễn Đàn Ẩn Danh</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Diễn Đàn Trùng Hoan</h2>
        <p className="text-sm text-gray-500 mt-2">Thảo luận với danh tính ẩn danh — mọi bài đăng đều để lại dấu tích</p>
      </div>

      {/* New Post Form */}
      {profile?.is_approved && (
        <form onSubmit={handleCreatePost} className="p-5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm space-y-3">
          <h3 className="text-sm font-bold text-amber-100/80 mb-2">Đăng bài mới</h3>
          <input
            type="text"
            placeholder="Tiêu đề bài viết..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
          />
          <div className="flex gap-3">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Nội dung thảo luận roleplay..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all hover:scale-105"
          >
            <Send className="w-4 h-4" />
            Đăng Bài
          </button>
        </form>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterCategory === 'all' ? 'bg-[#670201]/30 text-amber-100' : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
          }`}
        >
          Tất cả
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCategory === cat ? 'bg-[#670201]/30 text-amber-100' : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <div
            key={post.id}
            className="group p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm hover:border-[#670201]/20 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-[#670201]/20 text-amber-300/80">{post.category}</span>
              </div>
              {post.author_id === user?.id && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <h4 className="text-lg font-bold text-amber-100/90 mb-2">{post.title}</h4>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Ghost className="w-3.5 h-3.5" />
                <span>{post.profiles?.anonymous_name || 'Vô Danh'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có bài viết nào trong mục này.</p>
        </div>
      )}
    </div>
  );
}
