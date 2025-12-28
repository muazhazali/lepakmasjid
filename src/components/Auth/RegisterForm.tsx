import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const createRegisterSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(2, t("form.name_min")).optional(),
      email: z.string().email(t("form.invalid_email")),
      password: z.string().min(8, t("form.password_min")),
      passwordConfirm: z.string().min(8, t("form.password_required")),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t("form.passwords_match"),
      path: ["passwordConfirm"],
    });

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm = ({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const { register: registerUser, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const registerSchema = createRegisterSchema(t);
  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser(
        data.email,
        data.password,
        data.passwordConfirm,
        data.name
      );
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t("auth.register_failed");
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{t("auth.name")}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t("form.name_placeholder")}
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("form.email_placeholder")}
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t("form.password_placeholder")}
          {...register("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">{t("auth.password_confirm")}</Label>
        <Input
          id="passwordConfirm"
          type="password"
          placeholder={t("form.password_placeholder")}
          {...register("passwordConfirm")}
          disabled={isLoading}
        />
        {errors.passwordConfirm && (
          <p className="text-sm text-destructive">
            {errors.passwordConfirm.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("auth.registering")}
          </>
        ) : (
          t("auth.register")
        )}
      </Button>

      {onSwitchToLogin && (
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.have_account")}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:underline"
          >
            {t("auth.login")}
          </button>
        </p>
      )}
    </form>
  );
};
