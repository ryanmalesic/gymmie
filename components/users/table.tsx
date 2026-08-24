"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { UsersIcon } from "lucide-react";
import { useState } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type UserTableFeatures,
  userTableFeatures,
} from "@/components/users/columns";
import { type User } from "@/lib/users/schema";

type UserTableProps = {
  columns: ColumnDef<UserTableFeatures, User>[];
  data: User[];
};

export function UserTable({ columns, data }: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useTable({
    columns,
    data,
    features: userTableFeatures,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: { columnFilters, sorting },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-sm"
        onChange={(event) =>
          table.getColumn("email")?.setFilterValue(event.target.value)
        }
        placeholder="Filter emails..."
        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
      />
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No users yet.</EmptyTitle>
            <EmptyDescription>
              Add someone with the form above.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {table.getFlatHeaders().map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function UserTableSkeleton() {
  return (
    <div
      aria-label="Loading people"
      aria-live="polite"
      className="space-y-3"
      role="status"
    >
      <Skeleton className="h-7 w-full max-w-sm" />
      <div className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-2 gap-4 border-b p-2">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
        {["first", "second", "third"].map((row) => (
          <div
            className="grid grid-cols-2 gap-4 border-b p-2 last:border-b-0"
            key={row}
          >
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
