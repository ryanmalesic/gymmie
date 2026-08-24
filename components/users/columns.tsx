"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { type UserTableFeatures } from "@/components/users/data-table-features";
import { type ListedUser } from "@/lib/users/schema";

const columnHelper = createColumnHelper<UserTableFeatures, ListedUser>();

export const userColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <button
        className={buttonVariants({ size: "xs", variant: "ghost" })}
        onClick={() => column.toggleSorting()}
        type="button"
      >
        Name
        <ArrowUpDown className="ml-1 size-3" />
      </button>
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("email", {
    filterFn: "includesString",
    header: ({ column }) => (
      <button
        className={buttonVariants({ size: "xs", variant: "ghost" })}
        onClick={() => column.toggleSorting()}
        type="button"
      >
        Email
        <ArrowUpDown className="ml-1 size-3" />
      </button>
    ),
    sortFn: "text",
  }),
]);
