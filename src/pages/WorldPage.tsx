import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, SitePage } from '@/lib/supabase';
import {
  BookOpen, FileText, ChevronRight, Search, Scroll, Ghost, Globe2,
  Users, Shield, Flame, Bookmark
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  'Thế Giới Quan': Globe2,
  'Nhân Vật': Users,
  'Dị Sự': Ghost,
  'Cộng Đồng': Shield,
};

// Unified palette — only red/amber tones, no clashing hues
const CATEGORY_TEXT: Record<string, string> = {
  'Thế Giới Quan': 'text-amber-300/70',
  'Nhân Vật': 'text-amber-300/70',
  'Dị Sự': 'text-amber-300/70',
  'Cộng Đồng': 'text-amber-300/70',
};

// Check if a line is an ALL-CAPS header (including Roman numeral prefixes)
function isAllCapsHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  if (trimmed.startsWith('—')) return false;
  // Strip leading Roman numeral patterns: "I. ", "II. ", "III. ", "IV. " etc.
  const cleaned = trimmed.replace(/^(I{1,3}|IV|V|VI{0,3}|IX|X{0,3})[.]\s+/, '');
  if (cleaned.length < 3) return false;
  const upperCount = (cleaned.match(/[A-ZÀ-Ý]/g) || []).length;
  const lowerCount = (cleaned.match(/[a-zà-ÿ]/g) || []).length;
  return upperCount >= 2 && lowerCount === 0;
}

// Check if a line is a numbered item header (e.g., "1. TREO CỔ QUỶ")
function isNumberedHeader(line: string): boolean {
  return /^\d+\.\s+[A-ZÀ-Ý]/.test(line.trim());
}

// Check if a line is a key-value pair (e.g., "Nguồn gốc: ...")
// Must have a short key (2-40 chars), no sentence-ending punctuation in the key,
// and the key must not contain common sentence words
function isKeyValue(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('-') || trimmed.startsWith('•')) return false;
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx < 3 || colonIdx > 45) return false;
  const key = trimmed.substring(0, colonIdx).trim();
  if (key.length < 2 || key.length > 40) return false;
  // Reject if key contains sentence-like patterns
  if (/^(Thứ nhất|Thứ hai|Thứ ba|Thứ tư|Thứ năm|Thứ sáu|Thứ bảy|Thứ tám|Thứ chín|Thứ mười)/.test(key)) return false;
  // Key should be mostly alphanumeric (allow spaces, slashes, parentheses, hyphens)
  return /^[A-ZÀ-Ýa-zà-ÿ0-9\s/.()-]+$/.test(key);
}

// Check if a line is a bullet point
function isBullet(line: string): boolean {
  return line.trim().startsWith('-') || line.trim().startsWith('•');
}

// Check if a line is a separator
function isSeparator(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || /^[—–-]{3,}$/.test(trimmed);
}

