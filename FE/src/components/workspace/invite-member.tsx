"use client";

import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { inviteMemberSchema } from "@/lib/schema";
import { useInviteMember } from "@/hooks/use-workspace";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { UserPlus } from "lucide-react";

interface InviteMemberDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
}

type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

export function InviteMemberDialog({
    isOpen,
    onOpenChange,
    workspaceId,
}: InviteMemberDialogProps) {
    const form = useForm<InviteMemberForm>({
        resolver: zodResolver(inviteMemberSchema),
        defaultValues: {
            email: "",
            role: "member",
        },
    });

    const { mutate, isPending } = useInviteMember(workspaceId);

    const onSubmit = (data: InviteMemberForm) => {
        mutate(data, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
                toast.success("Đã gửi lời mời thành công!");
            },
            onError: (error: any) => {
                const errorMessage = error.message || "Đã có lỗi xảy ra";
                toast.error(errorMessage);
            },
        });
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
                    <DialogTitle className="font-bold flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        Mời thành viên
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FieldGroup>
                        <Controller
                            name="email"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldContent>
                                        <FieldLabel htmlFor={field.name} className="mb-1">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="email"
                                            placeholder="Nhập email thành viên"
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
                            name="role"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldContent>
                                        <FieldLabel htmlFor={field.name} className="mb-1">
                                            Vai trò
                                        </FieldLabel>
                                        <div className="flex gap-2">
                                            {[
                                                { value: "member", label: "Thành viên" },
                                                { value: "admin", label: "Quản trị" },
                                                { value: "viewer", label: "Xem" },
                                            ].map((role) => (
                                                <button
                                                    key={role.value}
                                                    type="button"
                                                    onClick={() => field.onChange(role.value)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                                                        field.value === role.value
                                                            ? "bg-blue-600 text-white shadow-sm"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {role.label}
                                                </button>
                                            ))}
                                        </div>
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
                            {isPending ? "Đang gửi..." : "Gửi lời mời"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
