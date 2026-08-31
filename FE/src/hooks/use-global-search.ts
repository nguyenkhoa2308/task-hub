import { useQuery } from "@tanstack/react-query";
import { getData } from "@/lib/axios";

export interface GlobalSearchResult {
  workspaces: any[];
  projects: any[];
  tasks: any[];
}

export function useGlobalSearch(query: string) {
  return useQuery<GlobalSearchResult>({
    queryKey: ["global-search", query],
    queryFn: () => getData("/search", { params: { q: query } }),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
