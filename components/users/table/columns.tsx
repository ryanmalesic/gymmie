"use client";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { type ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";
import { type User } from "@/domain/users/schema";

export function UserTableColumnHeader({
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={buttonVariants({ size: "xs", variant: "ghost" })}
      type="button"
      {...props}
    >
      {children}
      <ArrowUpDown className="ml-1 size-3" />
    </button>
  );
}

export const userTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
});
export type UserTableFeatures = typeof userTableFeatures;

const columnHelper = createColumnHelper<UserTableFeatures, User>();
export const userColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <UserTableColumnHeader onClick={() => column.toggleSorting()}>
        Name
      </UserTableColumnHeader>
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("email", {
    filterFn: "includesString",
    header: ({ column }) => (
      <UserTableColumnHeader onClick={() => column.toggleSorting()}>
        Email
      </UserTableColumnHeader>
    ),
    sortFn: "text",
  }),
]);
