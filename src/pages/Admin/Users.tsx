import { AdminLayout } from "@/components/Admin/AdminLayout";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { useUsers, useDeleteUser, useUpdateUser } from "@/hooks/use-users";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, CheckCircle2, XCircle, Calendar, Clock } from "lucide-react";

const Users = () => {
  const { t } = useTranslation();
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const handleVerifiedToggle = async (id: string, currentVerified: boolean) => {
    try {
      await updateUser.mutateAsync({
        id,
        data: { verified: !currentVerified },
      });
      toast.success(
        !currentVerified
          ? t("admin.user_verified") || "User verified"
          : t("admin.user_unverified") || "User unverified"
      );
    } catch (error) {
      toast.error(t("admin.update_failed") || "Failed to update user");
    }
  };

  const handleDelete = async (id: string, email: string) => {
    try {
      await deleteUser.mutateAsync(id);
      toast.success(
        t("admin.user_deleted") || `User ${email} deleted successfully`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("admin.delete_failed") || "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <div>
          <h1 className="font-display text-3xl font-bold mb-8">
            {t("admin.users")}
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle>{user.name || user.email}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.verified ? "default" : "destructive"}
                        >
                          {user.verified
                            ? t("admin.verified") || "Verified"
                            : t("admin.unverified") || "Unverified"}
                        </Badge>
                        {user.role === "admin" && (
                          <Badge variant="secondary">
                            {t("admin.role") || "Admin"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Verified Toggle Button */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {t("admin.verified") || "Verified"}
                        </Label>
                        <Button
                          variant={user.verified ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            handleVerifiedToggle(user.id, user.verified)
                          }
                          disabled={updateUser.isPending}
                          className="flex items-center gap-2"
                        >
                          {user.verified ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              {t("admin.verified") || "Verified"}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              {t("admin.unverified") || "Unverified"}
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Timestamps */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Created:</span>
                          <span>{formatDate(user.created)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Updated:</span>
                          <span>{formatDate(user.updated)}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="pt-2 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteUser.isPending}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("admin.remove") || "Remove"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("admin.confirm_delete") ||
                                  "Confirm Delete User"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("admin.delete_user_confirmation") ||
                                  `Are you sure you want to delete user "${user.email}"? This action cannot be undone.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("common.cancel") || "Cancel"}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(user.id, user.email)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("admin.delete") || "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
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

export default Users;
