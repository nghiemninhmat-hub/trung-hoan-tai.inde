import {
  AlertTriangle, CalendarDays, CheckCircle2, CircleDot, Clock3,
  Eye, FileWarning, KeyRound, MapPin, ShieldAlert, Target, UserRound
} from 'lucide-react';

const wantedImage = '/images/wanted/569353577901495689.jpg';

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Target }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-[#670201]/25 pb-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#670201]/40 bg-[#670201]/15">
        <Icon className="h-4 w-4 text-amber-300" />
      </div>
      <h2 className="font-serif text-lg font-bold tracking-wide text-amber-100 sm:text-xl">{children}</h2>
    </div>
  );
}

function DetailRow({ label, children, accent = false }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-white/5 py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className={`text-sm leading-7 ${accent ? 'font-semibold text-amber-100' : 'text-gray-300'}`}>{children}</dd>
    </div>
  );
}

export default function WantedPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-[#670201]/35 bg-gradient-to-br from-[#1b0807] via-[#100607] to-[#080405] px-6 py-9 sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#a00404]/15 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-60 w-80 rounded-full bg-amber-900/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-300/80">
              <ShieldAlert className="h-4 w-4" />
              Công Báo Của Hệ Thống
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-wide text-amber-100 sm:text-6xl">Bảng Truy Nã</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-gray-400">Hồ sơ những đối tượng đang bị truy tìm trong Trùng Hoan Tái. Mọi lệnh đều được Hệ Thống xác nhận và ghi vết.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-300">
            <CircleDot className="h-5 w-5 animate-pulse" />
            <div><p className="text-[10px] uppercase tracking-wider text-emerald-300/60">Hồ sơ đang mở</p><p className="text-sm font-bold">01 Lệnh Truy Nã</p></div>
          </div>
        </div>
      </header>

      <article className="overflow-hidden rounded-3xl border border-[#670201]/30 bg-gradient-to-b from-[#0f0606] to-[#080405] shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="grid lg:grid-cols-[340px_1fr]">
          <aside className="relative min-h-[430px] overflow-hidden border-b border-[#670201]/25 bg-[#170a09] lg:border-b-0 lg:border-r">
            <img src={wantedImage} alt="Chân dung đối tượng truy nã Lục Tư Mặc" className="absolute inset-0 h-full w-full object-cover object-top opacity-80 grayscale-[20%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080405] via-transparent to-[#180807]/30" />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-red-300/30 bg-[#4d0707]/75 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-200 backdrop-blur-sm">
              <FileWarning className="h-3.5 w-3.5" /> Truy nã
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300/70">Mã Lệnh</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-amber-100">#038517</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-300"><MapPin className="h-3.5 w-3.5 text-red-300" /> Khu vực Trùng Hoan</div>
            </div>
          </aside>

          <div className="p-6 sm:p-8">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#670201]/25 pb-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300/70">Đối tượng truy nã</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-amber-100 sm:text-4xl">Lục Tư Mặc</h2>
                <p className="mt-2 text-sm text-gray-500">Thương nhân tự do · Không thuộc tổ chức</p>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <CircleDot className="h-3.5 w-3.5 animate-pulse" /> Đang truy nã
              </div>
            </div>

            <section className="mb-8">
              <SectionTitle icon={UserRound}>Thông Tin Nhận Dạng</SectionTitle>
              <dl>
                <DetailRow label="Giới tính / Tuổi">Nam · 29 tuổi</DetailRow>
                <DetailRow label="Nghề nghiệp">Thương nhân tự do</DetailRow>
                <DetailRow label="Tổ chức">Không thuộc tổ chức</DetailRow>
                <DetailRow label="Đặc điểm nhận dạng">Nam, cao khoảng 1m82, tóc đen ngắn, thường mặc trường sam màu xám đậm. Trên ngón áp út tay phải có một chiếc nhẫn bạc khắc hình đầu sói. Có một vết sẹo dài khoảng 3cm phía trên lông mày trái. Thường mang theo túi da màu nâu sẫm và có thói quen cải trang khi di chuyển giữa các khu vực.</DetailRow>
              </dl>
            </section>

            <section className="mb-8">
              <SectionTitle icon={AlertTriangle}>Lý Do & Nhiệm Vụ</SectionTitle>
              <dl>
                <DetailRow label="Lý do truy nã">Đối tượng bị cáo buộc đã sử dụng thủ đoạn bất hợp pháp để chiếm đoạt tài sản thuộc quyền sở hữu của một người chơi khác. Sau khi thực hiện hành vi, đối tượng đã mang theo tài sản rời khỏi hiện trường và hiện chưa hoàn trả.</DetailRow>
                <DetailRow label="Tài sản bị chiếm đoạt" accent>01 bùa hộ thân — 80 Công Đức<br />01 chuông thanh tâm — 250 Công Đức</DetailRow>
                <DetailRow label="Yêu cầu nhiệm vụ">Tìm kiếm đối tượng và thu hồi số tài sản bị chiếm đoạt.</DetailRow>
                <DetailRow label="Điều kiện hoàn thành">Xác định đúng đối tượng; thu hồi toàn bộ hoặc số lượng tài sản đạt mức tối thiểu; cung cấp bằng chứng cần thiết để Hệ Thống xác nhận kết quả.</DetailRow>
              </dl>
            </section>

            <section className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-transparent p-5">
              <SectionTitle icon={KeyRound}>Phần Thưởng</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs uppercase tracking-wider text-gray-500">Mức thưởng</p><p className="mt-1 font-serif text-xl font-bold text-amber-200">500 Hoa Tiền <span className="text-gray-500">+</span> 70 Công Đức</p></div>
                <div><p className="text-xs uppercase tracking-wider text-gray-500">Hình thức nhận</p><p className="mt-1 text-sm font-semibold text-gray-200">Hệ Thống trung gian xác nhận</p></div>
              </div>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-6 text-gray-500">Phần thưởng được trao cho người đầu tiên hoàn thành đầy đủ điều kiện và được Hệ Thống xác nhận. Người thực hiện nhiệm vụ có quyền thương lượng thêm với người phát lệnh về mức thù lao ngoài phần thưởng đã công bố.</p>
            </section>
          </div>
        </div>

        <footer className="border-t border-[#670201]/25 bg-black/20 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3"><Target className="h-5 w-5 text-red-300" /><h2 className="font-serif text-lg font-bold text-amber-100">Trạng Thái Lệnh</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"><p className="text-[10px] uppercase tracking-wider text-gray-500">Trạng thái</p><p className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Đang truy nã</p></div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-wider text-gray-500">Ngày phát lệnh</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-200"><CalendarDays className="h-4 w-4 text-amber-300/70" /> 10/08/XXIX</p></div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-wider text-gray-500">Số người nhận nhiệm vụ</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-200"><Eye className="h-4 w-4 text-amber-300/70" /> 03 người</p></div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-wider text-gray-500">Thời hạn</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-200"><Clock3 className="h-4 w-4 text-amber-300/70" /> 10 ngày</p></div>
          </div>
          <p className="mt-5 text-xs italic leading-6 text-gray-600">Lưu ý: Danh tính người phát lệnh được Hệ Thống mã hóa và bảo mật tuyệt đối. Đối tượng truy nã không có quyền truy xuất thông tin này.</p>
        </footer>
      </article>
    </div>
  );
}
