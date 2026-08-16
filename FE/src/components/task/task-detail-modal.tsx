"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Eye,
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
import { useUpdateTask, useDeleteTask } from "@/hooks/use-task";

interface TaskDetailModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  projectMembers?: any[];
  refetchTasks?: () => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  projectMembers = [],
  refetchTasks,
}: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  const queryClient = useQueryClient();
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
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; type: "file" | "url" }[]>([]);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlName, setUrlName] = useState("");
  const [urlLink, setUrlLink] = useState("");

  // Subtasks & Comments state
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const [comments, setComments] = useState<{ id: string; user: string; text: string; time: string }[]>([]);
  const [newComment, setNewComment] = useState("");

  const [isWatching, setIsWatching] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  const handleSaveField = (fieldsToUpdate: Record<string, any>) => {
    if (!taskId) return;
    updateTask(
      { id: taskId, data: fieldsToUpdate },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật công việc");
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["project"] });
          if (refetchTasks) refetchTasks();
        },
        onError: () => {
          toast.error("Cập nhật thất bại");
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      deleteTask(taskId, {
        onSuccess: () => {
          toast.success("Đã xóa công việc");
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

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString(), text: newSubtask.trim(), done: false }]);
    setNewSubtask("");
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      { id: Date.now().toString(), user: "Bạn", text: newComment.trim(), time: "Vừa xong" },
    ]);
    setNewComment("");
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
              onClick={() => setIsWatching(!isWatching)}
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
              </div>
            </div>

            {/* Editable Title */}
            <div>
              {isEditingTitle ? (
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
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all cursor-pointer"
                  >
                    <Edit2 className="size-4" />
                  </button>
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
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit2 className="size-3" /> Chỉnh sửa
                  </button>
                )}
              </div>

              {isEditingDesc ? (
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
                        setAttachments([
                          ...attachments,
                          {
                            id: Date.now().toString(),
                            name: urlName.trim(),
                            url: urlLink.trim(),
                            type: "url",
                          },
                        ]);
                        setUrlName("");
                        setUrlLink("");
                        setShowUrlForm(false);
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
                        onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
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
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công việc phụ (Subtasks)</span>
              {subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={() => {
                          setSubtasks(subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s));
                        }}
                        className="rounded size-4 text-blue-600"
                      />
                      <span className={st.done ? "line-through text-slate-400" : "text-slate-700"}>{st.text}</span>
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
                <Button size="sm" onClick={handleAddSubtask} className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer">
                  Thêm
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-sm font-extrabold text-slate-800">Bình luận</span>

              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">Chưa có bình luận nào</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5 text-xs">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-[9px]">U</AvatarFallback>
                      </Avatar>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex-1">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>{c.user}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{c.time}</span>
                        </div>
                        <p className="text-slate-600">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="h-10 text-sm rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button size="sm" onClick={handleAddComment} className="h-10 px-4 cursor-pointer rounded-xl">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>

          </div>

          {/* Right Column (Watchers & Activity Log) */}
          <div className="space-y-6">

            {/* Watchers Widget */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Người theo dõi</h3>
              <p className="text-xs text-slate-400 italic">Chưa có người theo dõi</p>
            </div>

            {/* Activity Timeline Widget */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Lịch sử hoạt động</h3>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="flex gap-2.5 text-xs relative">
                  <div className="size-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 z-10 font-bold text-[10px]">
                    K
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-700">Thành viên đã cập nhật công việc</span>
                    <span className="text-[10px] text-slate-400">Vừa xong</span>
                  </div>
                </div>

                <div className="flex gap-2.5 text-xs relative">
                  <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 z-10 font-bold text-[10px]">
                    ✓
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-700">Công việc được khởi tạo</span>
                    <span className="text-[10px] text-slate-400">Hôm nay</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl h-8 cursor-pointer">
                Xem thêm
              </Button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
