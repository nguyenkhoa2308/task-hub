"use client";

import Image from "next/image";
import {
  Archive,
  Bell,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Minus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { LandingWorkViews } from "./landing-work-views";
import { LandingTaskDetail } from "./landing-task-detail";
import { cn } from "@/lib/utils";

const steps = [
  { id: "workspace", number: "01", title: "Tổ chức theo workspace", description: "Mỗi workspace giữ thành viên, dự án và quyền truy cập trong một phạm vi rõ ràng." },
  { id: "views", number: "02", title: "Theo dõi công việc", description: "Chuyển giữa Kanban và danh sách tùy theo thông tin bạn cần xem." },
  { id: "detail", number: "03", title: "Làm việc trong task", description: "Cập nhật trạng thái, việc phụ, tệp và người phụ trách mà không rời ngữ cảnh." },
  { id: "comments", number: "04", title: "Trao đổi và nhận thông báo", description: "Bình luận, mention và quay lại đúng nội dung vừa thay đổi." },
  { id: "members", number: "05", title: "Quản lý thành viên", description: "Phân vai trò và kiểm soát thao tác trong từng workspace." },
] as const;

type StepId = (typeof steps)[number]["id"];

function Avatar({ text, dark = false }: { text: string; dark?: boolean }) {
  return <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2 border-white text-[9px] font-black", dark ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600")}>{text}</span>;
}

function WorkspacePanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="grid min-h-[570px] md:grid-cols-[230px_1fr]">
        <aside className="hidden flex-col border-r border-slate-200 bg-slate-50/70 md:flex">
          <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4"><Image src="/logo.png" alt="" width={20} height={20} className="size-5 rounded-md object-contain" /><strong className="text-sm">TaskHub</strong><ChevronRight className="ml-auto size-4 rotate-180 text-slate-400" /></div>
          <div className="flex-1 p-3">
            {[[LayoutDashboard, "Tổng quan"], [Users, "Workspace"], [ListChecks, "Công việc"], [Users, "Thành viên"], [Archive, "Lưu trữ"], [Trash2, "Thùng rác"]].map(([Icon, label], index) => {
              const ItemIcon = Icon as typeof LayoutDashboard;
              return <div key={label as string} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold", index === 1 ? "bg-blue-50 text-blue-700" : "text-slate-500")}><ItemIcon className="size-4" />{label as string}</div>;
            })}
            <div className="mt-4 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between px-2 py-1"><span className="text-[10px] font-black tracking-wider text-slate-400">DỰ ÁN</span><Minus className="size-4 text-slate-400" /></div>
              {["Website công ty", "Ứng dụng mobile", "Marketing Q4"].map((name, index) => <div key={name} className={cn("mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold", index === 0 ? "bg-blue-50 text-blue-700" : "text-slate-500")}><span className="size-2 rounded-sm bg-blue-500" /><span className="truncate">{name}</span></div>)}
            </div>
          </div>
          <div className="border-t border-slate-200 p-3"><div className="flex items-center gap-2 p-1"><Avatar text="NK" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">Nguyễn Đức Khoa</p><p className="text-[10px] text-slate-400">Chủ sở hữu</p></div></div><div className="mt-1 flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-slate-500"><LogOut className="size-4" />Đăng xuất</div></div>
        </aside>
        <div>
          <div className="flex h-14 items-center gap-3 border-b border-slate-200 px-4"><div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><span className="size-2 rounded-sm bg-blue-500" /><span className="truncate text-xs font-bold">Product Team</span><ChevronRight className="size-3.5 rotate-90 text-slate-400" /></div><Search className="ml-auto size-4 text-slate-400" /><Bell className="size-4 text-slate-400" /><Avatar text="NK" /></div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-blue-600">Product Team</p><h3 className="mt-1 text-xl font-black">Workspace của bạn</h3><p className="mt-1 text-sm text-slate-500">3 dự án · 5 thành viên</p></div><span className="w-fit rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white">Tạo dự án</span></div>
            <div className="mt-5 space-y-3">
              {[["Website công ty", "Đang thực hiện", "8 công việc"], ["Ứng dụng mobile", "Lập kế hoạch", "12 công việc"], ["Marketing Q4", "Tạm dừng", "5 công việc"]].map(([name, status, count], index) => <div key={name} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><span className={cn("grid size-10 place-items-center rounded-xl", index === 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500")}><FolderKanban className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{name}</p><p className="mt-0.5 text-xs text-slate-400">{count}</p></div><span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:block">{status}</span><ChevronRight className="size-4 text-slate-300" /></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationPanel() {
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><Bell className="size-4 text-blue-600" /><strong className="text-sm">Thông báo</strong><span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">3 chưa đọc</span></div><span className="text-xs font-bold text-blue-600">Đọc tất cả</span></div>
      {[["AN", "Bình luận mới", "An Nguyễn đã bình luận vào công việc Responsive trang dự án", "5 phút trước"], ["KN", "Bạn được nhắc đến", "KhoaNee đã nhắc đến bạn trong một bình luận", "18 phút trước"], ["!", "Công việc sắp đến hạn", "Phân quyền thành viên sẽ đến hạn vào ngày mai", "1 giờ trước"]].map(([avatar, title, description, time], index) => <div key={title} className={cn("flex gap-3 border-b border-slate-100 p-4 last:border-b-0", index < 2 && "bg-blue-50/30")}><Avatar text={avatar} dark={index === 2} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-xs font-extrabold text-slate-800">{title}</p><span className="shrink-0 text-[10px] text-slate-400">{time}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>{index < 2 && <span className="mt-3 size-2 shrink-0 rounded-full bg-blue-600" />}</div>)}
      <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
        {["Mở đúng bình luận", "Cập nhật realtime", "Nhắc lại quá hạn"].map((item) => <div key={item} className="flex items-center gap-2 text-xs font-bold text-slate-600"><CheckCircle2 className="size-4 text-blue-600" />{item}</div>)}
      </div>
    </div>
  );
}

function MembersPanel() {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 p-5"><div className="flex items-center justify-between gap-4"><div><h3 className="font-black">Danh sách thành viên</h3><p className="mt-1 text-xs text-slate-500">Theo dõi người tham gia và vai trò trong workspace.</p></div><span className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-extrabold text-white">Mời thành viên</span></div><div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs text-slate-400"><Search className="size-4" />Tìm tên hoặc email...</div></div>
      {[["NK", "Nguyễn Đức Khoa", "nguyenduckhoa@example.com", "Chủ sở hữu", "bg-violet-50 text-violet-700"], ["AN", "An Nguyễn", "an.nguyen@example.com", "Thành viên", "bg-emerald-50 text-emerald-700"], ["KN", "KhoaNee", "khoanee@example.com", "Người xem", "bg-blue-50 text-blue-700"]].map(([avatar, name, email, role, tone]) => <div key={email} className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0"><Avatar text={avatar} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{name}</p><p className="truncate text-xs text-slate-400">{email}</p></div><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", tone)}>{role}</span><ShieldCheck className="size-4 text-slate-400" /></div>)}
    </div>
  );
}

function StepPanel({ id }: { id: StepId }) {
  if (id === "workspace") return <WorkspacePanel />;
  if (id === "views") return <LandingWorkViews />;
  if (id === "detail") return <LandingTaskDetail />;
  if (id === "comments") return <NotificationPanel />;
  return <MembersPanel />;
}

export function LandingProductTour() {
  return (
    <section id="product-tour" className="border-y border-slate-200">
      <div className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
          <div>
            <p className="text-sm font-black text-blue-600">{steps[0].number} · Workspace và dự án</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{steps[0].title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{steps[0].description}</p>
          </div>
          <StepPanel id="workspace" />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black text-blue-600">{steps[1].number} · Kanban và danh sách</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{steps[1].title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{steps[1].description}</p>
          </div>
          <div className="mt-12"><StepPanel id="views" /></div>
        </div>
      </div>

      <div className="border-t border-slate-200 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black text-blue-600">{steps[2].number} · Chi tiết công việc</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{steps[2].title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{steps[2].description}</p>
          </div>
          <div className="mt-12"><StepPanel id="detail" /></div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
          <div>
            <p className="text-sm font-black text-blue-600">{steps[3].number} · Bình luận và thông báo</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{steps[3].title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{steps[3].description}</p>
          </div>
          <StepPanel id="comments" />
        </div>
      </div>

      <div className="border-t border-slate-200 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-8">
          <StepPanel id="members" />
          <div>
            <p className="text-sm font-black text-blue-600">{steps[4].number} · Thành viên và vai trò</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{steps[4].title}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{steps[4].description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
