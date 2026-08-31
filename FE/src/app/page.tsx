import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Link2,
  ListChecks,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import { LandingProductTour } from "@/components/landing/landing-product-tour";

function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl pb-9 pt-5 lg:mr-0">
      <div className="absolute left-0 top-0 w-[78%] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:left-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-lg object-contain" />
            <div><p className="text-[10px] font-bold text-blue-600">Product Team</p><p className="text-xs font-black">Website công ty</p></div>
          </div>
          <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Đang thực hiện</span>
        </div>
        <div className="pt-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500"><span className="flex items-center gap-1"><CalendarDays className="size-3.5" />Hạn: 10/09/2026</span><MoreHorizontal className="size-4" /></div>
          <h2 className="mt-2 text-base font-bold text-slate-950">Responsive trang dự án</h2>
          <p className="mt-1 truncate text-[13px] text-slate-600">Tối ưu hiển thị mobile và tablet.</p>
          <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-500"><span className="flex items-center gap-1"><ListChecks className="size-3.5" />Tiến độ</span><strong className="text-slate-700">3/5</strong></div>
          <div className="mt-2 flex gap-1">{[0, 1, 2, 3, 4].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item < 3 ? "bg-emerald-500" : "bg-slate-200"}`} />)}</div>
          <div className="mt-4 flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500">Thực hiện bởi</span><div className="flex -space-x-1.5"><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-black text-slate-600">NK</span><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-blue-100 text-[9px] font-black text-blue-700">AN</span><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-700 text-[9px] font-black text-white">+1</span></div></div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="relative rounded-md bg-rose-50 px-2 py-1 pl-4 text-[10px] font-semibold text-rose-700 before:absolute before:left-2 before:top-1/2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-rose-500">Cao</span><span className="flex items-center gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Link2 className="size-3" />2</span><span className="flex items-center gap-1"><MessageCircle className="size-3" />4</span></span></div>
        </div>
      </div>

      <div className="relative ml-auto mt-44 w-[68%] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.12)] sm:mr-2">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><Bell className="size-4" /></span>
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-xs font-extrabold text-slate-800">Bạn được nhắc đến</p><span className="shrink-0 text-[9px] text-slate-400">vừa xong</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">An Nguyễn đã nhắc đến bạn trong một bình luận.</p><span className="mt-2 inline-block text-[10px] font-bold text-blue-600">Mở bình luận</span></div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-white text-slate-950 selection:bg-blue-200">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Điều hướng chính">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="size-9 rounded-xl object-contain" priority />
            <span className="text-lg font-black tracking-tight">Task Hub</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <Link href="#product-tour" className="text-sm font-bold text-slate-500 hover:text-slate-950">Sản phẩm</Link>
            <Link href="#bat-dau" className="text-sm font-bold text-slate-500 hover:text-slate-950">Bắt đầu</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/sign-in" className="hidden px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-950 sm:block">Đăng nhập</Link>
            <Link href="/auth/sign-up" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700">Dùng miễn phí<ArrowRight className="size-4" /></Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-8">
        <div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Quản lý công việc mà không phải quản lý thêm công cụ.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-slate-600">Task Hub giúp đội nhóm biết việc nào cần làm, ai phụ trách và điều gì vừa thay đổi.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/sign-up" className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-6 font-extrabold text-white hover:bg-blue-700">Tạo workspace đầu tiên<ArrowRight className="size-5" /></Link>
            <Link href="#product-tour" className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl border border-slate-300 px-6 font-extrabold text-slate-700 hover:bg-slate-50">Xem cách hoạt động</Link>
          </div>
        </div>
        <HeroProductPreview />
      </section>

      <div className="border-y border-slate-200">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {["Dự án theo từng workspace", "Kanban và danh sách dùng chung dữ liệu", "Bình luận, thông báo và lịch sử"].map((item) => (
            <div key={item} className="flex items-center gap-3 py-5 md:px-6 md:first:pl-0">
              <CheckCircle2 className="size-5 shrink-0 text-blue-600" />
              <p className="text-sm font-extrabold text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <LandingProductTour />

      <section id="bat-dau" className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-black leading-tight tracking-[-0.045em] sm:text-6xl">Bắt đầu từ công việc tiếp theo.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">Tạo workspace và đưa đội nhóm vào cùng một luồng làm việc.</p>
          <Link href="/auth/sign-up" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 font-extrabold text-white hover:bg-blue-700">Dùng Task Hub<ArrowRight className="size-5" /></Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="max-w-sm">
              <Link href="/" className="inline-flex items-center gap-2.5"><Image src="/logo.png" alt="" width={36} height={36} className="size-9 rounded-xl object-contain" /><span className="text-lg font-black tracking-tight">Task Hub</span></Link>
              <p className="mt-4 text-sm leading-6 text-slate-500">Quản lý workspace, dự án và công việc cùng đội nhóm trong một nơi.</p>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Sản phẩm</p>
              <nav className="mt-4 flex flex-col items-start gap-3 text-sm font-semibold text-slate-500" aria-label="Sản phẩm"><Link href="#product-tour" className="hover:text-blue-600">Cách hoạt động</Link><Link href="#bat-dau" className="hover:text-blue-600">Bắt đầu</Link></nav>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Tài khoản</p>
              <nav className="mt-4 flex flex-col items-start gap-3 text-sm font-semibold text-slate-500" aria-label="Tài khoản"><Link href="/auth/sign-up" className="hover:text-blue-600">Đăng ký</Link><Link href="/auth/sign-in" className="hover:text-blue-600">Đăng nhập</Link></nav>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Task Hub</p><p>Quản lý công việc rõ ràng hơn.</p></div>
        </div>
      </footer>
    </main>
  );
}
