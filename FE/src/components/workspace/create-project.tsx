"use client";

import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { projectSchema } from "@/lib/schema";
import { useCreateProject } from "@/hooks/use-project";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface CreateProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
}

type ProjectForm = z.infer<typeof projectSchema>;

export function CreateProjectDialog({
    isOpen,
    onOpenChange,
    workspaceId,
}: CreateProjectDialogProps) {
    const queryClient = useQueryClient();
    const form = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const { mutate, isPending } = useCreateProject();

    const onSubmit = (data: ProjectForm) => {
        mutate(
            { ...data, workspaceId },
            {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                    toast.success("Tạo project thành công!");
                    queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
                },
                onError: (error: any) => {
                    const errorMessage = error.message || "Đã có lỗi xảy ra";
                    toast.error(errorMessage);
                },
            }
        );
    };

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (!open) {
            form.reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-bold">Tạo Project mới</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FieldGroup>
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldContent>
                                        <FieldLabel htmlFor={field.name} className="mb-1">
                                            Tên Project
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="text"
                                            placeholder="Tên dự án"
                                            aria-invalid={fieldState.invalid}
                                            className="rounded-md border-input"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                                className="font-semibold mt-2"
                                            />
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
                                        <FieldLabel htmlFor={field.name} className="mb-1">
                                            Mô tả
                                        </FieldLabel>
                                        <Textarea
                                            {...field}
                                            id={field.name}
                                            rows={3}
                                            placeholder="Mô tả dự án (tuỳ chọn)"
                                            aria-invalid={fieldState.invalid}
                                            className="rounded-md border-input"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                                className="font-semibold mt-2"
                                            />
                                        )}
                                    </FieldContent>
                                </Field>
                            )}
                        />
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Đang tạo..." : "Tạo Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
