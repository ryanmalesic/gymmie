export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  details: () => [...userKeys.all, "detail"] as const,
  list: () => [...userKeys.all, "list"] as const,
};
