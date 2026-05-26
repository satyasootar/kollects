"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  React.useEffect(() => {
    if (error) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [error, router, pathname]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" data-testid="auth-guard-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return <>{children}</>;
}
