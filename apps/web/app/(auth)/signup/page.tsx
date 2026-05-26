"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@repo/database/schemas/auth";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Doodle } from "~/components/chrome";
import { applyServerFieldErrors } from "~/lib/form-helpers";
import { handleTrpcError } from "~/lib/api-error";

type RegisterInput = z.infer<typeof registerSchema>;

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
  { label: "One special character", test: (v: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
];

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      router.replace("/dashboard");
    },
    onError: (err) => {
      if (!applyServerFieldErrors<RegisterInput>(err, setError)) {
        handleTrpcError(err);
      }
    },
  });

  const passwordValue = watch("password") ?? "";

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
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
          Create your{" "}
          <span className="text-tint-peach-ink relative inline-block">
            account
            <Doodle
              name="underline-wave"
              className="absolute -bottom-1 left-0 w-full h-2"
            />
          </span>
          .
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            className="h-11"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-destructive" aria-live="polite">
              {errors.name.message}
            </p>
          )}
        </div>

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
          <ul className="space-y-1 mt-2">
            {PASSWORD_RULES.map((rule) => (
              <li
                key={rule.label}
                className={`text-xs flex items-center gap-1.5 ${
                  rule.test(passwordValue)
                    ? "text-status-published"
                    : "text-muted-foreground"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {rule.label}
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="submit"
          variant="forest"
          className="w-full h-11"
          disabled={isSubmitting || registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <Button variant="link-soft" asChild className="p-0 h-auto">
          <Link href="/login">Login</Link>
        </Button>
      </p>
    </div>
  );
}
