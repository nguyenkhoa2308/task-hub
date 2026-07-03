"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

export type SigninFormData = z.infer<typeof signInSchema>;

export default function LoginForm() {
  const form = useForm<SigninFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { mutate, isPending, error } = useSignInMutation();

  const handleOnSubmit = (values: SigninFormData) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Đăng nhập thành công!');
      },
      onError: (error: any) => {
        toast.error(error.message);
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
                  placeholder="example@email.com"
                  aria-invalid={fieldState.invalid}
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
                    className="text-sm text-blue-600"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  placeholder="••••••••"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />

        <Button type="submit" className="w-full h-12">
          Đăng nhập
        </Button>
      </FieldGroup>
    </form>
  );
}
