"use client";

import { LayoutDashboardIcon, LogOutIcon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSignOut } from "@/components/dashboard/use-sign-out";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const signOut = useSignOut();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((isOpen) => !isOpen);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function goTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <>
      <Button
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        Search…
        <KbdGroup className="ml-2 hidden sm:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog onOpenChange={setOpen} open={open}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => goTo("/dashboard")}>
                <LayoutDashboardIcon />
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => goTo("/users")}>
                <UsersIcon />
                Users
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  void signOut();
                }}
              >
                <LogOutIcon />
                Log out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
