"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";

/**
 * DashboardShell conditionally renders the sidebar.
 * On form editor pages (/dashboard/forms/[id]/...) the sidebar is hidden
 * and replaced with a minimal back button for a full-width editing experience.
 */
export function DashboardShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Match /dashboard/forms/<formId>/<anything>
  const isFormEditorPage = /^\/dashboard\/forms\/[^/]+\/.+/.test(pathname);

  if (isFormEditorPage) {
    return (
      <div className="flex h-svh w-full flex-col overflow-hidden bg-white">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="bg-white">{children}</SidebarInset>
    </SidebarProvider>
  );
}
