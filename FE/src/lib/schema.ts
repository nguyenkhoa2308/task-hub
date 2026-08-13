import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const signUpSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    name: z.string().min(1, "Tên không được để trống"),
    confirmPassword: z
      .string()
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });


export const workspaceSchema = z.object({
  name: z.string().min(3, "Tên phải có ít nhất 3 ký tự"),
  color: z.string().min(3, "Màu sắc phải có ít nhất 3 ký tự"),
  description: z.string().optional(),
})

export const projectSchema = z.object({
  title: z.string().min(3, "Tên dự án phải có ít nhất 3 ký tự"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  members: z
    .array(
      z.object({
        user: z.string(),
        role: z.enum(["manager", "contributor", "viewer"]),
      })
    )
    .optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["admin", "member", "viewer"]),
})