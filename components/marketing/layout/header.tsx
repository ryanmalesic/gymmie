import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function MarketingHeader({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <Link className="font-heading text-sm font-semibold" href="/">
          Gymmie
        </Link>
        <NavigationMenu>
          <NavigationMenuList className="gap-1">
            {isSignedIn ? (
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(buttonVariants({ size: "sm" }))}
                  render={<Link href="/dashboard" />}
                >
                  Open dashboard
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                    )}
                    render={<Link href="/sign-in" />}
                  >
                    Sign in
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(buttonVariants({ size: "sm" }))}
                    render={<Link href="/dashboard" />}
                  >
                    Get started
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
