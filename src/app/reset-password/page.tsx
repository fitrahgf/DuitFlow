"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validators/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error(getErrorMessage(error, t("auth.reset.error")));
      return;
    }

    toast.success(t("auth.reset.success"));
    router.push("/dashboard");
  };

  return (
    <AuthShell
      eyebrow={t("auth.reset.eyebrow")}
      title={t("auth.reset.title")}
      footer={<Link href="/login">{t("auth.reset.backToLogin")}</Link>}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField>
          <FormLabel htmlFor="password">
            {t("auth.fields.newPassword")}
          </FormLabel>
          <Input
            id="password"
            type="password"
            placeholder="********"
            {...register("password")}
            required
          />
          <FieldError message={errors.password?.message} />
        </FormField>

        <FormField>
          <FormLabel htmlFor="confirm_password">
            {t("auth.fields.confirmPassword")}
          </FormLabel>
          <Input
            id="confirm_password"
            type="password"
            placeholder="********"
            {...register("confirm_password")}
            required
          />
          <FieldError message={errors.confirm_password?.message} />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? "..." : t("auth.reset.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
