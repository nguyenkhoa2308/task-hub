"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Eye, EyeOff } from "lucide-react";

import { signInSchema } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useSignInMutation } from "@/hooks/use-auth";
import { useAppDispatch } from "@/lib/redux/hooks";
import { loginSuccess } from "@/lib/redux/features/authSlice";

export type SigninFormData = z.infer<typeof signInSchema>;

export default function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SigninFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const dispatch = useAppDispatch();
  const { mutate, isPending, error } = useSignInMutation();

  const handleOnSubmit = (values: SigninFormData) => {
    mutate(values, {
      onSuccess: (response: any) => {
        toast.success('Đăng nhập thành công!');
        dispatch(loginSuccess(response.user));
        router.push('/dashboard');
      },
      onError: (error: any) => {
        const errorMessage = error.message || "Đã có lỗi xảy ra";
        if (errorMessage === "EMAIL_NOT_VERIFIED") {
          toast.error("Tài khoản chưa được xác thực. Vui lòng kiểm tra mã OTP.");
          router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
          return;
        }
        toast.error(errorMessage)
      }
    })
  };

  return (
    <form onSubmit={form.handleSubmit(handleOnSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  aria-invalid={fieldState.invalid}
                  className="h-11 text-base sm:text-sm"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-800 font-semibold hover:underline transition-colors"
                    tabIndex={-1}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    className="h-11 pr-10 text-base sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    <span className="pointer-events-none">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </FieldGroup>
    </form>
  );
}
