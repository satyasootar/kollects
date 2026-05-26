"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@repo/database";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Doodle } from "~/components/chrome";
import { applyServerFieldErrors } from "~/lib/form-helpers";
import { handleTrpcError } from "~/lib/api-error";

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      router.replace(nextUrl);
    },
    onError: (err) => {
      if (!applyServerFieldErrors<LoginInput>(err, setError)) {
        handleTrpcError(err);
      }
    },
  });

  const emailValue = watch("email");
  const [showDoodle, setShowDoodle] = React.useState(true);

  React.useEffect(() => {
    if (emailValue && emailValue.length > 0) {
      setShowDoodle(false);
    }
  }, [emailValue]);

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm font-semibold text-foreground">
          kollects.tech
        </Link>
      </div>

      <div>
        <h1 className="text-display-md text-foreground">
          Welcome{" "}
          <span className="text-tint-blush-ink relative inline-block">
            back
            <Doodle
              name="underline-wave"
              className="absolute -bottom-1 left-0 w-full h-2"
            />
          </span>
          .
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2 relative">
          {showDoodle && (
            <Doodle
              name="arrow-down-right"
              className="absolute -top-6 -left-6 size-5 text-doodle-soft transition-opacity duration-300"
            />
          )}
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="h-11"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive" aria-live="polite">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-11"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive" aria-live="polite">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="forest"
          className="w-full h-11"
          disabled={isSubmitting || loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in…" : "Login"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Don&apos;t have an account?{" "}
        <Button variant="link-soft" asChild className="p-0 h-auto">
          <Link href="/signup">Sign up</Link>
        </Button>
      </p>
    </div>
  );
}
