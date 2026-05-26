import * as React from "react";
import { AuthGuard } from "~/components/chrome/auth-guard";
import { DashboardSidebar } from "~/components/chrome/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <AuthGuard>{children}</AuthGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
