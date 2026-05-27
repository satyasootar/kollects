"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { EditorialCard } from "~/components/chrome";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { env } from "~/env.js";
import { PLAN_LIMITS } from "@repo/database/constants/user-plan";
import { toast } from "~/lib/toast";

import { useUserStore } from "~/lib/stores/user-store";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function AccountSettingsPage() {
  const trpcContext = trpc.useUtils();
  const { isLoading } = trpc.auth.me.useQuery(undefined);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [isUploading, setIsUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
    },
  });

  const currentAvatarUrl = watch("avatarUrl");

  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? "",
        avatarUrl: user.avatarUrl ?? "",
      });
    }
  }, [user, reset]);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      trpcContext.auth.me.invalidate();
      if (data.user) {
        setUser(data.user as any);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const onSubmit = (data: ProfileInput) => {
    updateProfileMutation.mutate(data);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = (env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc").replace("/trpc", "/api/upload");
      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      
      setValue("avatarUrl", data.url, { shouldDirty: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 w-full">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const plan = user?.plan ?? "free";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return (
    <div className="p-6 space-y-6 w-full">
      <h1 className="text-2xl font-semibold">Account Settings</h1>

      {/* Profile */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-6">Profile</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-24 border-2 border-border shadow-sm">
                <AvatarImage src={currentAvatarUrl || ""} alt="Avatar" className="object-cover" />
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                  {watch("name")?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Label
                  htmlFor="avatar-upload"
                  className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Camera className="mr-2 size-4" /> Change Picture</>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={isUploading}
                  />
                </Label>
                {currentAvatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setValue("avatarUrl", "", { shouldDirty: true })}
                    disabled={isUploading}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className="h-11"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} readOnly className="h-11 bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              type="submit"
              variant="forest"
              disabled={isSubmitting || updateProfileMutation.isPending || !isDirty}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </EditorialCard>

      {/* Plan */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Plan</h2>
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="default" className="capitalize">{plan}</Badge>
          {limits && (
            <span className="text-sm text-muted-foreground">
              {limits.formLimit === -1 ? "Unlimited" : `${limits.formLimit} forms`} ·{" "}
              {limits.responseLimit === -1 ? "Unlimited" : `${limits.responseLimit.toLocaleString()} responses/form`}
            </span>
          )}
        </div>
        {plan !== "enterprise" && (
          <Button variant="forest" asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
        )}
      </EditorialCard>

      {/* Security */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Security</h2>
        <p className="text-sm text-muted-foreground mb-4">
          To change your password, use the password reset flow.
        </p>
        <Button variant="outline" asChild>
          <Link href="/auth/forgot-password">Reset password</Link>
        </Button>
      </EditorialCard>
    </div>
  );
}
