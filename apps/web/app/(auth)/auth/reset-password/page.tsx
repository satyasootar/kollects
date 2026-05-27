"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { resetPasswordClientSchema, type ResetPasswordClientInput } from "~/lib/schemas-extra";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordClientInput>({
    resolver: zodResolver(resetPasswordClientSchema),
    defaultValues: {
      token: token ?? "",
    },
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset — please log in.");
      router.replace("/login");
    },
    onError: (err) => {
      handleTrpcError(err);
    },
  });

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-foreground">
            kollects.tech
          </Link>
        </div>
        <h1 className="text-display-md text-foreground">Invalid reset link.</h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Button variant="forest" asChild>
          <Link href="/auth/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = (data: ResetPasswordClientInput) => {
    resetMutation.mutate({
      token: data.token,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm font-semibold text-foreground">
          kollects.tech
        </Link>
      </div>

      <div>
        <h1 className="text-display-md text-foreground">Set a new password.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div className="space-y-2">
          <Label htmlFor="newPassword">
            New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            className="h-11"
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p id="newPassword-error" className="text-xs text-destructive" aria-live="polite">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className="h-11"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-xs text-destructive" aria-live="polite">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="forest"
          className="w-full h-11"
          disabled={isSubmitting || resetMutation.isPending}
        >
          {resetMutation.isPending ? "Resetting…" : "Reset Password"}
        </Button>
      </form>

      <Button variant="link-soft" asChild className="p-0 h-auto">
        <Link href="/login">&larr; Back to Login</Link>
      </Button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}
