import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "@/hooks/use-translation";
import { useUpdateProfile, useUpdatePassword } from "@/hooks/use-users";
import { useMySubmissions } from "@/hooks/use-submissions";
import { toast } from "sonner";
import {
  User,
  Lock,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { SkipLink } from "@/components/SkipLink";

const profileSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.name_min")).optional().or(z.literal("")),
    email: z.string().email(t("form.invalid_email")),
  });

const passwordSchema = (t: (key: string) => string) =>
  z
    .object({
      oldPassword: z.string().min(1, t("profile.current_password_required")),
      newPassword: z.string().min(8, t("form.password_min")),
      passwordConfirm: z.string().min(1, t("form.password_required")),
    })
    .refine((data) => data.newPassword === data.passwordConfirm, {
      message: t("form.passwords_match"),
      path: ["passwordConfirm"],
    });

const Profile = () => {
  const { user, checkAuth } = useAuthStore();
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const [activeTab, setActiveTab] = useState("profile");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | undefined
  >(undefined);

  const { data: allSubmissions = [], isLoading: isLoadingSubmissions } =
    useMySubmissions();

  // Calculate stats
  const stats = {
    total: allSubmissions.length,
    pending: allSubmissions.filter((s) => s.status === "pending").length,
    approved: allSubmissions.filter((s) => s.status === "approved").length,
    rejected: allSubmissions.filter((s) => s.status === "rejected").length,
  };

  // Filter submissions client-side
  const filteredSubmissions = statusFilter
    ? allSubmissions.filter((s) => s.status === statusFilter)
    : allSubmissions;

  const profileFormSchema = profileSchema(t);
  type ProfileFormData = z.infer<typeof profileFormSchema>;

  const passwordFormSchema = passwordSchema(t);
  type PasswordFormData = z.infer<typeof passwordFormSchema>;

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, resetProfile]);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        name: data.name || undefined,
        email: data.email,
      });
      toast.success(t("profile.update_success"));
      checkAuth(); // Refresh auth store
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("profile.update_failed");
      toast.error(errorMessage);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await updatePassword.mutateAsync({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        passwordConfirm: data.passwordConfirm,
      });
      toast.success(t("profile.password_update_success"));
      resetPassword();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("profile.password_update_failed");
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("admin.approved")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t("admin.rejected")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {t("admin.pending")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AuthGuard>
      <Helmet>
        <title>{t("profile.title")} - lepakmasjid</title>
        <meta name="description" content={t("profile.meta_description")} />
      </Helmet>
      <SkipLink />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container-main py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-3xl font-bold mb-8">
              {t("profile.title")}
            </h1>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  {t("profile.profile_tab")}
                </TabsTrigger>
                <TabsTrigger value="submissions">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("profile.submissions_tab")}
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6 mt-6">
                {/* Profile Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t("profile.profile_information")}
                    </CardTitle>
                    <CardDescription>
                      {t("profile.profile_information_desc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleProfileSubmit(onProfileSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("auth.name")}</Label>
                        <Input
                          id="name"
                          {...registerProfile("name")}
                          placeholder={t("form.name_placeholder")}
                        />
                        {profileErrors.name && (
                          <p className="text-sm text-destructive">
                            {profileErrors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t("auth.email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          {...registerProfile("email")}
                          placeholder={t("form.email_placeholder")}
                        />
                        {profileErrors.email && (
                          <p className="text-sm text-destructive">
                            {profileErrors.email.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="w-full md:w-auto"
                      >
                        {updateProfile.isPending
                          ? t("common.loading")
                          : t("common.save")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Password Change Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      {t("profile.change_password")}
                    </CardTitle>
                    <CardDescription>
                      {t("profile.change_password_desc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">
                          {t("profile.current_password")}
                        </Label>
                        <Input
                          id="oldPassword"
                          type="password"
                          {...registerPassword("oldPassword")}
                          placeholder={t("form.password_placeholder")}
                        />
                        {passwordErrors.oldPassword && (
                          <p className="text-sm text-destructive">
                            {passwordErrors.oldPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">
                          {t("profile.new_password")}
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...registerPassword("newPassword")}
                          placeholder={t("form.password_placeholder")}
                        />
                        {passwordErrors.newPassword && (
                          <p className="text-sm text-destructive">
                            {passwordErrors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passwordConfirm">
                          {t("auth.password_confirm")}
                        </Label>
                        <Input
                          id="passwordConfirm"
                          type="password"
                          {...registerPassword("passwordConfirm")}
                          placeholder={t("form.password_placeholder")}
                        />
                        {passwordErrors.passwordConfirm && (
                          <p className="text-sm text-destructive">
                            {passwordErrors.passwordConfirm.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={updatePassword.isPending}
                        className="w-full md:w-auto"
                      >
                        {updatePassword.isPending
                          ? t("common.loading")
                          : t("profile.update_password")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="space-y-6 mt-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("profile.total_submissions")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("admin.pending")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("admin.approved")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.approved}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t("admin.rejected")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.rejected}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(undefined)}
                  >
                    {t("profile.all")}
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >
                    {t("admin.pending")}
                  </Button>
                  <Button
                    variant={
                      statusFilter === "approved" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("approved")}
                  >
                    {t("admin.approved")}
                  </Button>
                  <Button
                    variant={
                      statusFilter === "rejected" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("rejected")}
                  >
                    {t("admin.rejected")}
                  </Button>
                </div>

                {/* Submissions List */}
                {isLoadingSubmissions ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {statusFilter
                        ? t("profile.no_submissions_status", {
                            status: t(`admin.${statusFilter}`),
                          })
                        : t("profile.no_submissions")}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredSubmissions.map((submission) => (
                      <Card key={submission.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>
                              {submission.type === "new_mosque"
                                ? t("admin.new_mosque")
                                : t("admin.edit_proposal")}
                            </CardTitle>
                            {getStatusBadge(submission.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p>
                              <strong>{t("mosque.name")}:</strong>{" "}
                              {((submission.data as Record<string, unknown>).name as string) || "N/A"}
                            </p>
                            <p>
                              <strong>{t("mosque.address")}:</strong>{" "}
                              {((submission.data as Record<string, unknown>).address as string) || "N/A"}
                            </p>
                            <p>
                              <strong>{t("mosque.state")}:</strong>{" "}
                              {((submission.data as Record<string, unknown>).state as string) || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>{t("profile.submitted_at")}:</strong>{" "}
                              {new Date(
                                submission.submitted_at
                              ).toLocaleDateString()}
                            </p>
                            {submission.status === "rejected" &&
                              submission.rejection_reason && (
                                <Alert variant="destructive" className="mt-4">
                                  <AlertDescription>
                                    <strong>
                                      {t("admin.rejection_reason")}:
                                    </strong>{" "}
                                    {submission.rejection_reason}
                                  </AlertDescription>
                                </Alert>
                              )}
                            {submission.status === "approved" &&
                              submission.reviewed_at && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>{t("profile.reviewed_at")}:</strong>{" "}
                                  {new Date(
                                    submission.reviewed_at
                                  ).toLocaleDateString()}
                                </p>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};

export default Profile;
