"use client";

import { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Loader2,
  Save,
  Check,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} from "@/hooks/use-auth";
import { PageErrorState } from "@/components/ui/page-state";

const CLAY_AVATAR_SEEDS = [
  "Felix",
  "Aneka",
  "Zack",
  "Sophia",
  "Oliver",
  "Daisy",
  "Jasper",
  "Bella",
  "Leo",
  "Maya",
  "Ethan",
  "Luna",
];

export default function ProfilePage() {
  const { data: meRaw, isLoading, isError, refetch } = useGetMeQuery();
  const me = (meRaw as any)?.user || (meRaw as any);

  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfileMutation();
  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePasswordMutation();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useUploadAvatarMutation();

  // Profile Form state
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      const img = me.profileImage || `https://api.dicebear.com/10.x/clay/svg?seed=${encodeURIComponent(me.name || me.email || "User")}`;
      setProfileImage(img);
    }
  }, [me]);

  const handleSelectPresetAvatar = (seed: string) => {
    const url = `https://api.dicebear.com/10.x/clay/svg?seed=${seed}`;
    setProfileImage(url);
    setCustomAvatarUrl("");
  };

  const handleUploadAvatar = async (file?: File) => {
    if (!file) return;
    try {
      const result = await uploadAvatar(file);
      const imageUrl = result?.user?.profileImage;
      if (imageUrl) setProfileImage(imageUrl);
      setCustomAvatarUrl("");
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (error: any) {
      toast.error(error.message || "Không thể tải ảnh đại diện lên");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }

    const finalImage = customAvatarUrl.trim() || profileImage;

    updateProfile(
      { name: name.trim(), profileImage: finalImage },
      {
        onSuccess: () => {
          toast.success("Cập nhật thông tin thành công!");
        },
        onError: (err: any) => {
          toast.error(err?.message || "Cập nhật thất bại");
        },
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: (res: any) => {
          toast.success(res?.message || "Đổi mật khẩu thành công!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err: any) => {
          toast.error(err?.message || "Mật khẩu hiện tại không đúng");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <PageErrorState title="Không thể tải hồ sơ" onRetry={() => refetch()} />;
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-800">
            <UserIcon className="size-7 text-blue-600" />
            Hồ sơ cá nhân
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin tài khoản, ảnh đại diện và bảo mật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left Column: Avatar & Quick Info Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4 lg:sticky lg:top-20">
            <div className="relative inline-block mx-auto">
              <Avatar className="size-28 ring-4 ring-slate-100 shadow-md">
                <AvatarImage src={profileImage} alt={name} />
                <AvatarFallback className="text-3xl font-bold bg-slate-200 text-slate-700">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-white text-white" title="Tài khoản hoạt động">
                <CheckCircle2 className="size-4" />
              </div>
            </div>

            <label className={`mx-auto inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 ${isUploadingAvatar ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isUploadingAvatar} onChange={(event) => { handleUploadAvatar(event.target.files?.[0]); event.target.value = ""; }} />
              {isUploadingAvatar ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
              {isUploadingAvatar ? "Đang tải..." : "Tải ảnh lên"}
            </label>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{name || "Người dùng"}</h2>
              <p className="text-xs text-slate-500">{me?.email}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="size-4 text-emerald-600" />
              <span>{me?.isEmailVerified ? "Email đã xác thực" : "Chưa xác thực email"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Security Forms */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          {/* Edit Profile Information */}
          <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="size-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Thông tin cá nhân</h3>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Họ và tên</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="h-10 rounded-xl"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative">
                <Input
                  value={me?.email || ""}
                  disabled
                  className="h-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed pr-10"
                />
                <Mail className="size-4 text-slate-400 absolute right-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-400">Email không thể thay đổi sau khi đăng ký</p>
            </div>

            {/* Avatar Selector Presets */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn Avatar Mẫu (3D Clay Style)
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {CLAY_AVATAR_SEEDS.map((seed) => {
                  const url = `https://api.dicebear.com/10.x/clay/svg?seed=${seed}`;
                  const isSelected = profileImage === url;

                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(seed)}
                      className={`relative rounded-xl p-1 border-2 transition-all cursor-pointer hover:scale-105 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      <Avatar className="size-10 mx-auto">
                        <AvatarImage src={url} alt={seed} />
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom URL Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hoặc nhập URL ảnh tuỳ chỉnh
              </label>
              <Input
                value={customAvatarUrl}
                onChange={(e) => {
                  setCustomAvatarUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setProfileImage(e.target.value.trim());
                  }
                }}
                placeholder="https://example.com/my-avatar.png"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Save Profile Button */}
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={isUpdatingProfile} className="gap-2 font-bold rounded-xl h-10 px-6 cursor-pointer">
                {isUpdatingProfile ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span>Lưu thay đổi</span>
              </Button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="size-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Đổi mật khẩu</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mật khẩu hiện tại</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mật khẩu mới</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={isChangingPassword} variant="outline" className="gap-2 font-bold rounded-xl h-10 px-6 border-slate-200 cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200">
                {isChangingPassword ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                <span>Cập nhật mật khẩu</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
