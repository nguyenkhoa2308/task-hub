"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { resetPasswordSchema } from "@/lib/schema";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useResetPasswordMutation, useForgotPasswordMutation } from "@/hooks/use-auth";
import { HelpCircle, Lock, Loader2, Eye, EyeOff } from "lucide-react";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59);

  const { mutate, isPending } = useResetPasswordMutation();
  const { mutate: resendMutate, isPending: isResending } = useForgotPasswordMutation();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResend = () => {
    if (!email) return;
    resendMutate({ email }, {
      onSuccess: () => {
        toast.success("Mã OTP mới đã được gửi lại");
        setTimeLeft(59);
      },
      onError: (error: any) => {
        toast.error(error.message || "Gửi lại mã thất bại");
      },
    });
  };

  const handleOnSubmit = (values: ResetPasswordFormData) => {
    if (otp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP 6 chữ số");
      return;
    }
    if (!email) {
      toast.error("Không tìm thấy email");
      return;
    }
    mutate(
      { email, otp, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success("Đặt lại mật khẩu thành công!");
          router.push("/auth/sign-in");
        },
        onError: (error: any) => {
          toast.error(error.message || "Đã có lỗi xảy ra");
        },
      }
    );
  };

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 mb-4">Thiếu thông tin email. Vui lòng quay lại.</p>
        <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
          Quay lại Quên mật khẩu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 selection:bg-blue-800/10">
      {/* Main Content */}
      <main className="flex flex-1 items-start justify-center sm:items-center sm:px-4 sm:py-8">
        <Card className="min-h-dvh w-full max-w-md rounded-none border-0 bg-white py-7 shadow-none sm:min-h-0 sm:rounded-2xl sm:border sm:border-gray-300/20 sm:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)]">
          <CardHeader className="px-5 text-center sm:px-6">
            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 rotate-3 hover:rotate-0 transition-transform duration-500">
                <Lock className="w-7 h-7" />
              </div>
            </div>
            <CardTitle className="mb-2 text-xl font-bold tracking-tight text-gray-900 sm:mb-4 sm:text-2xl">
              Đặt lại mật khẩu
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 leading-relaxed">
              Nhập mã OTP đã gửi đến{" "}
              <strong className="text-gray-900">{email}</strong> và mật khẩu mới
              của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-4 sm:px-6">
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleOnSubmit)}
              noValidate
            >
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mã OTP
                </label>
                <div className="flex justify-center w-full">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="flex w-full justify-between gap-1.5 sm:gap-3">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="!h-12 !w-auto min-w-0 flex-1 !rounded-lg !border !border-gray-300/40 bg-blue-50/30 text-center text-lg font-semibold text-gray-900 transition-all focus-visible:!border-blue-600 focus-visible:!ring-1 focus-visible:!ring-blue-600 sm:!h-14 sm:!w-[52px] sm:flex-none sm:rounded-xl sm:text-xl"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* New Password */}
              <FieldGroup>
                <Controller
                  name="newPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Mật khẩu mới
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            id={field.name}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            aria-invalid={fieldState.invalid}
                            className="h-11 pr-10 text-base sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <span className="pointer-events-none">
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </span>
                          </button>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Xác nhận mật khẩu
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            id={field.name}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            aria-invalid={fieldState.invalid}
                            className="h-11 pr-10 text-base sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <span className="pointer-events-none">
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </span>
                          </button>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                    </Field>
                  )}
                />
              </FieldGroup>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={otp.length !== 6 || isPending}
                  className="w-full h-12"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Đặt lại mật khẩu"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                Bạn không nhận được mã?
                <Button
                  variant="link"
                  disabled={timeLeft > 0 || isResending}
                  onClick={handleResend}
                  className={`ml-1 p-0 h-auto font-semibold transition-all ${timeLeft > 0 || isResending
                    ? "text-blue-600 opacity-60 cursor-not-allowed"
                    : "text-blue-600 hover:underline cursor-pointer"
                    }`}
                >
                  {isResending
                    ? "Đang gửi..."
                    : timeLeft > 0
                      ? `Gửi lại mã (sau ${timeLeft}s)`
                      : "Gửi lại mã ngay"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
