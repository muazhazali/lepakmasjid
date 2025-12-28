import { AdminLayout } from "@/components/Admin/AdminLayout";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { useSubmissions } from "@/hooks/use-submissions";
import { useMosques } from "@/hooks/use-mosques";
import { useUsers } from "@/hooks/use-users";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: pendingSubmissions = [] } = useSubmissions("pending");
  const { data: mosquesData } = useMosques({ perPage: 1 });
  const { data: users = [] } = useUsers();
  const mosquesCount = mosquesData?.totalItems || 0;

  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <div>
          <h1 className="font-display text-3xl font-bold mb-8">
            {t("admin.dashboard")}
          </h1>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.pending_submissions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {pendingSubmissions.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.mosques")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{mosquesCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.users")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
};

export default Dashboard;
