import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postData, getData, patchData, uploadData } from "@/lib/axios";
import type { SignUpFormData } from "@/components/auth/register-form";
import { SigninFormData } from "@/components/auth/login-form";


export const useSignUpMutation = () => {
    return useMutation({
        mutationFn: (data: Omit<SignUpFormData, "confirmPassword">) => postData("/auth/register", data),
    });
};

export const useSignInMutation = () => {
    return useMutation({
        mutationFn: (data: SigninFormData) => postData("/auth/login", data),
    })
}

export const useResendVerificationMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => postData("/auth/resend-verification", data),
    });
};

export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string; otp: string }) => postData("/auth/verify-email", data),
    });
};

export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => postData("/auth/forgot-password", data),
    });
};

export const useResetPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string; otp: string; newPassword: string }) =>
            postData("/auth/reset-password", data),
    });
};

export const useGetMeQuery = () => {
    return useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => getData("/auth/me"),
        retry: false,
    });
};

export const useLogoutMutation = () => {
    return useMutation({
        mutationFn: () => postData("/auth/logout", {}),
    });
};

export const useUpdateProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name?: string; profileImage?: string }) =>
            patchData("/auth/profile", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });
};

export const useChangePasswordMutation = () => {
    return useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) =>
            postData("/auth/change-password", data),
    });
};

export const useUploadAvatarMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            return uploadData<any>("/auth/profile/avatar", formData);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
    });
};
