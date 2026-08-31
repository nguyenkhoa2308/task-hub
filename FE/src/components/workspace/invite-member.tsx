"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { inviteMemberSchema } from "@/lib/schema";
import { useInviteMember } from "@/hooks/use-workspace";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { UserPlus, Mail, Link2, Copy, Check, Shield } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"email" | "link">("email");
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/workspace-invite/${workspaceId}`
      : `/workspace-invite/${workspaceId}`;

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
        toast.success(`Đã gửi lời mời đến ${data.email}!`);
      },
      onError: (error: any) => {
        const errorMessage = error.message || "Đã có lỗi xảy ra khi gửi lời mời";
        toast.error(errorMessage);
      },
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết mời!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
      setCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-2xl p-6 max-lg:!fixed max-lg:!inset-y-0 max-lg:!right-0 max-lg:!left-auto max-lg:!top-0 max-lg:!flex max-lg:!h-dvh max-lg:!max-h-none max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!flex-col max-lg:!gap-4 max-lg:!rounded-none max-lg:!p-4 max-lg:!duration-300 max-lg:data-open:slide-in-from-right-full max-lg:data-open:zoom-in-100 max-lg:data-closed:slide-out-to-right-full max-lg:data-closed:zoom-out-100 sm:max-lg:!w-[520px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-extrabold text-xl flex items-center gap-2.5 text-slate-800">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            Mời thành viên vào Workspace
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Chọn phương thức mời thành viên cùng tham gia làm việc.
          </p>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "email"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail className="h-4 w-4" />
            Gửi qua Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "link"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Link2 className="h-4 w-4" />
            Chia sẻ Liên kết
          </button>
        </div>

        {/* TAB 1: EMAIL FORM */}
        {activeTab === "email" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-3">
            <FieldGroup className="space-y-4">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> Địa chỉ Email
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="email"
                        placeholder="nguyenvana@example.com"
                        aria-invalid={fieldState.invalid}
                        className="rounded-xl border-slate-200 h-10 text-xs focus:ring-2 focus:ring-blue-500"
                      />
                      {fieldState.invalid && (
                        <FieldError
                          errors={[fieldState.error]}
                          className="font-semibold text-xs mt-1 text-rose-500"
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
                      <FieldLabel className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-slate-400" /> Quyền hạn trong Workspace
                      </FieldLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "member", label: "Thành viên", desc: "Tạo & quản lý task" },
                          { value: "admin", label: "Quản trị", desc: "Toàn quyền quản lý" },
                          { value: "viewer", label: "Người xem", desc: "Chỉ xem thông tin" },
                        ].map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => field.onChange(role.value)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              field.value === role.value
                                ? "border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-2xs"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-xs font-bold">{role.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal leading-tight">
                              {role.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                      {fieldState.invalid && (
                        <FieldError
                          errors={[fieldState.error]}
                          className="font-semibold text-xs mt-1 text-rose-500"
                        />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm transition-all"
              >
                {isPending ? "Đang gửi lời mời..." : "Gửi lời mời ngay"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* TAB 2: SHARE LINK */}
        {activeTab === "link" && (
          <div className="space-y-4 mt-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5 text-blue-600" /> Liên kết tham gia Workspace
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="rounded-xl border-slate-200 h-9 text-xs bg-white text-slate-600 font-mono"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className={`shrink-0 h-9 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer gap-1.5 ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-900">
                💡 Lưu ý quan trọng
              </p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                Bất kỳ ai có đường link này và đăng nhập vào hệ thống đều có thể tham gia vào Workspace của bạn với vai trò <strong>Thành viên</strong>.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
