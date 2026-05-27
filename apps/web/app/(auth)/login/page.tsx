"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@repo/database/schemas/auth";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { applyServerFieldErrors } from "~/lib/form-helpers";
import { handleTrpcError } from "~/lib/api-error";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "~/lib/toast";

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    setError,
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

  const googleLoginMutation = trpc.auth.googleLogin.useMutation({
    onSuccess: () => {
      router.replace(nextUrl);
    },
    onError: (err) => {
      toast.error(err.message || "Google sign-in failed. Please try again.");
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div
      className="w-full bg-white border border-[#e5e5e5] rounded-3xl p-10 mx-auto shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)]"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif text-[#1a1a1a] mb-2">Welcome back.</h1>
        <p className="text-sm text-[#737373]">Sign in to continue to Kolletcs</p>
      </div>

      {/* Google Sign-In */}
      <div className="w-full flex justify-center mb-8">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              googleLoginMutation.mutate({ credential: credentialResponse.credential });
            }
          }}
          onError={() => {
            toast.error("Google sign-in failed. Please try again.");
          }}
          width="320"
          size="large"
          shape="rectangular"
          text="signin_with"
          logo_alignment="center"
        />
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e5e5e5]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[#737373] uppercase tracking-widest font-medium">or email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#737373] ml-1 mb-2 uppercase tracking-widest">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full h-12 px-4 rounded-xl text-sm bg-[#fafafa] border border-[#e5e5e5] text-[#1a1a1a] placeholder:text-[#a3a3a3] outline-none focus:ring-2 focus:ring-[#4d65ff]/20 focus:border-[#4d65ff] transition-all"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-500 mt-2 ml-1" aria-live="polite">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#737373] ml-1 mb-2 uppercase tracking-widest">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full h-12 px-4 rounded-xl text-sm bg-[#fafafa] border border-[#e5e5e5] text-[#1a1a1a] placeholder:text-[#a3a3a3] outline-none focus:ring-2 focus:ring-[#4d65ff]/20 focus:border-[#4d65ff] transition-all"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-red-500 mt-2 ml-1" aria-live="polite">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-2">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-[#737373] hover:text-[#1a1a1a] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full h-12 mt-4 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-[#1a1a1a] disabled:active:scale-100"
          disabled={isSubmitting || loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in…" : "Login"}
        </button>
      </form>

      <p className="text-sm text-[#737373] text-center mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#1a1a1a] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
