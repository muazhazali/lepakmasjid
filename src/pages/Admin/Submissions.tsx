import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import {
  useSubmissions,
  useApproveSubmission,
  useRejectSubmission,
} from "@/hooks/use-submissions";
import { useMosque } from "@/hooks/use-mosques";
import { useAmenities } from "@/hooks/use-amenities";
import { useActivities } from "@/hooks/use-activities";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/stores/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/pocketbase-images";
import { mosqueAmenitiesApi } from "@/lib/api";
import type { Submission, Amenity, Activity } from "@/types";

const Submissions = () => {
  const { t } = useTranslation();
  const { data: submissions = [], isLoading } = useSubmissions("pending");
  const { user } = useAuthStore();
  const approveSubmission = useApproveSubmission();
  const rejectSubmission = useRejectSubmission();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      await approveSubmission.mutateAsync({ id, reviewedBy: user.id });
      toast.success(t("admin.submission_approved"));
    } catch (error) {
      toast.error(t("admin.approve_failed"));
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedSubmissionId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!user || !selectedSubmissionId || !rejectReason.trim()) return;

    // Sanitize input - limit length and trim
    // Note: React automatically escapes content in JSX, so if rejection reasons
    // are ever displayed in the UI, they will be safe from XSS attacks.
    // However, if displayed via dangerouslySetInnerHTML, additional sanitization is required.
    const sanitizedReason = rejectReason.trim().slice(0, 500);

    try {
      await rejectSubmission.mutateAsync({
        id: selectedSubmissionId,
        reviewedBy: user.id,
        reason: sanitizedReason,
      });
      toast.success(t("admin.submission_rejected"));
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedSubmissionId(null);
    } catch (error) {
      toast.error(t("admin.reject_failed"));
    }
  };

  return (
    <AuthGuard requireAdmin>
      <AdminLayout>
        <div>
          <h1 className="font-display text-3xl font-bold mb-8">
            {t("admin.submissions")}
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-muted-foreground">
              {t("admin.no_pending_submissions")}
            </p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {submission.type === "new_mosque"
                          ? t("admin.new_mosque")
                          : t("admin.edit_proposal")}
                      </CardTitle>
                      <Badge variant="secondary">{submission.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.type === "edit_mosque" &&
                    submission.mosque_id ? (
                      <EditComparison submission={submission} />
                    ) : (
                      <NewMosqueView submission={submission} />
                    )}
                    <div className="flex gap-2 mt-6">
                      <Button
                        onClick={() => handleApprove(submission.id)}
                        disabled={approveSubmission.isPending}
                      >
                        {t("admin.approve")}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectClick(submission.id)}
                        disabled={rejectSubmission.isPending}
                      >
                        {t("admin.reject")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.rejection_reason")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                {t("admin.rejection_reason")}
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={
                  t("admin.rejection_reason_placeholder") ||
                  "Please provide a reason for rejection..."
                }
                maxLength={500}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                {rejectReason.length}/500
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason("");
                  setSelectedSubmissionId(null);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectSubmission.isPending}
              >
                {t("admin.reject")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AuthGuard>
  );
};

