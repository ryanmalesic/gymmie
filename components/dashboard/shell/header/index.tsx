"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CommandMenu } from "@/components/dashboard/shell/header/command-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Dashboard";
  const showDashboardCrumb = pathname !== "/dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {showDashboardCrumb ? (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link href="/dashboard" />}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="px-4">
        <CommandMenu />
      </div>
    </header>
  );
}
