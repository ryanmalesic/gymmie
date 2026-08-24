export type DashboardUser = {
  email: string;
  image?: null | string;
  name: string;
};

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");

  return letters.toUpperCase() || "?";
}
