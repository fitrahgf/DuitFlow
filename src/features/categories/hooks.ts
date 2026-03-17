import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  deleteCategory,
  fetchCategoriesPageData,
  saveCategory,
} from "./queries";

export function useCategoriesPageQuery() {
  return useQuery({
    queryKey: queryKeys.categories.list("all"),
    queryFn: fetchCategoriesPageData,
  });
}

export function useSaveCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}
