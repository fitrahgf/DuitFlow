"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queries/keys";
import { fetchCurrentProfile } from "@/lib/queries/profile";
import {
  createTelegramConnectLink,
  disconnectTelegramConnection,
  fetchTelegramConnection,
} from "@/lib/queries/telegram";

export default function SettingsIntegrationsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: fetchCurrentProfile,
    retry: false,
  });

  const telegramQuery = useQuery({
    queryKey: queryKeys.telegram.connection,
    queryFn: fetchTelegramConnection,
    retry: false,
  });

  const telegramConnectMutation = useMutation({
    mutationFn: createTelegramConnectLink,
    onSuccess: (result) => {
      window.open(result.url, "_blank", "noopener,noreferrer");
      toast.success(t("settings.telegram.connectStarted"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("settings.telegram.connectError")));
    },
  });

  const telegramDisconnectMutation = useMutation({
    mutationFn: async () =>
      disconnectTelegramConnection(profileQuery.data?.profile.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.telegram.connection,
      });
      toast.success(t("settings.telegram.disconnectSuccess"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, t("settings.telegram.disconnectError")),
      );
    },
  });

  if (profileQuery.isLoading || telegramQuery.isLoading) {
    return (
      <PageShell className="mx-auto w-full max-w-[52rem] animate-fade-in">
        <PageHeader variant="compact">
          <PageHeading title={t("settings.telegram.title")} compact />
        </PageHeader>
        <SurfaceCard padding="compact">
          <EmptyState title={t("common.loading")} compact />
        </SurfaceCard>
      </PageShell>
    );
  }

  if (profileQuery.isError || telegramQuery.isError) {
    return (
      <PageShell className="mx-auto w-full max-w-[52rem] animate-fade-in">
        <PageHeader variant="compact">
          <PageHeading title={t("settings.telegram.title")} compact />
        </PageHeader>
        <SurfaceCard padding="compact">
          <EmptyState title={t("settings.loadError")} compact />
        </SurfaceCard>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto w-full max-w-[52rem] animate-fade-in">
      <PageHeader variant="compact">
        <PageHeading title={t("settings.telegram.title")} compact />
        <PageHeaderActions>
          <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
            <Link href="/settings">
              <ArrowLeft size={16} />
              {t("settings.title")}
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard role="embedded" padding="compact" className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <span className="grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)-0.04rem)] bg-surface-2/65 text-text-1">
            <Bot size={18} />
          </span>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                @
                {telegramQuery.data?.botUsername ||
                  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
                  "DuitFlowMoneyTrack_Bot"}
              </strong>
              <Badge variant={telegramQuery.data?.connected ? "accent" : "default"}>
                {telegramQuery.data?.connected
                  ? t("settings.telegram.connected")
                  : t("settings.telegram.disconnected")}
              </Badge>
            </div>
            {telegramQuery.data?.connected && telegramQuery.data.username ? (
              <span className="text-[var(--font-size-meta)] text-text-2">
                @{telegramQuery.data.username}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={
              telegramConnectMutation.isPending || !telegramQuery.data?.botUsername
            }
            onClick={() => telegramConnectMutation.mutate()}
          >
            <Link2 size={16} />
            {telegramQuery.data?.connected
              ? t("settings.telegram.reconnect")
              : t("settings.telegram.connect")}
          </Button>
          {telegramQuery.data?.connected ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={telegramDisconnectMutation.isPending}
              onClick={() => telegramDisconnectMutation.mutate()}
            >
              <Unlink size={16} />
              {t("settings.telegram.disconnect")}
            </Button>
          ) : null}
        </div>
      </SurfaceCard>
    </PageShell>
  );
}
