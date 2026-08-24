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

import { buttonVariants } from "@/components/ui/button";
import { type User } from "@/lib/users/schema";

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
