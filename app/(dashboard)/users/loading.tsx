import { UserFormFallback } from "@/components/users/form";
import { UserTableSkeleton } from "@/components/users/table";
import { UsersView } from "@/components/users/view";

export default function UsersLoading() {
  return (
    <UsersView form={<UserFormFallback />} people={<UserTableSkeleton />} />
  );
}
