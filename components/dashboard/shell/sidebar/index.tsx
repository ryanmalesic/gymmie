"use client";

import { DumbbellIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/dashboard/shell/sidebar/nav-main";
import { NavUser } from "@/components/dashboard/shell/sidebar/nav-user";
import { type DashboardUser } from "@/components/dashboard/user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function DashboardSidebar({ user }: { user: DashboardUser }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <DumbbellIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Gymmie</span>
                <span className="truncate text-xs">Gym management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            {
              icon: <LayoutDashboardIcon />,
              isActive: pathname === "/dashboard",
              title: "Dashboard",
              url: "/dashboard",
            },
            {
              icon: <UsersIcon />,
              isActive: pathname === "/users" || pathname.startsWith("/users/"),
              title: "Users",
              url: "/users",
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
