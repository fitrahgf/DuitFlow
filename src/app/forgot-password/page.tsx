"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import { FormField, FormLabel } from "@/components/forms/FormPrimitives";
import { FieldError } from "@/components/shared/FieldError";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validators/auth";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(getErrorMessage(error, t("auth.forgot.error")));
      return;
    }

    toast.success(t("auth.forgot.success"));
  };

  return (
    <AuthShell
      eyebrow={t("auth.forgot.eyebrow")}
      title={t("auth.forgot.title")}
      footer={<Link href="/login">{t("auth.forgot.backToLogin")}</Link>}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField>
          <FormLabel htmlFor="email">{t("auth.fields.email")}</FormLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            required
          />
          <FieldError message={errors.email?.message} />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? "..." : t("auth.forgot.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