// Component to show new mosque submission details
const NewMosqueView = ({ submission }: { submission: Submission }) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: amenities = [] } = useAmenities();
  const submissionData = submission.data as Record<string, unknown>;
  const submissionRecord = submission as Record<string, unknown>;
  const submittedAmenities = submissionData.amenities || [];
  const submittedCustomAmenities = submissionData.customAmenities || [];
  const submittedActivities = submissionData.activities || [];

  // Create a map of amenity IDs to amenity objects
  const amenityMap = new Map<string, Amenity>();
  amenities.forEach((amenity) => {
    amenityMap.set(amenity.id, amenity);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p>
          <strong>{t("mosque.name")}:</strong> {submissionData.name || "N/A"}
        </p>
        {submissionData.name_bm && (
          <p>
            <strong>{t("mosque.name_bm")}:</strong> {submissionData.name_bm}
          </p>
        )}
        <p>
          <strong>{t("mosque.address")}:</strong>{" "}
          {submissionData.address || "N/A"}
        </p>
        <p>
          <strong>{t("mosque.state")}:</strong> {submissionData.state || "N/A"}
        </p>
        <p>
          <strong>{t("mosque.latitude")}:</strong> {submissionData.lat ?? "N/A"}
        </p>
        <p>
          <strong>{t("mosque.longitude")}:</strong>{" "}
          {submissionData.lng ?? "N/A"}
        </p>
        {submissionData.description && (
          <div>
            <p>
              <strong>{t("mosque.description")}:</strong>
            </p>
            <p className="text-sm text-muted-foreground ml-4">
              {submissionData.description}
            </p>
          </div>
        )}
        {submissionData.description_bm && (
          <div>
            <p>
              <strong>{t("mosque.description_bm")}:</strong>
            </p>
            <p className="text-sm text-muted-foreground ml-4">
              {submissionData.description_bm}
            </p>
          </div>
        )}
      </div>

      {/* Amenities Section */}
      {(submittedAmenities.length > 0 ||
        submittedCustomAmenities.length > 0) && (
        <div className="space-y-2 pt-4 border-t">
          <p>
            <strong>{t("mosque.amenities")}:</strong>
          </p>
          <div className="space-y-2">
            {submittedAmenities.map((amenity: Record<string, unknown>, index: number) => {
              const amenityObj = amenityMap.get(amenity.amenity_id);
              if (!amenityObj) return null;
              const label =
                language === "bm" ? amenityObj.label_bm : amenityObj.label_en;
              return (
                <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                  <p className="font-medium">{label}</p>
                  {amenity.details?.notes && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {amenity.details.notes}
                    </p>
                  )}
                </div>
              );
            })}
            {submittedCustomAmenities.map((custom: Record<string, unknown>, index: number) => {
              const label =
                language === "bm" ? custom.custom_name : custom.custom_name_en;
              return (
                <div
                  key={`custom-${index}`}
                  className="text-sm bg-muted/50 p-2 rounded"
                >
                  <p className="font-medium">
                    {label}{" "}
                    <span className="text-xs text-muted-foreground">
                      (Custom)
                    </span>
                  </p>
                  {custom.details?.notes && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {custom.details.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {submissionRecord.image && (
        <div>
          <p>
            <strong>{t("mosque.image")}:</strong>
          </p>
          <img
            src={
              getImageUrl(
                submissionRecord,
                submissionRecord.image,
                "300x300",
                "submissions"
              ) || ""
            }
            alt={submissionData.name || "Mosque image"}
            className="mt-2 max-w-xs rounded-lg border border-border"
          />
        </div>
      )}

      {/* Activities Section */}
      {submittedActivities.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <p>
            <strong>{t("mosque.activities")}:</strong>
          </p>
          <div className="space-y-2">
            {submittedActivities.map((activity: Record<string, unknown>, index: number) => {
              const title =
                language === "bm" && activity.title_bm
                  ? activity.title_bm
                  : activity.title;
              const description =
                language === "bm" && activity.description_bm
                  ? activity.description_bm
                  : activity.description;
              return (
                <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                  <p className="font-medium">{title}</p>
                  {description && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{activity.type}</Badge>
                    {activity.status && (
                      <Badge
                        variant={
                          activity.status === "active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Component to show before/after comparison for edit submissions
const EditComparison = ({ submission }: { submission: Submission }) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: currentMosque, isLoading } = useMosque(
    submission.mosque_id || null
  );
  const { data: amenities = [] } = useAmenities();
  const { data: currentActivities = [] } = useActivities(
    submission.mosque_id || null
  );
  const [currentAmenities, setCurrentAmenities] = useState<Array<Record<string, unknown>>>([]);
  const proposedData = submission.data as Record<string, unknown>;
  const submissionRecord = submission as Record<string, unknown>;
  const proposedAmenities = proposedData.amenities || [];
  const proposedCustomAmenities = proposedData.customAmenities || [];
  const proposedActivities = proposedData.activities || [];

  // Load current amenities
  useEffect(() => {
    if (currentMosque?.id) {
      mosqueAmenitiesApi
        .getByMosque(currentMosque.id)
        .then((amenities) => {
          setCurrentAmenities(amenities);
        })
        .catch((err) => {
          console.error("Failed to load current amenities:", err);
          setCurrentAmenities([]);
        });
    }
  }, [currentMosque?.id]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!currentMosque) {
    return (
      <div className="text-destructive">
        {t("admin.mosque_not_found") || "Mosque not found"}
      </div>
    );
  }

  // Helper to check if a field has changed
  const hasChanged = (field: string) => {
    const currentMosqueObj = currentMosque as Record<string, unknown>;
    const current = currentMosqueObj[field];
    const proposed = proposedData[field];
    if (current === undefined && proposed === undefined) return false;
    if (current === undefined || proposed === undefined) return true;
    return String(current) !== String(proposed);
  };

  // Helper to format field value
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return value.toString();
    return String(value);
  };

  const fields = [
    { key: "name", label: t("mosque.name") },
    { key: "name_bm", label: t("mosque.name_bm") },
    { key: "address", label: t("mosque.address") },
    { key: "state", label: t("mosque.state") },
    { key: "lat", label: t("mosque.latitude") },
    { key: "lng", label: t("mosque.longitude") },
    { key: "description", label: t("mosque.description") },
    { key: "description_bm", label: t("mosque.description_bm") },
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList>
          <TabsTrigger value="comparison">
            {t("admin.comparison") || "Comparison"}
          </TabsTrigger>
          <TabsTrigger value="current">
            {t("admin.current") || "Current"}
          </TabsTrigger>
          <TabsTrigger value="proposed">
            {t("admin.proposed") || "Proposed"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3 text-muted-foreground">
                {t("admin.current_values") || "Current Values"}
              </h3>
              <div className="space-y-3">
                {fields.map(({ key, label }) => {
                  const changed = hasChanged(key);
                  const currentMosqueObj = currentMosque as Record<string, unknown>;
                  const currentValue = currentMosqueObj[key];

                  return (
                    <div
                      key={key}
                      className={
                        changed
                          ? "bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800"
                          : ""
                      }
                    >
                      <p className="text-sm font-medium">{label}:</p>
                      <p className="text-sm text-muted-foreground">
                        {formatValue(currentValue)}
                      </p>
                    </div>
                  );
                })}
                {/* Current Image */}
                <div
                  className={
                    submissionRecord.image
                      ? "bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800"
                      : ""
                  }
                >
                  <p className="text-sm font-medium mb-2">
                    {t("mosque.image")}:
                  </p>
                  {currentMosque.image ? (
                    <img
                      src={
                        getImageUrl(
                          currentMosque,
                          currentMosque.image,
                          "200x200",
                          "mosques"
                        ) || ""
                      }
                      alt={currentMosque.name}
                      className="max-w-xs rounded-lg border border-border"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No image</p>
                  )}
                </div>

                {/* Current Amenities */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    {t("mosque.amenities")}:
                  </p>
                  {currentAmenities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No amenities
                    </p>
                  ) : (
                    <AmenitiesList
                      amenities={currentAmenities}
                      allAmenities={amenities}
                      language={language}
                    />
                  )}
                </div>

                {/* Current Activities */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    {t("mosque.activities")}:
                  </p>
                  {currentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No activities
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentActivities.map((activity: Activity) => {
                        const title =
                          language === "bm" && activity.title_bm
                            ? activity.title_bm
                            : activity.title;
                        return (
                          <div
                            key={activity.id}
                            className="text-sm bg-muted/50 p-2 rounded"
                          >
                            <p className="font-medium">{title}</p>
                            {activity.description && (
                              <p className="text-muted-foreground text-xs mt-1">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{activity.type}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">
                {t("admin.proposed_values") || "Proposed Values"}
              </h3>
              <div className="space-y-3">
                {fields.map(({ key, label }) => {
                  const changed = hasChanged(key);
                  const proposedValue = proposedData[key];

                  return (
                    <div
                      key={key}
                      className={
                        changed
                          ? "bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800"
                          : ""
                      }
                    >
                      <p className="text-sm font-medium">{label}:</p>
                      <p className="text-sm text-muted-foreground">
                        {formatValue(proposedValue)}
                      </p>
                    </div>
                  );
                })}
                {/* Proposed Image */}
                <div
                  className={
                    submissionRecord.image || currentMosque.image
                      ? "bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800"
                      : ""
                  }
                >
                  <p className="text-sm font-medium mb-2">
                    {t("mosque.image")}:
                  </p>
                  {submissionRecord.image ? (
                    <img
                      src={
                        getImageUrl(
                          submissionRecord,
                          submissionRecord.image,
                          "200x200",
                          "submissions"
                        ) || ""
                      }
                      alt={proposedData.name || "Proposed mosque image"}
                      className="max-w-xs rounded-lg border border-border"
                    />
                  ) : currentMosque.image ? (
                    <p className="text-sm text-muted-foreground">
                      No new image (keeping current)
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No image</p>
                  )}
                </div>

                {/* Proposed Amenities */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    {t("mosque.amenities")}:
                  </p>
                  {proposedAmenities.length === 0 &&
                  proposedCustomAmenities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No amenities
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {proposedAmenities.map((amenity: Record<string, unknown>, index: number) => {
                        const amenityObj = amenities.find(
                          (a) => a.id === amenity.amenity_id
                        );
                        if (!amenityObj) return null;
                        const label =
                          language === "bm"
                            ? amenityObj.label_bm
                            : amenityObj.label_en;
                        const isNew = !currentAmenities.some(
                          (ca) => ca.amenity_id === amenity.amenity_id
                        );
                        return (
                          <div
                            key={index}
                            className={`text-sm p-2 rounded ${isNew ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" : "bg-muted/50"}`}
                          >
                            <p className="font-medium">
                              {label}{" "}
                              {isNew && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  (New)
                                </span>
                              )}
                            </p>
                            {amenity.details?.notes && (
                              <p className="text-muted-foreground text-xs mt-1">
                                {amenity.details.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      {proposedCustomAmenities.map(
                        (custom: Record<string, unknown>, index: number) => {
                          const label =
                            language === "bm"
                              ? custom.custom_name
                              : custom.custom_name_en;
                          return (
                            <div
                              key={`custom-${index}`}
                              className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800"
                            >
                              <p className="font-medium">
                                {label}{" "}
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  (New Custom)
                                </span>
                              </p>
                              {custom.details?.notes && (
                                <p className="text-muted-foreground text-xs mt-1">
                                  {custom.details.notes}
                                </p>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Proposed Activities */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    {t("mosque.activities")}:
                  </p>
                  {proposedActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No activities
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {proposedActivities.map(
                        (activity: Record<string, unknown>, index: number) => {
                          const title =
                            language === "bm" && activity.title_bm
                              ? activity.title_bm
                              : activity.title;
                          const description =
                            language === "bm" && activity.description_bm
                              ? activity.description_bm
                              : activity.description;
                          const isNew = !currentActivities.some(
                            (ca) => ca.title === activity.title
                          );
                          return (
                            <div
                              key={index}
                              className={`text-sm p-2 rounded ${isNew ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" : "bg-muted/50"}`}
                            >
                              <p className="font-medium">
                                {title}{" "}
                                {isNew && (
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    (New)
                                  </span>
                                )}
                              </p>
                              {description && (
                                <p className="text-muted-foreground text-xs mt-1">
                                  {description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">
                                  {activity.type}
                                </Badge>
                                {activity.status && (
                                  <Badge
                                    variant={
                                      activity.status === "active"
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {activity.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          <div className="space-y-2">
            <p>
              <strong>{t("mosque.name")}:</strong> {currentMosque.name}
            </p>
            {currentMosque.name_bm && (
              <p>
                <strong>{t("mosque.name_bm")}:</strong> {currentMosque.name_bm}
              </p>
            )}
            <p>
              <strong>{t("mosque.address")}:</strong> {currentMosque.address}
            </p>
            <p>
              <strong>{t("mosque.state")}:</strong> {currentMosque.state}
            </p>
            <p>
              <strong>{t("mosque.latitude")}:</strong> {currentMosque.lat}
            </p>
            <p>
              <strong>{t("mosque.longitude")}:</strong> {currentMosque.lng}
            </p>
            {currentMosque.description && (
              <div>
                <p>
                  <strong>{t("mosque.description")}:</strong>
                </p>
                <p className="text-sm text-muted-foreground ml-4">
                  {currentMosque.description}
                </p>
              </div>
            )}
            {currentMosque.description_bm && (
              <div>
                <p>
                  <strong>{t("mosque.description_bm")}:</strong>
                </p>
                <p className="text-sm text-muted-foreground ml-4">
                  {currentMosque.description_bm}
                </p>
              </div>
            )}
            <div>
              <p>
                <strong>{t("mosque.image")}:</strong>
              </p>
              {currentMosque.image ? (
                <img
                  src={
                    getImageUrl(
                      currentMosque,
                      currentMosque.image,
                      "300x300",
                      "mosques"
                    ) || ""
                  }
                  alt={currentMosque.name}
                  className="mt-2 max-w-xs rounded-lg border border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No image</p>
              )}
            </div>
            <div className="pt-4 border-t">
              <p>
                <strong>{t("mosque.amenities")}:</strong>
              </p>
              {currentAmenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No amenities</p>
              ) : (
                <AmenitiesList
                  amenities={currentAmenities}
                  allAmenities={amenities}
                  language={language}
                />
              )}
            </div>
            <div className="pt-4 border-t">
              <p>
                <strong>{t("mosque.activities")}:</strong>
              </p>
              {currentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activities</p>
              ) : (
                <div className="space-y-2">
                  {currentActivities.map((activity: Activity) => {
                    const title =
                      language === "bm" && activity.title_bm
                        ? activity.title_bm
                        : activity.title;
                    return (
                      <div
                        key={activity.id}
                        className="text-sm bg-muted/50 p-2 rounded"
                      >
                        <p className="font-medium">{title}</p>
                        {activity.description && (
                          <p className="text-muted-foreground text-xs mt-1">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{activity.type}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proposed" className="space-y-4">
          <div className="space-y-2">
            <p>
              <strong>{t("mosque.name")}:</strong> {proposedData.name || "N/A"}
            </p>
            {proposedData.name_bm && (
              <p>
                <strong>{t("mosque.name_bm")}:</strong> {proposedData.name_bm}
              </p>
            )}
            <p>
              <strong>{t("mosque.address")}:</strong>{" "}
              {proposedData.address || "N/A"}
            </p>
            <p>
              <strong>{t("mosque.state")}:</strong>{" "}
              {proposedData.state || "N/A"}
            </p>
            <p>
              <strong>{t("mosque.latitude")}:</strong>{" "}
              {proposedData.lat ?? "N/A"}
            </p>
            <p>
              <strong>{t("mosque.longitude")}:</strong>{" "}
              {proposedData.lng ?? "N/A"}
            </p>
            {proposedData.description && (
              <div>
                <p>
                  <strong>{t("mosque.description")}:</strong>
                </p>
                <p className="text-sm text-muted-foreground ml-4">
                  {proposedData.description}
                </p>
              </div>
            )}
            {proposedData.description_bm && (
              <div>
                <p>
                  <strong>{t("mosque.description_bm")}:</strong>
                </p>
                <p className="text-sm text-muted-foreground ml-4">
                  {proposedData.description_bm}
                </p>
              </div>
            )}
            <div>
              <p>
                <strong>{t("mosque.image")}:</strong>
              </p>
              {submissionRecord.image ? (
                <img
                  src={
                    getImageUrl(
                      submissionRecord,
                      submissionRecord.image,
                      "300x300",
                      "submissions"
                    ) || ""
                  }
                  alt={proposedData.name || "Proposed mosque image"}
                  className="mt-2 max-w-xs rounded-lg border border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  No new image
                </p>
              )}
            </div>
            <div className="pt-4 border-t">
              <p>
                <strong>{t("mosque.amenities")}:</strong>
              </p>
              {proposedAmenities.length === 0 &&
              proposedCustomAmenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No amenities</p>
              ) : (
                <div className="space-y-2">
                  {proposedAmenities.map((amenity: Record<string, unknown>, index: number) => {
                    const amenityObj = amenities.find(
                      (a) => a.id === amenity.amenity_id
                    );
                    if (!amenityObj) return null;
                    const label =
                      language === "bm"
                        ? amenityObj.label_bm
                        : amenityObj.label_en;
                    return (
                      <div
                        key={index}
                        className="text-sm bg-muted/50 p-2 rounded"
                      >
                        <p className="font-medium">{label}</p>
                        {amenity.details?.notes && (
                          <p className="text-muted-foreground text-xs mt-1">
                            {amenity.details.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {proposedCustomAmenities.map((custom: Record<string, unknown>, index: number) => {
                    const label =
                      language === "bm"
                        ? custom.custom_name
                        : custom.custom_name_en;
                    return (
                      <div
                        key={`custom-${index}`}
                        className="text-sm bg-muted/50 p-2 rounded"
                      >
                        <p className="font-medium">
                          {label}{" "}
                          <span className="text-xs text-muted-foreground">
                            (Custom)
                          </span>
                        </p>
                        {custom.details?.notes && (
                          <p className="text-muted-foreground text-xs mt-1">
                            {custom.details.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-4 border-t">
              <p>
                <strong>{t("mosque.activities")}:</strong>
              </p>
              {proposedActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activities</p>
              ) : (
                <div className="space-y-2">
                  {proposedActivities.map((activity: Record<string, unknown>, index: number) => {
                    const title =
                      language === "bm" && activity.title_bm
                        ? activity.title_bm
                        : activity.title;
                    const description =
                      language === "bm" && activity.description_bm
                        ? activity.description_bm
                        : activity.description;
                    return (
                      <div
                        key={index}
                        className="text-sm bg-muted/50 p-2 rounded"
                      >
                        <p className="font-medium">{title}</p>
                        {description && (
                          <p className="text-muted-foreground text-xs mt-1">
                            {description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{activity.type}</Badge>
                          {activity.status && (
                            <Badge
                              variant={
                                activity.status === "active"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component to display amenities list
const AmenitiesList = ({
  amenities,
  allAmenities,
  language,
}: {
  amenities: Array<Record<string, unknown>>;
  allAmenities: Amenity[];
  language: string;
}) => {
  const amenityMap = new Map<string, Amenity>();
  allAmenities.forEach((amenity) => {
    amenityMap.set(amenity.id, amenity);
  });

  return (
    <div className="space-y-2">
      {amenities.map((ma) => {
        if (ma.amenity_id) {
          const amenityObj = amenityMap.get(ma.amenity_id);
          if (!amenityObj) return null;
          const label =
            language === "bm" ? amenityObj.label_bm : amenityObj.label_en;
          return (
            <div key={ma.id} className="text-sm bg-muted/50 p-2 rounded">
              <p className="font-medium">{label}</p>
              {ma.details?.notes && (
                <p className="text-muted-foreground text-xs mt-1">
                  {ma.details.notes}
                </p>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default Submissions;
