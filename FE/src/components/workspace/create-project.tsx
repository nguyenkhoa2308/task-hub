import { useEffect } from "react";
import { projectSchema } from "@/lib/schema";
import { ProjectStatus, type MemberProps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Lock } from "lucide-react";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { useCreateProject } from "@/hooks/use-project";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DatePicker } from "../ui/date-picker";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceMembers?: MemberProps[];
  defaultProjectPrivate?: boolean;
}

export type CreateProjectFormData = z.infer<typeof projectSchema>;

// Map nhãn tiếng Việt cho Trạng thái
const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "Lập kế hoạch",
  [ProjectStatus.IN_PROGRESS]: "Đang thực hiện",
  [ProjectStatus.COMPLETED]: "Hoàn thành",
  [ProjectStatus.ON_HOLD]: "Tạm dừng",
  [ProjectStatus.CANCELLED]: "Đã hủy",
};

// Map nhãn tiếng Việt cho Vai trò thành viên
const ROLE_LABELS: Record<string, string> = {
  manager: "Người quản lý",
  contributor: "Người đóng góp",
  viewer: "Người xem",
};

export const CreateProjectDialog = ({
  isOpen,
  onOpenChange,
  workspaceId,
  workspaceMembers = [],
  defaultProjectPrivate = false,
}: CreateProjectDialogProps) => {
  const queryClient = useQueryClient();
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: ProjectStatus.PLANNING,
      startDate: "",
      dueDate: "",
      members: [],
      tags: "",
      isPrivate: defaultProjectPrivate,
    },
  });
  const { mutate, isPending } = useCreateProject();

  // Tự động reset form sạch vẽ mỗi khi đóng Popup
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        title: "",
        description: "",
        status: ProjectStatus.PLANNING,
        startDate: "",
        dueDate: "",
        members: [],
        tags: "",
        isPrivate: defaultProjectPrivate,
      });
    }
  }, [defaultProjectPrivate, isOpen, form]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  const onSubmit = (values: CreateProjectFormData) => {
    if (!workspaceId) return;

    mutate(
      {
        projectData: values,
        workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Tạo project thành công!");
          queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
          form.reset();
          onOpenChange(false);
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || error?.message || "Đã có lỗi xảy ra";
          toast.error(errorMessage);
          console.log(error);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[560px] p-6"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest('[data-slot="select-content"]') || 
            target.closest('[role="option"]') ||
            target.closest('[data-slot="select-trigger"]') ||
            target.closest('[data-slot="date-picker-popover"]')
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="font-extrabold text-xl text-slate-800">Tạo Project mới</DialogTitle>
          <DialogDescription className="text-slate-500">
            Điền thông tin để khởi tạo dự án mới trong Workspace của bạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <FieldGroup>
            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1.5">
                      Tên Project <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Nhập tên dự án..."
                      aria-invalid={fieldState.invalid}
                      className="h-10 rounded-lg"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-1" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1.5">
                      Mô tả Project
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder="Nhập mô tả chi tiết dự án..."
                      rows={3}
                      className="rounded-lg max-h-28 overflow-y-auto resize-none [field-sizing:fixed]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-1" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Status */}
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel className="font-semibold text-slate-700 mb-1.5">Trạng thái Project</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-10 rounded-lg border-slate-200 bg-white">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="start" className="w-[var(--radix-select-trigger-width)] z-[100]">
                        {Object.values(ProjectStatus).map((status) => (
                          <SelectItem key={status} value={status} className="py-2 cursor-pointer">
                            {PROJECT_STATUS_LABELS[status] || status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-1" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="startDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1.5">Ngày bắt đầu</FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn ngày bắt đầu"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="font-semibold mt-1" />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1.5">Hạn hoàn thành</FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn hạn hoàn thành"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="font-semibold mt-1" />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </div>

            {/* Private Project Toggle */}
            <Controller
              name="isPrivate"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="space-y-0.5 pr-2">
                    <label htmlFor="isPrivate" className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Dự án Riêng tư (Private Project)
                    </label>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Chỉ những thành viên được chọn tham gia mới có quyền xem và truy cập dự án này.
                    </p>
                  </div>
                  <Checkbox
                    id="isPrivate"
                    checked={field.value || false}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                </div>
              )}
            />

            {/* Tags */}
            <Controller
              name="tags"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1.5">
                      Tags <span className="text-slate-400 font-normal text-xs">(Phân cách bằng dấu phẩy)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Frontend, React, Design..."
                      className="h-10 rounded-lg"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-1" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Members Selection */}
            {workspaceMembers.length > 0 && (
              <Controller
                name="members"
                control={form.control}
                render={({ field }) => {
                  const selectedMembers = field.value || [];

                  return (
                    <Field>
                      <FieldContent>
                        <div className="flex items-center justify-between mb-2">
                          <FieldLabel className="font-semibold text-slate-700">
                            Thành viên tham gia
                          </FieldLabel>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                            Đã chọn {selectedMembers.length}
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-56 overflow-y-auto border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
                          {workspaceMembers.map((member) => {
                            const selectedMember = selectedMembers.find(
                              (m) => m.user === member.user._id
                            );

                            return (
                              <div
                                key={member._id || member.user._id}
                                className={`flex items-center justify-between gap-3 p-3 bg-white rounded-xl border transition-all duration-200 ${
                                  selectedMember 
                                    ? "border-blue-300 ring-2 ring-blue-500/10 shadow-xs" 
                                    : "border-slate-200/80 hover:border-slate-300"
                                }`}
                              >
                                {/* Member Checkbox & Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Checkbox
                                    checked={!!selectedMember}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...selectedMembers,
                                          {
                                            user: member.user._id,
                                            role: "contributor",
                                          },
                                        ]);
                                      } else {
                                        field.onChange(
                                          selectedMembers.filter(
                                            (m) => m.user !== member.user._id
                                          )
                                        );
                                      }
                                    }}
                                    id={`member-${member.user._id}`}
                                    className="size-4 rounded-md"
                                  />

                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={member.user.profileImage} />
                                    <AvatarFallback className="text-xs font-semibold">
                                      {member.user.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex flex-col min-w-0">
                                    <label
                                      htmlFor={`member-${member.user._id}`}
                                      className="text-sm font-bold text-slate-800 truncate cursor-pointer"
                                    >
                                      {member.user.name}
                                    </label>
                                    <span className="text-xs text-slate-400 truncate">
                                      {member.user.email}
                                    </span>
                                  </div>
                                </div>

                                {/* Role Selector */}
                                {selectedMember && (
                                  <div className="w-44 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={selectedMember.role}
                                      onValueChange={(role) => {
                                        field.onChange(
                                          selectedMembers.map((m) =>
                                            m.user === member.user._id
                                              ? {
                                                  ...m,
                                                  role: role as
                                                    | "contributor"
                                                    | "manager"
                                                    | "viewer",
                                                }
                                              : m
                                          )
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="h-9 w-full text-xs font-semibold bg-slate-100/80 hover:bg-slate-200/80 border-0 rounded-lg px-3">
                                        <SelectValue placeholder="Chọn vai trò" />
                                      </SelectTrigger>
                                      <SelectContent 
                                        position="popper" 
                                        align="end" 
                                        sideOffset={4}
                                        className="w-[180px] z-[100] p-1 shadow-xl rounded-xl border border-slate-200"
                                      >
                                        <SelectItem value="manager" className="text-xs py-2 font-medium cursor-pointer rounded-lg">
                                          {ROLE_LABELS["manager"]}
                                        </SelectItem>
                                        <SelectItem value="contributor" className="text-xs py-2 font-medium cursor-pointer rounded-lg">
                                          {ROLE_LABELS["contributor"]}
                                        </SelectItem>
                                        <SelectItem value="viewer" className="text-xs py-2 font-medium cursor-pointer rounded-lg">
                                          {ROLE_LABELS["viewer"]}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </FieldContent>
                    </Field>
                  );
                }}
              />
            )}
          </FieldGroup>

          <DialogFooter className="pt-3">
            <Button type="submit" disabled={isPending} className="h-10 px-6 font-bold cursor-pointer">
              {isPending ? "Đang tạo..." : "Tạo Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
