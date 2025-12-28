import { AdminLayout } from "@/components/Admin/AdminLayout";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { useAuditLogs } from "@/hooks/use-audit";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const AuditLog = () => {
  const { t } = useTranslation();
  const { data: logs = [], isLoading } = useAuditLogs();

  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <div>
          <h1 className="font-display text-3xl font-bold mb-8">
            {t("admin.audit_log")}
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">{t("admin.no_audit_logs")}</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{log.action}</CardTitle>
                      <Badge variant="secondary">
                        {format(new Date(log.timestamp), "PPP p")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.entity")}: {log.entity_type} ({log.entity_id})
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
};

export default AuditLog;
