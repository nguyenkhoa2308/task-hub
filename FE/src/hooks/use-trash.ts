import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteData } from "@/lib/axios";

type TrashKind = "tasks" | "projects" | "workspaces";

const invalidateTrash = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["trash-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["trash-projects"] });
  queryClient.invalidateQueries({ queryKey: ["trash-workspaces"] });
};

export function usePermanentDeleteTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, ids }: { kind: TrashKind; ids: string[] }) =>
      deleteData<{ success: boolean; deleted: number }>(`/trash/${kind}`, { ids }),
    onSuccess: () => invalidateTrash(queryClient),
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteData<{ success: boolean; deleted: number }>("/trash/empty"),
    onSuccess: () => invalidateTrash(queryClient),
  });
}
