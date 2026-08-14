import { useState, useEffect, useCallback } from 'react';
import { supabase, WheelSpinResult } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Anchor, Coins, Dices, Frown, Gift, Loader2, Package,
  Sparkles, Skull, Star, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Rarity = 1 | 2 | 3 | 4 | 5;

type WheelSegment = {
  label: string;
  color: string;
  icon: LucideIcon;
};

const rarityConfig: Record<Rarity, { stars: string; border: string; bg: string }> = {
  5: { stars: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10' },
  4: { stars: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  3: { stars: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
  2: { stars: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  1: { stars: 'text-gray-400', border: 'border-gray-500/50', bg: 'bg-gray-500/10' },
};

const wheelSegments: WheelSegment[] = [
  { label: 'Hoa Tiền', color: '#a85d0b', icon: Coins },
  { label: 'Công Đức', color: '#087b8c', icon: Sparkles },
  { label: 'Âm Đức', color: '#632d92', icon: Skull },
  { label: 'Vật phẩm\nThương Thành', color: '#087454', icon: Package },
  { label: 'Quà\nĐặc Biệt', color: '#a51c42', icon: Gift },
  { label: 'May mắn\nlần sau', color: '#484848', icon: Frown },
];

const segmentAngle = 360 / wheelSegments.length;

function Stars({ count }: { count: Rarity }) {
  return (
    <span className="flex gap-0.5" aria-label={`${count} sao`}>
      {[1, 2, 3, 4, 5].map(index => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index <= count ? rarityConfig[count].stars : 'text-gray-700'}`}
          fill={index <= count ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

function getRewardRarity(group: string): Rarity {
  if (group === 'Quà Đặc Biệt') return 5;
  if (group === 'Âm Đức' || group === 'Vật phẩm Thương Thành') return 3;
  if (group === 'Hoa Tiền' || group === 'Công Đức') return 2;
  return 1;
}

function getSegmentIndex(group: string): number {
  if (group === 'Hoa Tiền') return 0;
  if (group === 'Công Đức') return 1;
  if (group === 'Âm Đức') return 2;
  if (group === 'Vật phẩm Thương Thành') return 3;
  if (group === 'Quà Đặc Biệt') return 4;
  return 5;
}

export default function BachPhapPage() {
  const { profile, refreshProfile } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelSpinResult | null>(null);
  const [error, setError] = useState('');
  const [rotation, setRotation] = useState(0);

  const spinsLeft = profile?.wheel_spins ?? 0;

  const refreshWheelProfile = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    refreshWheelProfile();
  }, [refreshWheelProfile]);

  const handleSpin = async () => {
    if (spinning || spinsLeft <= 0) return;

    setSpinning(true);
    setError('');
    setResult(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('spin_wheel');
      if (rpcError) throw rpcError;

      const spinResult = (data as WheelSpinResult[])[0];
      if (!spinResult) throw new Error('Không nhận được kết quả');

      const targetIndex = getSegmentIndex(spinResult.reward_group);
      const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
      const currentMod = rotation % 360;
      const destination = 360 * 6 + (360 - targetCenter);
      const delta = destination - currentMod;
      setRotation(rotation + delta + (delta < 0 ? 360 : 0));

      await new Promise(resolve => setTimeout(resolve, 4200));
      setResult(spinResult);
      setSpinning(false);
      await refreshWheelProfile();
    } catch (cause) {
      console.error('spin wheel failed', cause);
      setError('Không thể quay lúc này. Vui lòng thử lại.');
      setSpinning(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-[#670201]/30 bg-gradient-to-br from-[#1c0908] via-[#110707] to-[#080405] px-6 py-8 text-center sm:px-12 sm:py-10">
        <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-[#a00404]/15 blur-3xl" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
            <Dices className="h-4 w-4" />
            Bách Pháp Mệnh
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-wide text-amber-100 sm:text-6xl">Vòng Quay May Mắn</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">Chọn vận mệnh của bạn. Những phần thưởng đang chờ được hé lộ.</p>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-[#670201]/30 bg-gradient-to-br from-[#160807] via-[#0b0505] to-[#080405] px-4 py-8 shadow-[0_24px_100px_rgba(0,0,0,0.45)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#670201]/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8 flex items-center gap-3 rounded-full border border-amber-300/20 bg-black/30 px-5 py-2.5 shadow-lg backdrop-blur-sm">
            <Dices className="h-4 w-4 text-amber-300" />
            <span className="text-xs uppercase tracking-[0.18em] text-gray-400">Lượt quay còn lại</span>
            <span className="font-serif text-xl font-bold text-amber-100">{spinsLeft}</span>
          </div>

          <div className="relative aspect-square w-[min(86vw,480px)]">
            <div className="absolute -inset-3 rounded-full border border-amber-300/10 shadow-[0_0_60px_rgba(160,4,4,0.25)]" />
            <div className="absolute -inset-6 rounded-full border border-[#670201]/20" />
            <div className="absolute left-1/2 top-[-15px] z-30 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[15px] border-x-transparent border-b-[27px] border-b-amber-200 drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]" />
              <div className="mx-auto h-2 w-2 rounded-full bg-amber-100 shadow-[0_0_12px_rgba(253,230,138,0.9)]" />
            </div>
            <div
              className="relative h-full w-full rounded-full border-[6px] border-[#8b4a2b]/70 shadow-[inset_0_0_0_3px_rgba(0,0,0,0.4),0_18px_40px_rgba(0,0,0,0.5)]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                background: `conic-gradient(${wheelSegments.map((segment, index) => `${segment.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`).join(', ')})`,
              }}
            >
              {wheelSegments.map((segment, index) => {
                const Icon = segment.icon;
                const angle = index * segmentAngle + segmentAngle / 2;
                return (
                  <div key={segment.label} className="absolute left-1/2 top-1/2 origin-left" style={{ transform: `rotate(${angle}deg) translateX(clamp(82px, 14vw, 142px))` }}>
                    <div className="flex w-[clamp(68px,16vw,108px)] -translate-y-1/2 -translate-x-1/2 flex-col items-center text-center">
                      <Icon className="mb-1 h-5 w-5 text-amber-100/90 sm:h-6 sm:w-6" />
                      <span className="whitespace-pre-line font-serif text-[11px] font-bold leading-tight text-white/95 drop-shadow-md sm:text-sm">{segment.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#b76b3c]/80 bg-gradient-to-br from-[#670201] to-[#a00404] shadow-[0_0_20px_rgba(0,0,0,0.55)] sm:h-20 sm:w-20">
              <span className="font-serif text-2xl font-bold text-amber-100 sm:text-3xl">重</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
            <button
              onClick={handleSpin}
              disabled={spinning || spinsLeft <= 0}
              className={`flex min-w-48 items-center justify-center gap-3 rounded-xl px-8 py-4 text-base font-bold tracking-wide transition-all ${spinning || spinsLeft <= 0 ? 'cursor-not-allowed bg-gray-700/50 text-gray-500' : 'bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 shadow-lg shadow-[#670201]/30 hover:scale-105 hover:shadow-[#670201]/50'}`}
            >
              {spinning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Dices className="h-5 w-5" />}
              {spinning ? 'Đang quay...' : 'QUAY NGAY'}
            </button>
            {spinsLeft <= 0 && !spinning && <p className="text-xs italic text-gray-500">Lượt quay được cấp bởi Ban Điều Hành.</p>}
          </div>
        </div>
      </section>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setResult(null)}>
          <div className={`relative w-full max-w-sm rounded-2xl border-2 p-8 text-center shadow-2xl ${rarityConfig[getRewardRarity(result.reward_group)].border} ${rarityConfig[getRewardRarity(result.reward_group)].bg}`} onClick={event => event.stopPropagation()}>
            <button onClick={() => setResult(null)} className="absolute right-3 top-3 text-gray-500 transition-colors hover:text-gray-200" aria-label="Đóng"><X className="h-5 w-5" /></button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10">
              {result.is_special ? <Gift className="h-8 w-8 text-rose-300" /> : result.reward_group === 'MISS' ? <Frown className="h-8 w-8 text-gray-400" /> : <Sparkles className="h-8 w-8 text-amber-300" />}
            </div>
            <div className="mb-3 flex justify-center"><Stars count={getRewardRarity(result.reward_group)} /></div>
            <h2 className="font-serif text-xl font-bold text-amber-100">{result.reward_group === 'MISS' ? 'Tiếc quá!' : 'Chúc mừng!'}</h2>
            <p className="mt-2 text-lg font-semibold text-gray-200">{result.reward_label}</p>
            {result.is_special && <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">Quà Đặc Biệt chỉ được nhận một lần cho mỗi tài khoản.</p>}
            <button onClick={() => setResult(null)} className="mt-6 w-full rounded-lg bg-gradient-to-r from-[#670201] to-[#a00404] py-3 text-sm font-bold text-amber-100 transition-opacity hover:opacity-90">Đã nhận</button>
          </div>
        </div>
      )}
    </div>
  );
}
