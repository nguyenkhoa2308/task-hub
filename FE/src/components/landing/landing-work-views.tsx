"use client";

import { useState } from "react";
import { Columns3, List, MousePointer2 } from "lucide-react";
import {
  TaskKanbanBoard,
  type SharedKanbanTask,
} from "@/components/task/task-kanban-board";
import { TaskGroupedList } from "@/components/task/task-grouped-list";
import { cn } from "@/lib/utils";

const demoTasks: SharedKanbanTask[] = [
  {
    _id: "landing-1",
    title: "Hoàn thiện nội dung trang chủ",
    description: "Rà soát nội dung và thông điệp chính.",
    status: "To Do",
    priority: "HIGH",
    startDate: "2026-09-01",
    dueDate: "2026-09-12",
    assignees: [{ name: "Nguyễn Khoa" }, { name: "An Nguyễn" }, { name: "KhoaNee" }],
    subtasks: [{ done: true }, { done: true }, { done: false }, { done: false }],
    attachments: [{}, {}],
    comments: [{}, {}, {}, {}],
  },
  {
    _id: "landing-2",
    title: "Responsive trang dự án",
    description: "Tối ưu hiển thị mobile và tablet.",
    status: "In Progress",
    priority: "HIGH",
    startDate: "2026-09-02",
    dueDate: "2026-09-10",
    assignees: [{ name: "Nguyễn Khoa" }, { name: "An Nguyễn" }],
    subtasks: [{ done: true }, { done: true }, { done: true }, { done: false }, { done: false }],
    attachments: [{}],
    comments: [{}, {}],
  },
  {
    _id: "landing-3",
    title: "Phân quyền thành viên",
    description: "Kiểm tra quyền owner, member và viewer.",
    status: "Review",
    priority: "MEDIUM",
    startDate: "2026-09-03",
    dueDate: "2026-09-14",
    assignees: [{ name: "KhoaNee" }],
    subtasks: [{ done: true }, { done: true }, { done: true }],
    attachments: [{}, {}, {}],
    comments: [{}, {}, {}],
  },
  {
    _id: "landing-4",
    title: "Thiết lập workspace",
    description: "Hoàn thiện cấu hình workspace ban đầu.",
    status: "Done",
    priority: "LOW",
    startDate: "2026-09-01",
    dueDate: "2026-09-06",
    assignees: [{ name: "Nguyễn Khoa" }, { name: "An Nguyễn" }],
    subtasks: [{ done: true }, { done: true }, { done: true }],
    attachments: [{}, {}],
    comments: [{}, {}, {}, {}],
  },
];

export function LandingWorkViews() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<SharedKanbanTask>(demoTasks[1]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">Website công ty</p>
          <p className="mt-1 text-xs text-slate-500">Chuyển chế độ xem và chọn thử một công việc.</p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:flex-none", view === "kanban" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}
          >
            <Columns3 className="size-4" />Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:flex-none", view === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}
          >
            <List className="size-4" />Danh sách
          </button>
        </div>
      </div>

      <div className="bg-slate-50/70 p-3 sm:p-5">
        {view === "kanban" ? (
          <TaskKanbanBoard
            tasks={demoTasks}
            canEdit={false}
            disableDrag
            onTaskClick={setSelectedTask}
            onDragStart={() => undefined}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => undefined}
            onDrop={() => undefined}
          />
        ) : (
          <TaskGroupedList
            tasks={demoTasks}
            canEdit={false}
            onTaskClick={setSelectedTask}
          />
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <MousePointer2 className="size-4 shrink-0 text-blue-600" />
          <p className="truncate text-xs text-slate-500">Đang chọn: <strong className="text-slate-800">{selectedTask.title}</strong></p>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">Dữ liệu minh họa trong Task Hub</span>
      </div>
    </div>
  );
}
