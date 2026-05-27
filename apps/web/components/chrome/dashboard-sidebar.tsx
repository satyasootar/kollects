"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  KeyRound,
  BookOpen,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";

import { useUserStore } from "~/lib/stores/user-store";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { trpc } from "~/trpc/client";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
] as const;

const SETTINGS_ITEMS = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "API Keys", href: "/dashboard/settings/api-keys", icon: KeyRound },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-6 rounded bg-tint-mint flex items-center justify-center">
            <span className="text-tint-mint-ink text-xs font-bold">✓</span>
          </div>
          <span className="text-sm font-semibold text-foreground">kollects.tech</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SETTINGS_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/docs">
                    <BookOpen className="size-4" />
                    <span>API Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {user ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="size-8 border border-border">
                <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                <AvatarFallback className="bg-muted text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
            <button 
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
              title="Logout"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2">
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
