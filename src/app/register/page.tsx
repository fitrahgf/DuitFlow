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
import { registerSchema, type RegisterValues } from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(getErrorMessage(error, t("auth.register.error")));
      return;
    }

    if (data.session) {
      toast.success(t("auth.register.successSignedIn"));
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const nextParams = new URLSearchParams({
      notice: "confirm-email",
      email: values.email,
    });

    toast.success(t("auth.register.success"));
    router.push(`/login?${nextParams.toString()}`);
  };

  return (
    <AuthShell
      eyebrow={t("auth.register.eyebrow")}
      title={t("auth.register.title")}
      footer={
        <>
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login">{t("auth.register.signIn")}</Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField>
          <FormLabel htmlFor="full_name">{t("auth.fields.fullName")}</FormLabel>
          <Input
            id="full_name"
            type="text"
            placeholder={t("auth.register.fullNamePlaceholder")}
            {...register("full_name")}
            required
          />
          <FieldError message={errors.full_name?.message} />
        </FormField>

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

        <FormField>
          <FormLabel htmlFor="password">{t("auth.fields.password")}</FormLabel>
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
          {isSubmitting ? "..." : t("auth.register.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
