import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postData, getData, patchData, uploadData } from "@/lib/axios";
import type { SignUpFormData } from "@/components/auth/register-form";
import { SigninFormData } from "@/components/auth/login-form";
import type { User } from "@/types";

const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

interface AuthMeResponse {
    user: User;
}


export const useSignUpMutation = () => {
    return useMutation({
        mutationFn: (data: Omit<SignUpFormData, "confirmPassword">) => postData("/auth/register", data),
    });
};

export const useSignInMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SigninFormData) => postData<AuthMeResponse>("/auth/login", data),
        onSuccess: (data) => queryClient.setQueryData(AUTH_ME_QUERY_KEY, data),
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
        queryKey: AUTH_ME_QUERY_KEY,
        queryFn: () => getData<AuthMeResponse>("/auth/me"),
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
};

export const useLogoutMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => postData("/auth/logout", {}),
        onSuccess: () => {
            queryClient.removeQueries({
                predicate: (query) => query.queryKey[0] !== "auth",
            });
            queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
        },
    });
};

export const useUpdateProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name?: string; profileImage?: string }) =>
            patchData("/auth/profile", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY }),
    });
};
