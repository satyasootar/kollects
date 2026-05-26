"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@repo/database";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setCooldown(30);
    },
    onError: () => {
      // Always show success to prevent email enumeration
      setSubmitted(true);
      setCooldown(30);
    },
  });

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-foreground">
            kollects.tech
          </Link>
        </div>
        <h1 className="text-display-md text-foreground">Check your email.</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists with that email, we&apos;ve sent a password reset link.
        </p>
        <Button variant="link-soft" asChild className="p-0 h-auto">
          <Link href="/login">&larr; Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm font-semibold text-foreground">
          kollects.tech
        </Link>
      </div>

      <div>
        <h1 className="text-display-md text-foreground">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
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

        <Button
          type="submit"
          variant="forest"
          className="w-full h-11"
          disabled={isSubmitting || forgotMutation.isPending || cooldown > 0}
        >
          {forgotMutation.isPending
            ? "Sending…"
            : cooldown > 0
              ? `Wait ${cooldown}s`
              : "Send Reset Link"}
        </Button>
      </form>

      <Button variant="link-soft" asChild className="p-0 h-auto">
        <Link href="/login">&larr; Back to Login</Link>
      </Button>
    </div>
  );
}
