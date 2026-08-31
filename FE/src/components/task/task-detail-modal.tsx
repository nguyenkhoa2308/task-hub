"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Eye,
  Archive,
  Paperclip,
  Plus,
  Send,
  Edit2,
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
import { useUpdateTask, useDeleteTask, useGetTaskById, useRestoreTask, useUploadTaskAttachment } from "@/hooks/use-task";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskDeleteConfirmDialog } from "./task-delete-confirm-dialog";
// import { useGetProjectById } from "@/hooks/use-project";
import { useGetComments, useCreateComment, useDeleteComment, useGetMentionCandidates } from "@/hooks/use-comment";
import { useGetTaskActivities } from "@/hooks/use-activity";
import { useCommentSSE } from "@/hooks/use-comment-sse";
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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: meRaw } = useGetMeQuery();
  const me = (meRaw as any)?.user || (meRaw as any);

  const taskId = task?._id || task?.id || "";
  useCommentSSE(taskId, isOpen);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { mutate: restoreTask } = useRestoreTask();

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"comments" | "activity">("comments");
  const [mobileTab, setMobileTab] = useState<"details" | "comments" | "activity">("details");
  const [commentsPortalTarget, setCommentsPortalTarget] = useState<HTMLDivElement | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<Record<string, number>>({});

  // Editable local state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task?.title || "");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(task?.description || "");

  const [status, setStatus] = useState(task?.status || "To Do");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [startDate, setStartDate] = useState(task?.startDate || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [assignees, setAssignees] = useState<string[]>(
    Array.isArray(task?.assignees)
      ? task.assignees.map((a: any) => a._id || a.id || a)
      : []
  );

  // Attachments State
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; type: "file" | "url"; storageKey?: string; fileType?: string; fileSize?: number }[]>(
    Array.isArray(task?.attachments)
      ? task.attachments.map((att: any, idx: number) => ({
        id: att._id || att.id || String(idx),
        name: att.fileName || att.name || "Link đính kèm",
        url: att.fileUrl || att.url || "",
        type: att.fileType === "url" ? "url" : "file",
        storageKey: att.storageKey,
        fileType: att.fileType,
        fileSize: att.fileSize,
      }))
      : []
  );
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlName, setUrlName] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const { mutateAsync: uploadAttachment, isPending: isUploadingAttachment } = useUploadTaskAttachment();

  // Fetch fresh task with populated watchers & assignees
  const { data: dbTask } = useGetTaskById(taskId, isOpen);
  const activeTask = dbTask || task;

  // const targetProjectId = typeof activeTask?.project === "object"
  //   ? (activeTask.project?._id || activeTask.project?.id)
  //   : activeTask?.project;

  // const { data: dbProject } = useGetProjectById(targetProjectId);

  // const effectiveProjectMembers = (projectMembers && projectMembers.length > 0)
  //   ? projectMembers
  //   : (dbProject?.members || []);

  // Watchers State
  const [watchers, setWatchers] = useState<any[]>(
    Array.isArray(task?.watchers) ? task.watchers : []
  );

  const watchersList = Array.isArray(activeTask?.watchers) && activeTask.watchers.length > 0
    ? activeTask.watchers
    : watchers;

  const isWatching = watchersList.some(
    (w: any) => (w._id || w.id || w) === me?._id
  );

  // Subtasks state
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; done: boolean }[]>(
    Array.isArray(task?.subtasks)
      ? task.subtasks.map((st: any, idx: number) => ({
        id: st._id || st.id || String(idx),
        text: st.title || st.text || "",
        done: st.completed ?? st.done ?? false,
      }))
      : []
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [subtaskPendingDelete, setSubtaskPendingDelete] = useState<{ id: string; text: string } | null>(null);

  // Comments & Activities (real DB)
  const [newComment, setNewComment] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const { data: mentionableMembers = [] } = useGetMentionCandidates(taskId, isOpen);
  const {
    data: comments = [],
    total: totalComments,
    isLoading: isLoadingComments,
    hasNextPage: hasMoreComments,
    fetchNextPage: loadMoreComments,
    isFetchingNextPage: isLoadingMoreComments,
  } = useGetComments(taskId, isOpen);
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    hasNextPage: hasMoreActivities,
    fetchNextPage: loadMoreActivities,
    isFetchingNextPage: isLoadingMoreActivities,
  } = useGetTaskActivities(taskId, isOpen);
  const { mutate: createComment, isPending: isSubmitting } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();

  const [isArchived, setIsArchived] = useState(Boolean(task?.isArchived));

  const focusComment = (commentId: string, rootCommentId?: string) => {
    if (rootCommentId) {
      const thread = comments.find((comment) => comment._id === rootCommentId);
      setVisibleReplyCounts((current) => ({
        ...current,
        [rootCommentId]: Math.max(current[rootCommentId] || 0, thread?.replies?.length || 0),
      }));
    }
    setHighlightedCommentId(commentId);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`comment-${commentId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    });
    window.setTimeout(() => {
      setHighlightedCommentId((current) => current === commentId ? null : current);
    }, 2600);
  };

  const collapseReplyThread = (rootCommentId: string) => {
    setVisibleReplyCounts((current) => ({ ...current, [rootCommentId]: 0 }));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`comment-${rootCommentId}`)?.scrollIntoView({
          behavior: "auto",
          block: "center",
        });
      });
    });
  };

  // Sync editable state after the fresh task query returns.
  useEffect(() => {
    if (!activeTask) return;
    setTitle(activeTask.title || "");
    setDescription(activeTask.description || "");
    setStatus(activeTask.status || "To Do");
    setPriority(activeTask.priority || "Medium");
    setStartDate(activeTask.startDate || "");
    setDueDate(activeTask.dueDate || "");
    setIsArchived(Boolean(activeTask.isArchived));
    if (Array.isArray(activeTask.assignees)) {
      setAssignees(activeTask.assignees.map((a: any) => a._id || a.id || a));
    }
    if (Array.isArray(activeTask.watchers)) setWatchers(activeTask.watchers);
    if (Array.isArray(activeTask.subtasks)) {
      setSubtasks(activeTask.subtasks.map((st: any, idx: number) => ({
        id: st._id || st.id || String(idx),
        text: st.title || st.text || "",
        done: st.completed ?? st.done ?? false,
      })));
    }
    if (Array.isArray(activeTask.attachments)) {
      setAttachments(activeTask.attachments.map((att: any, idx: number) => ({
        id: att._id || att.id || String(idx),
        name: att.fileName || att.name || "Link đính kèm",
        url: att.fileUrl || att.url || "",
        type: att.fileType === "url" ? "url" : "file",
        storageKey: att.storageKey,
        fileType: att.fileType,
        fileSize: att.fileSize,
      })));
    }
  }, [activeTask]);

  if (!isOpen || !task) return null;

  const handleToggleArchive = () => {
    if (!canEdit || !taskId) return;
    const nextValue = !isArchived;
    updateTask(
      { id: taskId, data: { isArchived: nextValue } },
      {
        onSuccess: () => {
          setIsArchived(nextValue);
          toast.success(nextValue ? "Đã lưu trữ công việc" : "Đã đưa công việc trở lại");
          queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          refetchTasks?.();
        },
        onError: () => toast.error("Không thể cập nhật trạng thái lưu trữ"),
      },
    );
  };

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
    setIsConfirmDeleteOpen(true);
  };

  const executeDelete = () => {
    deleteTask(taskId, {
      onSuccess: () => {
        toast.success("Đã chuyển công việc vào thùng rác", {
          duration: 8000,
          action: {
            label: "Hoàn tác",
            onClick: () => restoreTask(taskId, {
              onSuccess: () => {
                toast.success("Đã khôi phục công việc");
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
                queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
                if (refetchTasks) refetchTasks();
              },
            }),
          },
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project"] });
        if (refetchTasks) refetchTasks();
        setIsConfirmDeleteOpen(false);
        onClose();
      },
      onError: () => {
        toast.error("Không thể xóa công việc");
      },
    });
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

  const saveAttachmentsToDb = (updated: { id: string; name: string; url: string; type: "file" | "url"; storageKey?: string; fileType?: string; fileSize?: number }[]) => {
    setAttachments(updated);
    const payload = updated.map((a) => ({
      _id: a.id,
      fileName: a.name,
      fileUrl: a.url,
      fileType: a.fileType || a.type,
      storageKey: a.storageKey,
      fileSize: a.fileSize,
    }));
    handleSaveField({ attachments: payload });
  };

  const handleAddSubtask = () => {
    if (!canEdit || !newSubtask.trim()) return;
    const updated = [
      ...subtasks,
      { id: Date.now().toString(), text: newSubtask.trim(), done: false },
    ];
    setNewSubtask("");
    saveSubtasksToDb(updated);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!canEdit) return;
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done } : s
    );
    saveSubtasksToDb(updated);
  };

  const handleDeleteSubtask = () => {
    if (!canEdit || !subtaskPendingDelete) return;
    const updated = subtasks.filter((subtask) => subtask.id !== subtaskPendingDelete.id);
    saveSubtasksToDb(updated);
    setSubtaskPendingDelete(null);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentContent = newComment.trim();
    const leadingWhitespace = newComment.length - newComment.trimStart().length;
    const mentions = mentionedUsers.flatMap((user) => {
      const token = `@${user.name}`;
      const occurrences: Array<{ user: string; offset: number; length: number }> = [];
      let searchFrom = 0;
      while (searchFrom < newComment.length) {
        const originalOffset = newComment.indexOf(token, searchFrom);
        if (originalOffset < 0) break;
        const offset = originalOffset - leadingWhitespace;
        if (offset >= 0 && commentContent.slice(offset, offset + token.length) === token) {
          occurrences.push({ user: user.id, offset, length: token.length });
        }
        searchFrom = originalOffset + token.length;
      }
      return occurrences;
    });
    createComment(
      { content: commentContent, taskId, mentions, parentCommentId: replyingTo?.id },
      {
        onSuccess: () => {
          setNewComment("");
          setMentionedUsers([]);
          setReplyingTo(null);
        },
        onError: () => {
          toast.error("Không thể gửi bình luận");
        },
      }
    );
  };

  const mentionMatch = newComment.match(/(?:^|\s)@([^@\s]*)$/);
  const mentionQuery = mentionMatch?.[1]?.toLocaleLowerCase("vi") || "";
  const mentionCandidates = mentionMatch
    ? (mentionableMembers.length > 0 ? mentionableMembers : projectMembers)
      .map((member: any) => member?.user || member)
      .filter((member: any) => member && typeof member === "object" && (member._id || member.id) && member.name)
      .filter((member: any) => member.name.toLocaleLowerCase("vi").includes(mentionQuery))
      .slice(0, 6)
    : [];

  const selectMention = (member: any) => {
    const atIndex = newComment.lastIndexOf("@");
    if (atIndex < 0) return;
    const id = member._id || member.id;
    setNewComment(`${newComment.slice(0, atIndex)}@${member.name} `);
    setMentionedUsers((current) =>
      current.some((item) => item.id === id)
        ? current
        : [...current, { id, name: member.name }],
    );
  };

  const renderCommentText = (comment: any) => {
    const text = comment.text || comment.content || "";
    const validMentions = (comment.mentions || [])
      .filter((mention: any) => Number.isInteger(mention.offset) && mention.length > 0)
      .sort((a: any, b: any) => a.offset - b.offset);
    if (validMentions.length === 0) return text;

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    validMentions.forEach((mention: any, index: number) => {
      if (mention.offset < cursor || mention.offset >= text.length) return;
      if (mention.offset > cursor) parts.push(text.slice(cursor, mention.offset));
      parts.push(
        <span key={`${mention.offset}-${index}`} className="rounded bg-blue-50 px-0.5 font-semibold text-blue-700">
          {text.slice(mention.offset, mention.offset + mention.length)}
        </span>,
      );
      cursor = mention.offset + mention.length;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  };

  useEffect(() => {
    const commentId = searchParams.get("commentId");
    if (!isOpen || !commentId) return;
    setRightTab("comments");
    setMobileTab("comments");
    const found = comments.some((comment) =>
      comment._id === commentId || comment.replies?.some((reply) => reply._id === commentId),
    );
    if (!found) {
      if (hasMoreComments && !isLoadingMoreComments) loadMoreComments();
      return;
    }
    setHighlightedCommentId(commentId);
    const frame = requestAnimationFrame(() => {
      document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = window.setTimeout(() => setHighlightedCommentId(null), 2600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [comments, hasMoreComments, isLoadingMoreComments, isOpen, loadMoreComments, searchParams]);

  // Helper label priority tiếng Việt
  const getPriorityLabel = (pri: string) => {
    if (pri === "High") return "Độ ưu tiên: Cao";
    if (pri === "Low") return "Độ ưu tiên: Thấp";
    return "Độ ưu tiên: Trung bình";
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-0 backdrop-blur-xs animate-in fade-in duration-200 lg:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-dvh w-full max-w-6xl flex-col overflow-hidden border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right-full duration-300 lg:h-auto lg:max-h-[92vh] lg:rounded-2xl lg:border lg:slide-in-from-right-0"
      >

        {/* Top Navbar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 px-3 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 gap-1.5 font-semibold text-slate-600 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </Button>
            <span className="truncate text-sm font-extrabold text-slate-800 sm:text-base">{title || "Chi tiết công việc"}</span>
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
              <span className="hidden sm:inline">{isWatching ? "Đang theo dõi" : "Theo dõi"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              disabled={!canEdit || isUpdating}
              className={`h-8 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer ${isArchived ? "bg-amber-50 text-amber-600 border-amber-200" : "text-slate-600"
                }`}
            >
              <Archive className="size-3.5" />
              <span className="hidden sm:inline">{isArchived ? "Đã lưu trữ" : "Lưu trữ"}</span>
            </Button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white p-1 lg:hidden">
          {([
            { id: "details", label: "Chi tiết" },
            { id: "comments", label: `Bình luận${totalComments > 0 ? ` (${totalComments > 99 ? "99+" : totalComments})` : ""}` },
            { id: "activity", label: "Hoạt động" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMobileTab(tab.id);
                if (tab.id !== "details") setRightTab(tab.id);
              }}
              className={`rounded-lg px-1 py-2.5 text-xs font-bold transition-colors ${mobileTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Main Content Grid */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:gap-8">

          {/* Left Column (Main Info & Form) */}
          <div className={`space-y-6 ${mobileTab !== "details" ? "hidden lg:block" : ""}`}>

            {/* Header badges & Actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <span className={`order-2 w-fit shrink-0 whitespace-nowrap text-xs font-bold px-3 py-1 rounded-full tracking-wider lg:order-1 ${priority === "High" ? "bg-rose-100 text-rose-700" : priority === "Low" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"
                }`}>
                {getPriorityLabel(priority)}
              </span>

              <div className="order-1 flex w-full min-w-0 items-center justify-between gap-3 lg:order-2 lg:w-auto">
                <div className="w-36 min-w-0">
                  <Select
                    disabled={!canEdit}
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val);
                      handleSaveField({ status: val });
                    }}
                  >
                    <SelectTrigger className="h-9 whitespace-nowrap rounded-xl text-xs font-bold">
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
                    className="h-9 shrink-0 px-3 text-xs font-bold rounded-xl gap-1 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">Xóa công việc</span>
                    <span className="sm:hidden">Xóa</span>
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

            {/* Priority & Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày bắt đầu</span>
                <DatePicker
                  disabled={!canEdit}
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    handleSaveField({ startDate: val });
                  }}
                  placeholder="Chọn ngày..."
                />
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
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Paperclip className="size-3.5" /> Tập tin đính kèm
                </span>

                {canEdit && (
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                    {/* Option 1: File Upload */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        disabled={isUploadingAttachment}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const saved = await uploadAttachment({ taskId, file });
                              setAttachments((current) => [...current, {
                                id: saved._id,
                                name: saved.fileName,
                                url: saved.fileUrl,
                                type: "file",
                                storageKey: saved.storageKey,
                                fileType: saved.fileType,
                                fileSize: saved.fileSize,
                              }]);
                              toast.success(`Đã tải lên: ${file.name}`);
                            } catch (error: any) {
                              toast.error(error.message || "Không thể tải tệp lên");
                            } finally {
                              e.target.value = "";
                            }
                          }
                        }}
                      />
                      <span className="flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border border-blue-100 bg-blue-50 px-2.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100">
                        {isUploadingAttachment ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />} {isUploadingAttachment ? "Đang tải..." : "Tải file lên"}
                      </span>
                    </label>

                    {/* Option 2: Add via URL */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUrlForm(!showUrlForm)}
                      className="h-8 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-slate-600 gap-1 cursor-pointer"
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
                <p className="text-sm text-slate-400 italic">Chưa có tập tin hay liên kết nào</p>
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
                          href={att.url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2308"}${att.url}` : att.url}
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
                  Công việc phụ
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
                  {canEdit && <div className="flex gap-2">
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
                  </div>}

                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl group transition-all"
                    >
                      <label className="flex items-center gap-2.5 text-sm cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={st.done}
                          disabled={!canEdit}
                          onChange={() => handleToggleSubtask(st.id)}
                          className="rounded size-4 text-blue-600 focus:ring-blue-500/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className={`truncate text-sm font-semibold ${st.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {st.text}
                        </span>
                      </label>
                      {canEdit && <button
                        onClick={() => setSubtaskPendingDelete({ id: st.id, text: st.text })}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-all cursor-pointer"
                        title="Xoá công việc phụ"
                      >
                        <Trash2 className="size-3.5" />
                      </button>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            {commentsPortalTarget && createPortal(<div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-slate-500" />
                <span className="text-sm font-extrabold text-slate-800">Bình luận</span>
                {totalComments > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                    {totalComments > 99 ? "99+" : totalComments}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700">
                    <span>Đang trả lời <strong>{replyingTo.name}</strong></span>
                    <button type="button" className="font-semibold hover:text-blue-900" onClick={() => setReplyingTo(null)}>Hủy</button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage src={me?.profileImage || me?.avatarUrl} alt={me?.name} />
                    <AvatarFallback className="text-[10px] font-semibold">{me?.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="relative flex flex-1 gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? `Trả lời ${replyingTo.name}...` : "Viết bình luận, gõ @ để nhắc thành viên..."}
                      className="h-9 rounded-xl text-sm"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" || isSubmitting) return;
                        e.preventDefault();
                        if (mentionCandidates.length > 0) selectMention(mentionCandidates[0]);
                        else handleAddComment();
                      }}
                      disabled={isSubmitting}
                    />
                    {mentionCandidates.length > 0 && (
                      <div className="absolute left-0 top-11 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Nhắc đến thành viên</p>
                        {mentionCandidates.map((member: any) => {
                          const id = member._id || member.id;
                          return (
                            <button key={id} type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-50" onMouseDown={(event) => event.preventDefault()} onClick={() => selectMention(member)}>
                              <Avatar className="size-7">
                                <AvatarImage src={member.profileImage || member.avatarUrl} alt={member.name} />
                                <AvatarFallback className="text-[10px] font-bold">{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-slate-800">{member.name}</span>
                                {member.email && <span className="block truncate text-[10px] text-slate-400">{member.email}</span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting} className="h-9 cursor-pointer rounded-xl px-3">
                      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {isLoadingComments ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-5 text-slate-300 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              ) : (
                <div className="space-y-3 pr-1 lg:max-h-[320px] lg:overflow-y-auto">
                  {comments.map((c) => {
                    const isOwner = me?._id === c.author._id || me?.id === c.author._id;
                    const initials = c.author.name
                      ? c.author.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "U";
                    const replies = Array.isArray(c.replies) ? c.replies : [];
                    const visibleReplyCount = Math.min(visibleReplyCounts[c._id] || 0, replies.length);
                    const visibleReplies = replies.slice(0, visibleReplyCount);
                    const hiddenReplyCount = replies.length - visibleReplyCount;
                    return (
                      <div id={`comment-${c._id}`} key={c._id} className={`flex gap-2.5 rounded-xl text-sm group transition-colors ${highlightedCommentId === c._id ? "bg-amber-50 ring-1 ring-inset ring-amber-300" : ""}`}>
                        <Avatar className="size-7 shrink-0">
                          <AvatarImage src={c.author.profileImage || c.author.avatarUrl} alt={c.author.name} />
                          <AvatarFallback className="text-[10px] font-semibold">
                            {c.author.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex-1 min-w-0">
                          <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="min-w-0 font-bold text-slate-800">{c.author.name}</span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="text-xs text-slate-400">
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
                          <p className="text-slate-600 whitespace-pre-wrap break-words">{renderCommentText(c)}</p>
                          <button
                            type="button"
                            className="mt-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
                            onClick={() => setReplyingTo({ id: c._id, name: c.author.name })}
                          >
                            Trả lời
                          </button>
                          {Array.isArray(c.replies) && c.replies.length > 0 && (
                            <div className="mt-2.5 space-y-2 border-l-2 border-slate-200 pl-3">
                              {visibleReplyCount === 0 && (
                                <button
                                  type="button"
                                  className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                  onClick={() => setVisibleReplyCounts((current) => ({
                                    ...current,
                                    [c._id]: Math.min(5, replies.length),
                                  }))}
                                >
                                  Xem {replies.length} câu trả lời
                                </button>
                              )}
                              {visibleReplies.map((reply) => {
                                const canDeleteReply = me?._id === reply.author._id || me?.id === reply.author._id;
                                const replyTarget = reply.replyToComment && typeof reply.replyToComment !== "string"
                                  ? reply.replyToComment
                                  : null;
                                return (
                                  <div id={`comment-${reply._id}`} key={reply._id} className={`flex gap-2 rounded-lg bg-white p-2 transition-colors ${highlightedCommentId === reply._id ? "bg-amber-50 ring-1 ring-inset ring-amber-300" : ""}`}>
                                    <Avatar className="size-6 shrink-0">
                                      <AvatarImage src={reply.author.profileImage || reply.author.avatarUrl} alt={reply.author.name} />
                                      <AvatarFallback className="text-[9px] font-semibold">{reply.author.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                       <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                                         <span className="min-w-0 text-sm font-bold text-slate-800">{reply.author.name}</span>
                                        <span className="shrink-0 text-[10px] text-slate-400">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: vi })}</span>
                                      </div>
                                      {replyTarget && (
                                        <button
                                          type="button"
                                          className="mt-1 block w-full min-w-0 rounded-md border-l-2 border-blue-300 bg-slate-50 px-2 py-1 text-left transition-colors hover:bg-blue-50"
                                          onClick={() => focusComment(replyTarget._id, c._id)}
                                          title="Đi tới bình luận được trả lời"
                                        >
                                          <p className="truncate text-xs font-semibold text-blue-700">Trả lời {replyTarget.author?.name || "thành viên"}</p>
                                          <p className="truncate text-xs text-slate-500">{replyTarget.text}</p>
                                        </button>
                                      )}
                                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{renderCommentText(reply)}</p>
                                      <div className="mt-1 flex items-center gap-3 text-xs">
                                        <button type="button" className="font-semibold text-slate-400 hover:text-blue-600" onClick={() => setReplyingTo({ id: reply._id, name: reply.author.name })}>Trả lời</button>
                                        {canDeleteReply && (
                                          <button type="button" className="font-semibold text-slate-400 hover:text-rose-500" onClick={() => deleteComment({ commentId: reply._id, taskId }, { onError: () => toast.error("Không thể xoá phản hồi") })}>Xoá</button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {visibleReplyCount > 0 && hiddenReplyCount > 0 && (
                                <button
                                  type="button"
                                  className="text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                                  onClick={() => setVisibleReplyCounts((current) => ({
                                    ...current,
                                    [c._id]: Math.min((current[c._id] || 0) + 5, replies.length),
                                  }))}
                                >
                                  Xem thêm {Math.min(5, hiddenReplyCount)} câu trả lời
                                </button>
                              )}
                              {visibleReplyCount > 0 && (
                                <button
                                  type="button"
                                  className="text-[13px] font-semibold text-slate-500 hover:text-blue-600 cursor-pointer"
                                  onClick={() => collapseReplyThread(c._id)}
                                >
                                  Ẩn câu trả lời
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {hasMoreComments && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      disabled={isLoadingMoreComments}
                      onClick={() => loadMoreComments()}
                    >
                      {isLoadingMoreComments && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                      Tải bình luận cũ hơn
                    </Button>
                  )}
                </div>
              )}

              {false && (<div className="flex gap-2 items-center">
                <Avatar className="size-7 shrink-0">
                  <AvatarImage src={me?.profileImage || me?.avatarUrl} alt={me?.name} />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {me?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="relative flex gap-2 flex-1">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận, gõ @ để nhắc thành viên..."
                    className="h-9 text-sm rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" || isSubmitting) return;
                      e.preventDefault();
                      if (mentionCandidates.length > 0) selectMention(mentionCandidates[0]);
                      else handleAddComment();
                    }}
                    disabled={isSubmitting}
                  />
                  {mentionCandidates.length > 0 && (
                    <div className="absolute bottom-11 left-0 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                      <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Nhắc đến thành viên</p>
                      {mentionCandidates.map((member: any) => {
                        const id = member._id || member.id;
                        return (
                          <button
                            key={id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectMention(member)}
                          >
                            <Avatar className="size-7">
                              <AvatarImage src={member.profileImage || member.avatarUrl} alt={member.name} />
                              <AvatarFallback className="text-[10px] font-bold">{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-slate-800">{member.name}</span>
                              {member.email && <span className="block truncate text-[10px] text-slate-400">{member.email}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="h-9 px-3 cursor-pointer rounded-xl"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </div>)}
            </div>, commentsPortalTarget)}

          </div>

          {/* Right Column (Watchers & Activity Log) */}
          <div className="space-y-6">

            {/* Watchers Widget */}
            <div className={`space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 ${mobileTab !== "details" ? "hidden lg:block" : ""}`}>
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

            <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white ${mobileTab === "details" ? "hidden lg:block" : ""}`}>
              <div className="hidden grid-cols-2 border-b border-slate-200 bg-slate-50 p-1 lg:grid">
                <button type="button" onClick={() => setRightTab("comments")} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${rightTab === "comments" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  Bình luận {totalComments > 0 ? `(${totalComments > 99 ? "99+" : totalComments})` : ""}
                </button>
                <button type="button" onClick={() => setRightTab("activity")} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${rightTab === "activity" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  Hoạt động {activities.length > 0 ? `(${activities.length})` : ""}
                </button>
              </div>
              {rightTab === "comments" && <div ref={setCommentsPortalTarget} className="p-4" />}

              {/* Activity Timeline Widget */}
              {rightTab === "activity" && <div className="space-y-3 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Lịch sử hoạt động</h3>
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
                  <p className="py-4 text-center text-sm italic text-slate-400">Chưa có lịch sử hoạt động</p>
                ) : (
                  <div className="relative space-y-3 pr-1 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-0.5 before:bg-slate-200 lg:max-h-[320px] lg:overflow-y-auto">
                    {activities.map((act) => (
                      <div key={act._id} className="relative flex items-start gap-2.5 text-sm">
                        <Avatar className="size-6 shrink-0 z-10 ring-2 ring-white">
                          <AvatarImage src={act.user?.profileImage} alt={act.user?.name} />
                          <AvatarFallback className="text-[9px] font-semibold">
                            {act.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-slate-800 truncate">{act.user?.name || "Thành viên"}</span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                          <span className="text-sm leading-5 text-slate-600">{act.details?.description || act.action}</span>
                        </div>
                      </div>
                    ))}
                    {hasMoreActivities && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="relative z-10 w-full bg-white text-xs"
                        disabled={isLoadingMoreActivities}
                        onClick={() => loadMoreActivities()}
                      >
                        {isLoadingMoreActivities && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                        Tải hoạt động cũ hơn
                      </Button>
                    )}
                  </div>
                )}
              </div>}
            </div>

          </div>

        </div>

      </div>

      <TaskDeleteConfirmDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={executeDelete}
        isDeleting={isDeleting}
      />
      <Dialog
        open={Boolean(subtaskPendingDelete)}
        onOpenChange={(open) => { if (!open) setSubtaskPendingDelete(null); }}
      >
        <DialogContent
          className="rounded-2xl border border-slate-200 bg-white sm:max-w-md"
          onClick={(event) => event.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900">Xoá công việc phụ?</DialogTitle>
            <DialogDescription className="leading-6 text-slate-500">
              Bạn có chắc muốn xoá <strong className="font-semibold text-slate-800">“{subtaskPendingDelete?.text}”</strong>? Bạn sẽ phải tạo lại nếu xoá nhầm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" onClick={() => setSubtaskPendingDelete(null)}>Huỷ</Button>
            <Button variant="destructive" onClick={handleDeleteSubtask} className="font-bold">
              <Trash2 className="mr-2 size-4" />
              Xoá công việc phụ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
