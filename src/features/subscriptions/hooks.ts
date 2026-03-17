import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  createSubscription,
  deleteSubscription,
  fetchSubscriptions,
  updateSubscriptionStatus,
} from "./queries";

export function useSubscriptionsQuery() {
  return useQuery({
    queryKey: queryKeys.subscriptions.list,
    queryFn: fetchSubscriptions,
  });
}

export function useCreateSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all,
      });
    },
  });
}

export function useUpdateSubscriptionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubscriptionStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all,
      });
    },
  });
}

export function useDeleteSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.all,
      });
    },
  });
}
