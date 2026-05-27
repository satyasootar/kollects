import * as React from "react";
import { AuthGuard } from "~/components/chrome/auth-guard";
import { DashboardSidebar } from "~/components/chrome/dashboard-sidebar";
import { CommandPalette } from "~/components/chrome/command-palette";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <AuthGuard>
          {children}
          <CommandPalette />
        </AuthGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
