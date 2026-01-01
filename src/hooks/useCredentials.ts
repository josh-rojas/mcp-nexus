import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCredentials,
  saveCredential,
  deleteCredential,
  getCredentialValue,
} from "../lib/tauri";

export function useCredentials() {
  const queryClient = useQueryClient();

  const {
    data: credentials = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["credentials"],
    queryFn: listCredentials,
  });

  const saveMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      saveCredential(name, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });

  // Helper to check if a name exists in the already loaded list
  const existsInList = (name: string) => credentials.includes(name);

  return {
    credentials,
    isLoading,
    error,
    refetch,
    saveCredential: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteCredential: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    existsInList,
  };
}

// Hook to fetch a single credential's value (use with caution/security in mind)
export function useCredentialValue(name: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ["credential", name],
    queryFn: () => getCredentialValue(name),
    enabled: enabled && !!name,
    staleTime: 0, // Don't cache secrets for long
    gcTime: 1000 * 60, // Clear from cache after 1 minute
  });
}
