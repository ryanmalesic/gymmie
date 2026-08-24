"use client";

import { DashboardHeader } from "@/components/dashboard/shell/header";
import { DashboardSidebar } from "@/components/dashboard/shell/sidebar";
import { type DashboardUser } from "@/components/dashboard/user";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: DashboardUser;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardSidebar user={user} />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
