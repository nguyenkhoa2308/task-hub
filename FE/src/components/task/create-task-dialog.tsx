"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { AssigneeSelect } from "@/components/ui/assignee-select";
import { useCreateTask } from "@/hooks/use-task";

// ─── Schema ───────────────────────────────────────────────────────────────────
const taskSchema = z.object({
  title: z.string().min(1, "Tên công việc không được để trống"),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()),
});

export type CreateTaskFormData = z.infer<typeof taskSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface CreateTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultStatus?: string;
  projectMembers?: any[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CreateTaskDialog({
  isOpen,
  onOpenChange,
  projectId,
  defaultStatus = "To Do",
  projectMembers = [],
}: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateTask();

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus,
      priority: "Medium",
      dueDate: "",
      assignees: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: "",
        description: "",
        status: defaultStatus || "To Do",
        priority: "Medium",
        dueDate: "",
        assignees: [],
      });
    }
  }, [isOpen, defaultStatus]);

  const handleClose = (open: boolean) => {
    if (!open) form.reset();
    onOpenChange(open);
  };

  const onSubmit = (values: CreateTaskFormData) => {
    if (!projectId) return;
    mutate(
      {
        title: values.title,
        description: values.description,
        projectId,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate,
        assignees: values.assignees,
      },
      {
        onSuccess: () => {
          toast.success("Tạo công việc thành công!");
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
          form.reset();
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Không thể tạo công việc");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[540px] p-6"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="font-extrabold text-xl text-slate-800">
            Thêm Công Việc Mới
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Điền thông tin chi tiết để khởi tạo task trong dự án của bạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <FieldGroup>
            {/* Title */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1">
                      Tên công việc <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Nhập tên công việc..."
                      className="h-10 rounded-xl border-slate-200"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-1 text-xs" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1">
                      Mô tả chi tiết
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder="Nhập mô tả cho công việc này..."
                      rows={3}
                      className="rounded-xl max-h-28 overflow-y-auto resize-none [field-sizing:fixed] border-slate-200"
                    />
                  </FieldContent>
                </Field>
              )}
            />

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldContent>
                      <FieldLabel className="font-semibold text-slate-700 mb-1">Trạng thái</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "To Do", label: "Cần làm" },
                            { value: "In Progress", label: "Đang làm" },
                            { value: "Done", label: "Hoàn thành" },
                          ].map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldContent>
                      <FieldLabel className="font-semibold text-slate-700 mb-1">Độ ưu tiên</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn độ ưu tiên" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "Low", label: "Thấp" },
                            { value: "Medium", label: "Trung bình" },
                            { value: "High", label: "Cao" },
                          ].map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                )}
              />
            </div>

            {/* Due Date */}
            <Controller
              name="dueDate"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="font-semibold text-slate-700 mb-1">
                      Hạn hoàn thành
                    </FieldLabel>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn hạn hoàn thành..."
                      fontSize={14}
                    />
                  </FieldContent>
                </Field>
              )}
            />

            {/* Assignees */}
            {projectMembers.length > 0 && (
              <Controller
                name="assignees"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldContent>
                      <FieldLabel className="font-semibold text-slate-700 mb-1">
                        Người thực hiện
                      </FieldLabel>
                      <AssigneeSelect
                        value={field.value || []}
                        onChange={field.onChange}
                        members={projectMembers}
                      />
                    </FieldContent>
                  </Field>
                )}
              />
            )}
          </FieldGroup>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="h-10 px-4 font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 px-6 font-bold cursor-pointer"
            >
              {isPending ? "Đang tạo..." : "Thêm Công Việc"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
