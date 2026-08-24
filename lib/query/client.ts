import { QueryClient } from "@tanstack/react-query";

const QUERY_STALE_TIME_MS = 60_000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
}
