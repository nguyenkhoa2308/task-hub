"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Paperclip,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  UserCheck,
  Edit2,
  Calendar,
  AlertCircle,
  Link as LinkIcon,
  ExternalLink,
  MessageSquare,
  Loader2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AssigneeSelect } from "@/components/ui/assignee-select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateTask, useDeleteTask, useGetTaskById } from "@/hooks/use-task";
import { useGetProjectById } from "@/hooks/use-project";
import { useGetComments, useCreateComment, useDeleteComment } from "@/hooks/use-comment";
import { useGetTaskActivities } from "@/hooks/use-activity";
import { useGetMeQuery } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface TaskDetailModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  projectMembers?: any[];
  refetchTasks?: () => void;
  canEdit?: boolean;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  projectMembers = [],
  refetchTasks,
  canEdit = true,
}: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  const queryClient = useQueryClient();
  const { data: meRaw } = useGetMeQuery();
  const me = (meRaw as any)?.user || (meRaw as any);

  const taskId = task._id || task.id;
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();

  // Editable local state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title || "");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(task.description || "");

  const [status, setStatus] = useState(task.status || "To Do");
  const [priority, setPriority] = useState(task.priority || "Medium");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [assignees, setAssignees] = useState<string[]>(
    Array.isArray(task.assignees)
      ? task.assignees.map((a: any) => a._id || a.id || a)
      : []
  );

  // Attachments State
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; type: "file" | "url" }[]>(
    Array.isArray(task.attachments)
      ? task.attachments.map((att: any, idx: number) => ({
        id: att._id || att.id || String(idx),
        name: att.fileName || att.name || "Link đính kèm",
        url: att.fileUrl || att.url || "",
        type: att.fileType || "url",
      }))
      : []
  );
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlName, setUrlName] = useState("");
  const [urlLink, setUrlLink] = useState("");

  // Fetch fresh task with populated watchers & assignees
  const { data: dbTask } = useGetTaskById(taskId);
  const activeTask = dbTask || task;

  const targetProjectId = typeof activeTask?.project === "object"
    ? (activeTask.project?._id || activeTask.project?.id)
    : activeTask?.project;

  const { data: dbProject } = useGetProjectById(targetProjectId);

  const effectiveProjectMembers = (projectMembers && projectMembers.length > 0)
    ? projectMembers
    : (dbProject?.members || []);

  // Sync state when activeTask is loaded/updated
  useEffect(() => {
    if (activeTask) {
      setTitle(activeTask.title || "");
      setDescription(activeTask.description || "");
      setStatus(activeTask.status || "To Do");
      setPriority(activeTask.priority || "Medium");
      setDueDate(activeTask.dueDate || "");
      if (Array.isArray(activeTask.assignees)) {
        setAssignees(activeTask.assignees.map((a: any) => a._id || a.id || a));
      }
      if (Array.isArray(activeTask.watchers)) {
        setWatchers(activeTask.watchers);
      }
      if (Array.isArray(activeTask.subtasks)) {
        setSubtasks(
          activeTask.subtasks.map((st: any, idx: number) => ({
            id: st._id || st.id || String(idx),
            text: st.title || st.text || "",
            done: st.completed ?? st.done ?? false,
          }))
        );
      }
      if (Array.isArray(activeTask.attachments)) {
        setAttachments(
          activeTask.attachments.map((att: any, idx: number) => ({
            id: att._id || att.id || String(idx),
            name: att.fileName || att.name || "Link đính kèm",
            url: att.fileUrl || att.url || "",
            type: att.fileType || "url",
          }))
        );
      }
    }
  }, [activeTask?._id, activeTask?.updatedAt]);

  // Watchers State
  const [watchers, setWatchers] = useState<any[]>(
    Array.isArray(task.watchers) ? task.watchers : []
  );

  const watchersList = Array.isArray(activeTask?.watchers) && activeTask.watchers.length > 0
    ? activeTask.watchers
    : watchers;

  const isWatching = watchersList.some(
    (w: any) => (w._id || w.id || w) === me?._id
  );

  // Subtasks state
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; done: boolean }[]>(
    Array.isArray(task.subtasks)
      ? task.subtasks.map((st: any, idx: number) => ({
        id: st._id || st.id || String(idx),
        text: st.title || st.text || "",
        done: st.completed ?? st.done ?? false,
      }))
      : []
  );
  const [newSubtask, setNewSubtask] = useState("");

  // Comments & Activities (real DB)
  const [newComment, setNewComment] = useState("");
  const { data: comments = [], isLoading: isLoadingComments } = useGetComments(taskId);
  const { data: activities = [], isLoading: isLoadingActivities } = useGetTaskActivities(taskId);
  const { mutate: createComment, isPending: isSubmitting } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();

  const [isArchived, setIsArchived] = useState(false);

  const handleSaveField = (fieldsToUpdate: Record<string, any>) => {
    if (!canEdit) {
      toast.error("Bạn đang ở chế độ Chỉ xem (Viewer)");
      return;
    }
    if (!taskId) return;
    updateTask(
      { id: taskId, data: fieldsToUpdate },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật công việc");
          queryClient.invalidateQueries({ queryKey: ["task", taskId] });
          queryClient.invalidateQueries({ queryKey: ["task-activities", taskId] });
          queryClient.invalidateQueries({ queryKey: ["task-activities"] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["project"] });
          if (refetchTasks) refetchTasks();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || "Cập nhật thất bại";
          toast.error(message);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!canEdit) {
      toast.error("Bạn đang ở chế độ Chỉ xem (Viewer)");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      deleteTask(taskId, {
        onSuccess: () => {
          toast.success("Đã xóa công việc");
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["project"] });
          if (refetchTasks) refetchTasks();
          onClose();
        },
        onError: () => {
          toast.error("Không thể xóa công việc");
        },
      });
    }
  };

  const handleToggleWatch = () => {
    if (!me?._id) return;
    let updatedWatchers: string[];
    let nextWatchersList: any[];
    if (isWatching) {
      updatedWatchers = watchers
        .map((w: any) => w._id || w.id || w)
        .filter((id: string) => id !== me._id);
      nextWatchersList = watchers.filter((w: any) => (w._id || w.id || w) !== me._id);
    } else {
      updatedWatchers = [
        ...watchers.map((w: any) => w._id || w.id || w),
        me._id,
      ];
      nextWatchersList = [...watchers, me];
    }
    setWatchers(nextWatchersList);
    handleSaveField({ watchers: updatedWatchers });
  };

  const saveSubtasksToDb = (updated: { id: string; text: string; done: boolean }[]) => {
    setSubtasks(updated);
    const subtasksForPayload = updated.map((st) => ({
      title: st.text,
      completed: st.done,
    }));
    handleSaveField({ subtasks: subtasksForPayload });
  };

  const saveAttachmentsToDb = (updated: { id: string; name: string; url: string; type: "file" | "url" }[]) => {
    setAttachments(updated);
    const payload = updated.map((a) => ({
      fileName: a.name,
      fileUrl: a.url,
      fileType: a.type,
    }));
    handleSaveField({ attachments: payload });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const updated = [
      ...subtasks,
      { id: Date.now().toString(), text: newSubtask.trim(), done: false },
    ];
    setNewSubtask("");
    saveSubtasksToDb(updated);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done } : s
    );
    saveSubtasksToDb(updated);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((s) => s.id !== subtaskId);
    saveSubtasksToDb(updated);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createComment(
      { content: newComment.trim(), taskId },
      {
        onSuccess: () => {
          setNewComment("");
        },
        onError: () => {
          toast.error("Không thể gửi bình luận");
        },
      }
    );
  };

  // Helper label priority tiếng Việt
  const getPriorityLabel = (pri: string) => {
    if (pri === "High") return "Độ ưu tiên: Cao";
    if (pri === "Low") return "Độ ưu tiên: Thấp";
    return "Độ ưu tiên: Trung bình";
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
      >

        {/* Top Navbar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 gap-1.5 font-semibold text-slate-600 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Quay lại
            </Button>
            <span className="font-extrabold text-slate-800 text-base">{title || "Chi tiết công việc"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWatch}
              className={`h-8 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer ${isWatching ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600"
                }`}
            >
              <Eye className="size-3.5" />
              {isWatching ? "Đang theo dõi" : "Theo dõi"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsArchived(!isArchived)}
              className={`h-8 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer ${isArchived ? "bg-amber-50 text-amber-600 border-amber-200" : "text-slate-600"
                }`}
            >
              <Archive className="size-3.5" />
              {isArchived ? "Đã lưu trữ" : "Lưu trữ"}
            </Button>
          </div>
        </div>

        {/* Modal Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Info & Form) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header badges & Actions */}
            <div className="flex items-center justify-between gap-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full tracking-wider ${priority === "High" ? "bg-rose-100 text-rose-700" : priority === "Low" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"
                }`}>
                {getPriorityLabel(priority)}
              </span>

              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Select
                    disabled={!canEdit}
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val);
                      handleSaveField({ status: val });
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs font-bold rounded-xl">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">Cần làm</SelectItem>
                      <SelectItem value="In Progress">Đang làm</SelectItem>
                      <SelectItem value="Done">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {canEdit && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-9 px-3 text-xs font-bold rounded-xl gap-1 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa công việc
                  </Button>
                )}
              </div>
            </div>

            {/* Editable Title */}
            <div>
              {isEditingTitle && canEdit ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-bold h-10 rounded-xl"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsEditingTitle(false);
                      handleSaveField({ title });
                    }}
                    className="h-10 px-4 font-bold cursor-pointer"
                  >
                    Lưu
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{title}</h1>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all cursor-pointer"
                    >
                      <Edit2 className="size-4" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Tạo lúc {task.createdAt ? new Date(task.createdAt).toLocaleString("vi-VN") : "gần đây"}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả chi tiết</span>
                {!isEditingDesc && canEdit && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit2 className="size-3" /> Chỉnh sửa
                  </button>
                )}
              </div>

              {isEditingDesc && canEdit ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="rounded-xl resize-none text-sm border-slate-200"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingDesc(false)}>Hủy</Button>
                    <Button size="sm" onClick={() => {
                      setIsEditingDesc(false);
                      handleSaveField({ description });
                    }}>Lưu mô tả</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 text-sm text-slate-700 min-h-[70px]">
                  {description || <span className="text-slate-400 italic">Chưa có mô tả nào</span>}
                </div>
              )}
            </div>

            {/* Assignees */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người thực hiện</span>
              <AssigneeSelect
                disabled={!canEdit}
                value={assignees}
                onChange={(val) => {
                  setAssignees(val);
                  handleSaveField({ assignees: val });
                }}
                members={projectMembers}
              />
            </div>

            {/* Priority & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Độ ưu tiên</span>
                <Select
                  disabled={!canEdit}
                  value={priority}
                  onValueChange={(val) => {
                    setPriority(val);
                    handleSaveField({ priority: val });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Thấp</SelectItem>
                    <SelectItem value="Medium">Trung bình</SelectItem>
                    <SelectItem value="High">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn hoàn thành</span>
                <DatePicker
                  disabled={!canEdit}
                  value={dueDate}
                  onChange={(val) => {
                    setDueDate(val);
                    handleSaveField({ dueDate: val });
                  }}
                  placeholder="Chọn hạn..."
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="size-3.5" /> Tập tin đính kèm
                </span>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    {/* Option 1: File Upload */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachments([
                              ...attachments,
                              {
                                id: Date.now().toString(),
                                name: file.name,
                                url: URL.createObjectURL(file),
                                type: "file",
                              },
                            ]);
                            toast.success(`Đã thêm file: ${file.name}`);
                          }
                        }}
                      />
                      <span className="h-7 px-2.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus className="size-3" /> Tải file lên
                      </span>
                    </label>

                    {/* Option 2: Add via URL */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUrlForm(!showUrlForm)}
                      className="h-7 px-2.5 text-xs font-semibold text-slate-600 rounded-lg gap-1 cursor-pointer"
                    >
                      <LinkIcon className="size-3" /> Thêm đường dẫn Link
                    </Button>
                  </div>
                )}
              </div>

              {/* URL Form Input */}
              {showUrlForm && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      value={urlName}
                      onChange={(e) => setUrlName(e.target.value)}
                      placeholder="Tên file / đính kèm (ví dụ: Thiết kế Figma)"
                      className="h-8 text-xs bg-white rounded-lg"
                    />
                    <Input
                      value={urlLink}
                      onChange={(e) => setUrlLink(e.target.value)}
                      placeholder="Đường dẫn URL (https://...)"
                      className="h-8 text-xs bg-white rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowUrlForm(false);
                        setUrlName("");
                        setUrlLink("");
                      }}
                      className="h-7 text-xs"
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!urlName.trim() || !urlLink.trim()) {
                          toast.error("Vui lòng nhập cả tên và đường dẫn link");
                          return;
                        }
                        const updated = [
                          ...attachments,
                          {
                            id: Date.now().toString(),
                            name: urlName.trim(),
                            url: urlLink.trim(),
                            type: "url" as const,
                          },
                        ];
                        setUrlName("");
                        setUrlLink("");
                        setShowUrlForm(false);
                        saveAttachmentsToDb(updated);
                        toast.success("Đã thêm liên kết đính kèm!");
                      }}
                      className="h-7 text-xs font-bold px-3 cursor-pointer"
                    >
                      Thêm Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Attachments List */}
              {attachments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có tập tin hay liên kết nào</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {att.type === "url" ? (
                          <ExternalLink className="size-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <Paperclip className="size-3.5 text-slate-500 shrink-0" />
                        )}
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-700 hover:text-blue-600 truncate underline-offset-2 hover:underline"
                        >
                          {att.name}
                        </a>
                      </div>

                      <button
                        onClick={() => {
                          const updated = attachments.filter((a) => a.id !== att.id);
                          saveAttachmentsToDb(updated);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Xóa đính kèm"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Công việc phụ (Subtasks)
                </span>
                {subtasks.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500">
                    {subtasks.filter((s) => s.done).length} / {subtasks.length} hoàn thành ({Math.round((subtasks.filter((s) => s.done).length / subtasks.length) * 100)}%)
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((subtasks.filter((s) => s.done).length / subtasks.length) * 100)}%`,
                    }}
                  />
                </div>
              )}

              {subtasks.length > 0 && (
                <div className="space-y-2">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl group transition-all"
                    >
                      <label className="flex items-center gap-2.5 text-sm cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={st.done}
                          onChange={() => handleToggleSubtask(st.id)}
                          className="rounded size-4 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                        <span className={`truncate text-xs font-semibold ${st.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {st.text}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-all cursor-pointer"
                        title="Xoá công việc phụ"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Thêm công việc phụ..."
                  className="h-9 text-xs rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                />
                <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtask.trim()} className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer">
                  Thêm
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-slate-500" />
                <span className="text-sm font-extrabold text-slate-800">Bình luận</span>
                {comments.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                    {comments.length}
                  </span>
                )}
              </div>

              {isLoadingComments ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-5 text-slate-300 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {comments.map((c) => {
                    const isOwner = me?._id === c.author._id || me?.id === c.author._id;
                    const initials = c.author.name
                      ? c.author.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "U";
                    return (
                      <div key={c._id} className="flex gap-2.5 text-xs group">
                        <Avatar className="size-7 shrink-0">
                          <AvatarImage src={c.author.profileImage || c.author.avatarUrl} alt={c.author.name} />
                          <AvatarFallback className="text-[10px] font-semibold">
                            {c.author.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-slate-800 truncate">{c.author.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: vi })}
                              </span>
                              {isOwner && (
                                <button
                                  onClick={() =>
                                    deleteComment(
                                      { commentId: c._id, taskId },
                                      { onError: () => toast.error("Không thể xoá bình luận") }
                                    )
                                  }
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-0.5 rounded cursor-pointer"
                                  title="Xoá bình luận"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-600 whitespace-pre-wrap break-words">{c.text || c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 items-center">
                <Avatar className="size-7 shrink-0">
                  <AvatarImage src={me?.profileImage || me?.avatarUrl} alt={me?.name} />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {me?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2 flex-1">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="h-9 text-sm rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && !isSubmitting && handleAddComment()}
                    disabled={isSubmitting}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="h-9 px-3 cursor-pointer rounded-xl"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Watchers & Activity Log) */}
          <div className="space-y-6">

            {/* Watchers Widget */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Người theo dõi
                </h3>
                {watchersList.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-200/70 text-slate-600 rounded-full">
                    {watchersList.length}
                  </span>
                )}
              </div>

              {watchersList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có người theo dõi công việc này</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {watchersList.map((w: any, idx: number) => {
                    const u = w.user || w;
                    const name = typeof u === 'object' && u.name ? u.name : (u === me?._id || (typeof u === 'string' && me?._id && u === me._id) ? me?.name : "Thành viên");
                    const avatar = typeof u === 'object' ? u.profileImage : (u === me?._id ? me?.profileImage : undefined);
                    return (
                      <div
                        key={typeof u === 'object' ? (u._id || u.id || idx) : (u || idx)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200/60 rounded-xl shadow-2xs"
                      >
                        <Avatar className="size-5 shrink-0">
                          <AvatarImage src={avatar} alt={name} />
                          <AvatarFallback className="text-[9px] font-bold">
                            {name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-slate-700">{name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Timeline Widget */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Lịch sử hoạt động</h3>
                {activities.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-200/70 text-slate-600 rounded-full">
                    {activities.length}
                  </span>
                )}
              </div>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 text-slate-300 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Chưa có lịch sử hoạt động</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activities.map((act) => (
                    <div key={act._id} className="flex gap-2.5 text-xs relative items-start">
                      <Avatar className="size-6 shrink-0 z-10 ring-2 ring-white">
                        <AvatarImage src={act.user?.profileImage} alt={act.user?.name} />
                        <AvatarFallback className="text-[9px] font-semibold">
                          {act.user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-slate-800 truncate">{act.user?.name || "Thành viên"}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">
                            {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        <span className="text-slate-600 text-[11px]">{act.details?.description || act.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