// Highlight key terms inline — use word boundaries to avoid false matches
function renderInlineEmphasis(text: string, keyIdx: number): React.ReactNode {
  // Long phrases — safe to match without boundaries
  const phrases: Array<[string, string]> = [
    ['Cổng Âm Tào', 'font-semibold text-amber-400/90'],
    ['Trùng Hoan Tái', 'font-semibold text-amber-400/90'],
    ['Bách Quỷ Âm', 'font-semibold text-amber-400/90'],
    ['Dị Sự Bảng', 'font-semibold text-amber-400/90'],
    ['Kim Bảng Đề Danh', 'font-semibold text-amber-400/90'],
    ['Kim Bảng', 'font-semibold text-amber-400/90'],
    ['Viên Mãn Hoàn Thành', 'font-bold text-red-400/90'],
    ['Không có hồi sinh', 'font-bold text-red-400/90'],
    ['Không có tài khoản mới', 'font-bold text-red-400/90'],
    ['Không có cơ hội thứ hai', 'font-bold text-red-400/90'],
  ];

  // Single-word terms — must use word boundaries
  const words: Array<[string, string]> = [
    ['Du Hồn', 'font-bold text-red-400/90'],
    ['Oán Hồn', 'font-bold text-red-400/90'],
    ['Lệ Quỷ', 'font-bold text-red-400/90'],
    ['Hung Sát', 'font-bold text-red-400/90'],
    ['Quỷ Tướng', 'font-bold text-red-400/90'],
    ['Quỷ Vương', 'font-bold text-red-400/90'],
    ['Hoa Tiền', 'font-semibold text-amber-300/90'],
    ['Công Đức', 'font-semibold text-amber-300/90'],
    ['Âm Đức', 'font-semibold text-amber-300/90'],
    ['Hệ Thống', 'font-semibold text-amber-300/80'],
    ['Cấm Địa', 'font-semibold text-amber-300/80'],
  ];

  let result: React.ReactNode[] = [text];
  let uniqueKey = keyIdx * 100000;

  const applyHighlight = (terms: Array<[string, string]>, useBoundary: boolean) => {
    const newResult: React.ReactNode[] = [];
    for (const node of result) {
      if (typeof node !== 'string') {
        newResult.push(node);
        continue;
      }
      let parts: (string | React.ReactNode)[] = [node];
      for (const [term, className] of terms) {
        const newParts: (string | React.ReactNode)[] = [];
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = useBoundary ? `\\b${escaped}\\b` : escaped;
        const regex = new RegExp(pattern, 'g');
        for (const part of parts) {
          if (typeof part !== 'string') {
            newParts.push(part);
            continue;
          }
          let lastIdx = 0;
          let match;
          while ((match = regex.exec(part)) !== null) {
            if (match.index > lastIdx) newParts.push(part.substring(lastIdx, match.index));
            newParts.push(
              <span key={uniqueKey++} className={className}>{match[0]}</span>
            );
            lastIdx = match.index + match[0].length;
          }
          if (lastIdx < part.length) newParts.push(part.substring(lastIdx));
        }
        parts = newParts;
      }
      newResult.push(...parts);
    }
    result = newResult;
  };

  applyHighlight(phrases, false);
  applyHighlight(words, true);

  return <>{result.map((n, i) => typeof n === 'string' ? <span key={i}>{n}</span> : n)}</>;
}

