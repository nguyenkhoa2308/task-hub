"use client"

import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { workspaceSchema } from "@/lib/schema";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { useCreateWorkspace } from "@/hooks/use-workspace";
import { useQueryClient } from "@tanstack/react-query";

interface CreateWorkspaceProps {
  isCreateWorkSpace: boolean;
  setIsCreateWorkSpace: (isCreateWorkSpace: boolean) => void;
}

export const colorOptions = [
  "#FF5733", // Red-Orange
  "#33C1FF", // Blue
  "#28A745", // Green
  "#FFC300", // Yellow
  "#8E44AD", // Purple
  "#E67E22", // Orange
  "#2ECC71", // Light Green
  "#34495E", // Navy
];

export type WorkspaceForm = z.infer<typeof workspaceSchema>

export default function CreateWorkspace({
  isCreateWorkSpace,
  setIsCreateWorkSpace,
}: CreateWorkspaceProps) {
  const form = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      color: colorOptions[0],
      description: "",
    },
  })
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useCreateWorkspace();

  const onSubmit = (data: WorkspaceForm) => {
    mutate(data, {
      onSuccess: (data: any) => {
        form.reset();
        setIsCreateWorkSpace(false);
        toast.success("Tạo workspace thành công");
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        router.push(`/workspaces/${data._id}`);
      },
      onError: (error: any) => {
        const errorMessage = error.message || "Đã có lỗi xảy ra";
        toast.error(errorMessage)
      }
    })
  }

  const handleOpenChange = (open: boolean) => {
    setIsCreateWorkSpace(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={isCreateWorkSpace} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold">Tạo Workspace</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="mb-1">Tên Workspace</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Tên không gian làm việc"
                      aria-invalid={fieldState.invalid}
                      className="rounded-md border-input"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-2" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="mb-1">Mô Tả</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      rows={3}
                      placeholder="Mô tả không gian làm việc"
                      aria-invalid={fieldState.invalid}
                      className="rounded-md border-input"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-2" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="color"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className="mb-2">Màu Sắc</FieldLabel>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-300 hover:opacity-100 hover:scale-110 ${field.value === color ? "ring-2 ring-blue-500 ring-offset-2 scale-110" : "ring-2 opacity-50 ring-primary"}`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="font-semibold mt-2" />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
