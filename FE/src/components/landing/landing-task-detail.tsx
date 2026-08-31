"use client";

import { useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Circle,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Send,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const initialSubtasks = [
  { id: 1, text: "Kiểm tra tablet", done: true },
  { id: 2, text: "Sửa task detail", done: true },
  { id: 3, text: "Kiểm tra drawer", done: true },
  { id: 4, text: "Tối ưu spacing", done: false },
];

const initialComments = [
  { id: 1, initials: "AN", name: "An Nguyễn", time: "5 phút trước", text: "@Khoa phần tablet đã ổn, bạn xem lại giúp mình nhé." },
  { id: 2, initials: "KN", name: "KhoaNee", time: "12 phút trước", text: "Drawer trên mobile đã đúng kích thước." },
];

function DemoAvatar({ initials, dark = false }: { initials: string; dark?: boolean }) {
  return <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2 border-white text-[9px] font-black", dark ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600")}>{initials}</span>;
}

export function LandingTaskDetail() {
  const [mobileTab, setMobileTab] = useState<"details" | "comments" | "activity">("details");
  const [rightTab, setRightTab] = useState<"comments" | "activity">("comments");
  const [status, setStatus] = useState("Đang thực hiện");
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const completed = subtasks.filter((item) => item.done).length;

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    setComments((items) => [{ id: Date.now(), initials: "NK", name: "Nguyễn Đức Khoa", time: "vừa xong", text }, ...items]);
    setCommentText("");
  };

  const details = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">Độ ưu tiên: Cao</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400">
          <option>Cần làm</option><option>Đang thực hiện</option><option>Đang review</option><option>Hoàn thành</option>
        </select>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Tối ưu cách hiển thị trang dự án trên mobile và tablet, bảo đảm task detail dùng drawer đúng cấu trúc.</p>
      </div>
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 text-sm"><CalendarDays className="size-4 text-slate-400" /><span className="text-slate-500">Hạn chót</span><strong className="ml-auto">10/09/2026</strong></div>
        <div className="flex items-center gap-3 text-sm"><Users className="size-4 text-slate-400" /><span className="text-slate-500">Phụ trách</span><div className="ml-auto flex -space-x-2"><DemoAvatar initials="NK" /><DemoAvatar initials="AN" /></div></div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tệp tin đính kèm</p><button type="button" className="text-xs font-bold text-blue-600">Tải file lên</button></div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700"><Paperclip className="size-4 text-slate-400" />mobile-layout.png</div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500"><span className="uppercase tracking-wider">Công việc phụ</span><span>{completed} / {subtasks.length} hoàn thành</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(completed / subtasks.length) * 100}%` }} /></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {subtasks.map((item) => (
            <button key={item.id} type="button" onClick={() => setSubtasks((values) => values.map((value) => value.id === item.id ? { ...value, done: !value.done } : value))} className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:border-blue-200">
              {item.done ? <CheckCircle2 className="size-4 text-blue-500" /> : <Circle className="size-4 text-slate-300" />}<span className={item.done ? "line-through text-slate-400" : ""}>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const commentsPanel = (
    <div className="p-4">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5">
        <DemoAvatar initials="NK" />
        <input value={commentText} onChange={(event) => setCommentText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitComment(); }} placeholder="Viết bình luận, gõ @ để nhắc thành viên..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
        <button type="button" onClick={submitComment} disabled={!commentText.trim()} className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white disabled:opacity-40"><Send className="size-4" /></button>
      </div>
      <div className="mt-4 space-y-3">
        {comments.map((comment, index) => (
          <div key={comment.id} className="flex gap-2.5">
            <DemoAvatar initials={comment.initials} dark={index === 1} />
            <div className="min-w-0 flex-1 rounded-xl border border-slate-200/60 bg-slate-50 p-2.5">
              <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{comment.name}</strong><span className="text-xs text-slate-400">{comment.time}</span></div>
              <p className="mt-1 text-sm leading-5 text-slate-600">{comment.text}</p>
              <button type="button" className="mt-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600">Trả lời</button>
              {index === 0 && <button type="button" className="mt-2 block border-l-2 border-slate-200 pl-3 text-[13px] font-semibold text-blue-600">Xem 2 câu trả lời</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const activityPanel = (
    <div className="space-y-3 bg-slate-50/70 p-4">
      {[
        ["AN", "An Nguyễn", "đã chuyển trạng thái sang Đang thực hiện", "8 phút trước"],
        ["NK", "Nguyễn Đức Khoa", "đã thêm công việc phụ Kiểm tra drawer", "24 phút trước"],
        ["KN", "KhoaNee", "đã thêm một bình luận", "1 giờ trước"],
      ].map(([initials, name, action, time]) => (
        <div key={action} className="flex gap-2.5"><DemoAvatar initials={initials} /><div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-2.5"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{name}</strong><span className="text-xs text-slate-400">{time}</span></div><p className="mt-1 text-sm text-slate-600">{action}</p></div></div>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.07)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="min-w-0"><p className="text-[10px] font-bold text-blue-600">Website công ty</p><h3 className="truncate text-sm font-black sm:text-base">Responsive trang dự án</h3></div>
        <div className="flex items-center gap-2"><span className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 sm:block">Lưu trữ</span><MoreHorizontal className="size-5 text-slate-400" /></div>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-200 bg-white p-1 lg:hidden">
        {([
          ["details", "Chi tiết"],
          ["comments", `Bình luận (${comments.length})`],
          ["activity", "Hoạt động"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMobileTab(id)} className={cn("rounded-lg px-1 py-2.5 text-xs font-bold", mobileTab === id ? "bg-blue-50 text-blue-700" : "text-slate-500")}>{label}</button>
        ))}
      </div>

      <div className="p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:gap-8">
        <div className={cn(mobileTab !== "details" && "hidden lg:block")}>{details}</div>
        <aside className={cn("space-y-4", mobileTab === "details" && "hidden lg:block")}>
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:block">
            <div className="flex items-center gap-2"><Eye className="size-4 text-blue-600" /><p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Người theo dõi</p></div>
            <div className="mt-3 flex gap-2"><span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1"><DemoAvatar initials="NK" /><span className="text-xs font-semibold">Nguyễn Khoa</span></span></div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-2 border-b border-slate-200 bg-slate-50 p-1 lg:grid">
              <button type="button" onClick={() => setRightTab("comments")} className={cn("rounded-lg px-3 py-2 text-xs font-bold", rightTab === "comments" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}><MessageSquare className="mr-1 inline size-3.5" />Bình luận ({comments.length})</button>
              <button type="button" onClick={() => setRightTab("activity")} className={cn("rounded-lg px-3 py-2 text-xs font-bold", rightTab === "activity" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}><Activity className="mr-1 inline size-3.5" />Hoạt động</button>
            </div>
            {(mobileTab === "comments" || (mobileTab === "details" && rightTab === "comments")) && commentsPanel}
            {(mobileTab === "activity" || (mobileTab === "details" && rightTab === "activity")) && activityPanel}
          </div>
        </aside>
      </div>
    </div>
  );
}
