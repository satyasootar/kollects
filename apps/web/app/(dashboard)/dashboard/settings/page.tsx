"use client";

import * as React from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { EditorialCard } from "~/components/chrome";
import { Badge } from "~/components/ui/badge";
import { PLAN_LIMITS } from "@repo/database/constants/user-plan";

export default function AccountSettingsPage() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined);
  const userData = user as any;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const plan = userData?.plan ?? "free";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Account Settings</h1>

      {/* Profile */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={userData?.name ?? ""} readOnly className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userData?.email ?? ""} readOnly className="h-11 bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>
        </div>
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
