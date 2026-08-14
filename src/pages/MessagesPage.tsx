import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Message, Profile } from '@/lib/supabase';
import { Scroll, Send, Clock, User, Inbox } from 'lucide-react';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data as Message[]);
    setLoading(false);
  }, [user]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('is_approved', true);
    if (!error && data) setContacts(data as Profile[]);
  }, [user]);

  useEffect(() => {
    fetchMessages();
    fetchContacts();
  }, [fetchMessages, fetchContacts]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContact || !content.trim()) return;
    const { error } = await supabase.from('messages').insert([
      { sender_id: user.id, receiver_id: selectedContact.id, content: content.trim() },
    ]);
    if (error) {
      alert(`Lỗi: ${error.message}`);
      return;
    }
    setContent('');
    fetchMessages();
  };

  const conversationMessages = selectedContact
    ? messages.filter(
        m =>
          (m.sender_id === user?.id && m.receiver_id === selectedContact.id) ||
          (m.sender_id === selectedContact.id && m.receiver_id === user?.id)
      )
    : [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Thư Tín</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Hệ Thống Thư Tín Nội Bộ</h2>
        <p className="text-sm text-gray-500 mt-2">Giao tiếp trực tiếp giữa người chơi — thư tín thuần văn bản</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
        {/* Contact List */}
        <div className="md:col-span-1 p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-y-auto">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Danh bạ</h3>
          {contacts.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">Chưa có người chơi nào được phê duyệt.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    selectedContact?.id === contact.id
                      ? 'bg-[#670201]/20 border border-[#670201]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#670201]/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{contact.oc_name}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.anonymous_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="md:col-span-2 flex flex-col rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-hidden">
          {!selectedContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Chọn người để bắt đầu trao đổi thư tín.</p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#670201]/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-300/70" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-100/90">{selectedContact.oc_name}</p>
                  <p className="text-xs text-gray-500">{selectedContact.anonymous_name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversationMessages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">Chưa có thư tín nào. Hãy gửi thư đầu tiên!</p>
                ) : (
                  conversationMessages.map(msg => {
                    const isSent = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-lg ${
                          isSent
                            ? 'bg-[#670201]/30 border border-[#670201]/30 rounded-br-sm'
                            : 'bg-black/40 border border-white/10 rounded-bl-sm'
                        }`}>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-3 h-3 text-gray-600" />
                            <span className="text-[10px] text-gray-600">{formatDate(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Form */}
              <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  placeholder="Nội dung thư..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