function ContentRenderer({ content }: { content: string }) {
  const lines = useMemo(() => content.split('\n'), [content]);

  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-1 my-2 ml-1">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (isSeparator(line)) {
      flushList();
      if (/^[—–-]{3,}$/.test(trimmed)) {
        elements.push(
          <div key={`sep-${idx}`} className="flex items-center justify-center my-4">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#670201]/30" />
            <div className="w-1 h-1 mx-2 rounded-full bg-[#670201]/40" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#670201]/30" />
          </div>
        );
      }
      return;
    }

    if (isAllCapsHeader(trimmed)) {
      flushList();
      // Strip leading Roman numeral for display, but show it as a badge
      const romanMatch = trimmed.match(/^(I{1,3}|IV|V|VI{0,3}|IX|X{0,3})[.]\s+(.*)/);
      if (romanMatch) {
        elements.push(
          <div key={`rh-${idx}`} className="mt-5 mb-2 first:mt-0">
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 text-xs font-bold text-[#a00404]/80 font-serif">{romanMatch[1]}.</span>
              <div className="w-0.5 h-4 rounded-full bg-[#670201]/60" />
              <h4 className="text-sm font-serif font-bold tracking-wide text-amber-200/90 uppercase">{romanMatch[2]}</h4>
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={`h-${idx}`} className="mt-5 mb-2 first:mt-0">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#670201] to-[#a00404]" />
              <h4 className="text-sm font-serif font-bold tracking-wide text-amber-200/90 uppercase">{trimmed}</h4>
            </div>
          </div>
        );
      }
      return;
    }

    if (isNumberedHeader(trimmed)) {
      flushList();
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <div key={`nh-${idx}`} className="mt-5 mb-2 first:mt-0">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#670201]/30 to-[#a00404]/20 border border-[#670201]/25 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-200/90">{match[1]}</span>
              </div>
              <h4 className="text-base font-serif font-bold text-amber-100/90 pt-0.5">{renderInlineEmphasis(match[2], idx)}</h4>
            </div>
          </div>
        );
      }
      return;
    }

    if (isBullet(trimmed)) {
      const content = trimmed.replace(/^[-•]\s*/, '');
      listBuffer.push(
        <li key={`b-${idx}`} className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-[#670201]/50 flex-shrink-0" />
          <span>{renderInlineEmphasis(content, idx)}</span>
        </li>
      );
      return;
    }

    if (isKeyValue(trimmed)) {
      flushList();
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();
      elements.push(
        <div key={`kv-${idx}`} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 my-1">
          <span className="text-sm font-semibold text-amber-300/60 sm:min-w-[130px] flex-shrink-0">{key}:</span>
          <span className="text-sm text-gray-400 leading-relaxed flex-1">{renderInlineEmphasis(value, idx)}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="text-sm text-gray-400 leading-relaxed my-1.5">
        {renderInlineEmphasis(trimmed, idx)}
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}

export default function WorldPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase.from('site_pages').select('*').order('page_number', { ascending: true });
    if (!error && data) {
      setPages(data as SitePage[]);
      if (data.length > 0 && !selectedPage) setSelectedPage(data[0] as SitePage);
    }
    setLoading(false);
  }, [selectedPage]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const categories = ['all', ...Array.from(new Set(pages.map(p => p.category)))];
  const filteredPages = pages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group pages by category for the sidebar
  const groupedPages = filteredPages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, SitePage[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Cổ Văn Giản</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Bách Khoa Toàn Thư</h2>
        <p className="text-sm text-gray-500 mt-2 italic">Thế giới, quy tắc, dị sự, bách quỷ — mọi bí ẩn của Trùng Hoan</p>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm trong bách khoa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'Tất cả thể loại' : cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Grouped by category */}
        <div className="lg:col-span-1 space-y-3">
          {Object.entries(groupedPages).map(([category, catPages]) => {
            const CatIcon = CATEGORY_ICONS[category] || FileText;
            const textClass = CATEGORY_TEXT[category] || 'text-amber-300/70';
            return (
              <div key={category}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#670201]/10 border border-[#670201]/20 mb-2">
                  <CatIcon className={`w-4 h-4 ${textClass}`} />
                  <span className={`text-xs font-serif font-bold tracking-wide uppercase ${textClass}`}>{category}</span>
                  <span className="ml-auto text-xs text-gray-600">{catPages.length}</span>
                </div>
                <div className="space-y-1">
                  {catPages.map(page => {
                    const isActive = selectedPage?.id === page.id;
                    return (
                      <button
                        key={page.id}
                        onClick={() => setSelectedPage(page)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left group ${
                          isActive
                            ? 'bg-[#670201]/15 border border-[#670201]/25'
                            : 'bg-black/20 border border-white/5 hover:border-[#670201]/15 hover:bg-black/30'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive ? 'bg-[#670201]/25' : 'bg-white/5 group-hover:bg-[#670201]/10'
                        }`}>
                          <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : 'text-gray-500 group-hover:text-amber-300/60'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate transition-colors ${
                            isActive ? 'text-amber-100' : 'text-gray-300 group-hover:text-amber-100/80'
                          }`}>{page.title}</p>
                          <p className="text-xs text-gray-600">Trang {page.page_number}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-all flex-shrink-0 ${
                          isActive ? 'rotate-90 text-amber-300/60' : 'text-gray-700 group-hover:text-gray-500'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Reader */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <article className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0d0606] to-[#0a0404] border border-[#670201]/20 backdrop-blur-sm overflow-hidden">
              {/* Decorative corner ornaments */}
              <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none opacity-15">
                <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t border-l border-[#670201]/50 rounded-tl-md" />
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-15">
                <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t border-r border-[#670201]/50 rounded-tr-md" />
              </div>
              <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none opacity-15">
                <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b border-l border-[#670201]/50 rounded-bl-md" />
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none opacity-15">
                <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b border-r border-[#670201]/50 rounded-br-md" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#670201]/15 border border-[#670201]/25 text-amber-300/70 font-medium">
                  {selectedPage.category}
                </span>
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <Bookmark className="w-3 h-3" /> Trang {selectedPage.page_number}
                </span>
              </div>

              {/* Title with decorative underline */}
              <div className="mb-5">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100/90 leading-tight">{selectedPage.title}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px w-14 bg-gradient-to-r from-[#670201] to-transparent" />
                  <Flame className="w-3 h-3 text-[#670201]/40" />
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                <ContentRenderer content={selectedPage.content} />
              </div>

              {/* Bottom ornament */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#670201]/25" />
                <div className="w-1 h-1 rounded-full bg-[#670201]/35" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#670201]/25" />
              </div>
            </article>
          ) : (
            <div className="p-12 rounded-2xl bg-black/20 border border-white/5 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chọn một trang để đọc.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
