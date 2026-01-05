import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCreateSubmission } from "@/hooks/use-submissions";
import { useMosque } from "@/hooks/use-mosques";
import { useAmenities } from "@/hooks/use-amenities";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/stores/language";
import { SkipLink } from "@/components/SkipLink";
import { AuthDialog } from "@/components/Auth/AuthDialog";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/pocketbase-images";
import { X, Plus } from "lucide-react";
import type {
  Amenity,
  MosqueAmenityDetails,
  Activity,
  ActivitySchedule,
} from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MALAYSIAN_STATES } from "@/types";

const createMosqueSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("form.name_required")),
    name_bm: z.string().optional(),
    address: z.string().min(5, t("form.address_min")),
    contact: z.string().optional(),
    state: z.enum(
      MALAYSIAN_STATES as [string, ...string[]],
      {
        required_error: t("form.state_required"),
      }
    ),
    lat: z.number().min(-90, t("form.lat_range")).max(90, t("form.lat_range")),
    lng: z
      .number()
      .min(-180, t("form.lng_range"))
      .max(180, t("form.lng_range")),
    description: z.string().optional(),
    description_bm: z.string().optional(),
  });

interface SelectedAmenity {
  amenity_id: string;
  details: MosqueAmenityDetails;
}

interface CustomAmenity {
  key: string;
  label_en: string;
  label_bm: string;
  icon?: string;
  details: MosqueAmenityDetails;
}

interface ActivityFormData {
  title: string;
  title_bm?: string;
  description?: string;
  description_bm?: string;
  type: "one_off" | "recurring" | "fixed";
  schedule_json: ActivitySchedule;
  start_date?: string;
  end_date?: string;
  status: "active" | "cancelled";
}

const Submit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("edit");
  const { data: existingMosque } = useMosque(editId);
  const { data: amenities = [], isLoading: amenitiesLoading } = useAmenities();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const createSubmission = useCreateSubmission();
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<MosqueFormData | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Amenities state
  const [selectedAmenities, setSelectedAmenities] = useState<
    Map<string, SelectedAmenity>
  >(new Map());
  const [customAmenities, setCustomAmenities] = useState<CustomAmenity[]>([]);
  const [showCustomAmenityForm, setShowCustomAmenityForm] = useState(false);
  const [newCustomAmenity, setNewCustomAmenity] = useState<
    Partial<CustomAmenity>
  >({
    key: "",
    label_en: "",
    label_bm: "",
    icon: "",
    details: { notes: "" },
  });

  // Activities state
  const [activities, setActivities] = useState<ActivityFormData[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<ActivityFormData>>({
    title: "",
    title_bm: "",
    description: "",
    description_bm: "",
    type: "one_off",
    schedule_json: {},
    start_date: "",
    end_date: "",
    status: "active",
  });

  const mosqueSchema = createMosqueSchema(t);
  type MosqueFormData = z.infer<typeof mosqueSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MosqueFormData>({
    resolver: zodResolver(mosqueSchema),
  });

  const selectedState = watch("state");

  // Define handleFormSubmission with useCallback to use in useEffect
  const handleFormSubmission = useCallback(
    async (data: MosqueFormData) => {
      if (!user) {
        return;
      }

      // Validate image if provided
      if (imageFile) {
        const validationError = validateImageFile(imageFile);
        if (validationError) {
          setImageError(validationError);
          return;
        }
      }

      try {
        setError(null);
        setImageError(null);

        // Prepare amenities data
        const amenitiesData = Array.from(selectedAmenities.values()).map(
          (amenity) => ({
            amenity_id: amenity.amenity_id,
            details: amenity.details,
            verified: false,
          })
        );

        const customAmenitiesData = customAmenities.map((custom) => ({
          custom_name: custom.label_bm,
          custom_name_en: custom.label_en,
          custom_icon: custom.icon,
          key: custom.key,
          details: custom.details,
        }));

        // Prepare activities data
        const activitiesData = activities.map((activity) => ({
          title: activity.title,
          title_bm: activity.title_bm || undefined,
          description: activity.description || undefined,
          description_bm: activity.description_bm || undefined,
          type: activity.type,
          schedule_json: activity.schedule_json,
          start_date: activity.start_date || undefined,
          end_date: activity.end_date || undefined,
          status: activity.status,
        }));

        await createSubmission.mutateAsync({
          type: editId ? "edit_mosque" : "new_mosque",
          mosque_id: editId || undefined,
          data: {
            ...data,
            amenities: amenitiesData,
            customAmenities: customAmenitiesData,
            activities: activitiesData,
            // Don't include image in data - it's handled separately via FormData
          },
          status: "pending",
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
          imageFile, // Pass image file separately for FormData handling
        });

        toast.success(t("submit.success"));
        navigate("/explore");
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : t("submit.error");
        setError(errorMessage);
      }
    },
    [
      user,
      imageFile,
      editId,
      createSubmission,
      t,
      navigate,
      selectedAmenities,
      customAmenities,
      activities,
    ]
  );

  // Check if user is logged in after auth dialog closes
  useEffect(() => {
    if (!showAuthDialog) {
      if (user && pendingFormData) {
        // User logged in, submit the pending form
        handleFormSubmission(pendingFormData);
        setPendingFormData(null);
      } else if (!user && pendingFormData) {
        // Dialog closed without login, clear pending data
        setPendingFormData(null);
      }
    }
  }, [showAuthDialog, user, pendingFormData, handleFormSubmission]);

  useEffect(() => {
    if (existingMosque) {
      setValue("name", existingMosque.name);
      setValue("name_bm", existingMosque.name_bm || "");
      setValue("address", existingMosque.address);
      setValue("contact", existingMosque.contact || "");
      setValue("state", existingMosque.state);
      setValue("lat", existingMosque.lat);
      setValue("lng", existingMosque.lng);
      setValue("description", existingMosque.description || "");
      setValue("description_bm", existingMosque.description_bm || "");

      // Load existing amenities
      const amenityMap = new Map<string, SelectedAmenity>();
      if (existingMosque.amenities) {
        existingMosque.amenities.forEach((amenity) => {
          amenityMap.set(amenity.id, {
            amenity_id: amenity.id,
            details: amenity.details || { notes: "" },
          });
        });
      }
      if (existingMosque.customAmenities) {
        existingMosque.customAmenities.forEach((custom) => {
          const customAmenity: CustomAmenity = {
            key: custom.details.custom_name || "",
            label_en: custom.details.custom_name_en || "",
            label_bm: custom.details.custom_name || "",
            icon: custom.details.custom_icon,
            details: custom.details,
          };
          setCustomAmenities((prev) => [...prev, customAmenity]);
        });
      }
      setSelectedAmenities(amenityMap);

      // Load existing activities
      if (existingMosque.activities && existingMosque.activities.length > 0) {
        const existingActivities: ActivityFormData[] =
          existingMosque.activities.map((activity: Activity) => ({
            title: activity.title,
            title_bm: activity.title_bm || "",
            description: activity.description || "",
            description_bm: activity.description_bm || "",
            type: activity.type,
            schedule_json: activity.schedule_json || {},
            start_date: activity.start_date || "",
            end_date: activity.end_date || "",
            status: activity.status,
          }));
        setActivities(existingActivities);
      }
    }
  }, [existingMosque, setValue]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate image file securely
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Additional security: Check file extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      setImageError(t("submit.image_invalid_extension"));
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Additional security: Verify it's actually an image by checking MIME type
    if (!file.type.startsWith("image/")) {
      setImageError(t("submit.image_invalid_type"));
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    const newMap = new Map(selectedAmenities);
    if (newMap.has(amenityId)) {
      newMap.delete(amenityId);
    } else {
      newMap.set(amenityId, {
        amenity_id: amenityId,
        details: { notes: "" },
      });
    }
    setSelectedAmenities(newMap);
  };

  const handleAmenityDetailsChange = (amenityId: string, notes: string) => {
    const newMap = new Map(selectedAmenities);
    const existing = newMap.get(amenityId);
    if (existing) {
      newMap.set(amenityId, {
        ...existing,
        details: { ...existing.details, notes },
      });
    }
    setSelectedAmenities(newMap);
  };

  const handleAddCustomAmenity = () => {
    if (
      !newCustomAmenity.key ||
      !newCustomAmenity.label_en ||
      !newCustomAmenity.label_bm
    ) {
      toast.error("Please fill in all required fields for custom amenity");
      return;
    }

    // Validate key format
    if (!/^[a-z0-9_]+$/.test(newCustomAmenity.key)) {
      toast.error(
        "Key must be lowercase letters, numbers, and underscores only"
      );
      return;
    }

    // Check if key already exists in amenities
    const keyExists = amenities.some((a) => a.key === newCustomAmenity.key);
    if (keyExists) {
      toast.error("This key already exists. Please use a different key.");
      return;
    }

    // Check if key already exists in custom amenities
    const customKeyExists = customAmenities.some(
      (c) => c.key === newCustomAmenity.key
    );
    if (customKeyExists) {
      toast.error("This key is already added. Please use a different key.");
      return;
    }

    setCustomAmenities([
      ...customAmenities,
      {
        key: newCustomAmenity.key,
        label_en: newCustomAmenity.label_en,
        label_bm: newCustomAmenity.label_bm,
        icon: newCustomAmenity.icon || "circle",
        details: newCustomAmenity.details || { notes: "" },
      },
    ]);

    // Reset form
    setNewCustomAmenity({
      key: "",
      label_en: "",
      label_bm: "",
      icon: "",
      details: { notes: "" },
    });
    setShowCustomAmenityForm(false);
  };

  const handleRemoveCustomAmenity = (index: number) => {
    setCustomAmenities(customAmenities.filter((_, i) => i !== index));
  };

  const handleCustomAmenityDetailsChange = (index: number, notes: string) => {
    const updated = [...customAmenities];
    updated[index] = {
      ...updated[index],
      details: { ...updated[index].details, notes },
    };
    setCustomAmenities(updated);
  };

  // Activity handlers
  const handleAddActivity = () => {
    if (!newActivity.title || !newActivity.type) {
      toast.error("Please fill in required fields (Title and Type)");
      return;
    }

    // Validate schedule_json based on type
    if (newActivity.type === "one_off") {
      if (!newActivity.schedule_json?.date) {
        toast.error("Please provide a date for one-time events");
        return;
      }
    } else if (newActivity.type === "recurring") {
      if (!newActivity.schedule_json?.recurrence) {
        toast.error("Please select a recurrence pattern");
        return;
      }
    }

    setActivities([...activities, newActivity as ActivityFormData]);

    // Reset form
    setNewActivity({
      title: "",
      title_bm: "",
      description: "",
      description_bm: "",
      type: "one_off",
      schedule_json: {},
      start_date: "",
      end_date: "",
      status: "active",
    });
    setShowActivityForm(false);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityFieldChange = (
    field: keyof ActivityFormData,
    value: ActivityFormData[keyof ActivityFormData]
  ) => {
    setNewActivity((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleScheduleJsonChange = (
    field: keyof ActivitySchedule,
    value: ActivitySchedule[keyof ActivitySchedule]
  ) => {
    setNewActivity((prev) => ({
      ...prev,
      schedule_json: {
        ...prev.schedule_json,
        [field]: value,
      },
    }));
  };

  const onSubmit = async (data: MosqueFormData) => {
    if (!user) {
      // Show auth dialog instead of error message
      setPendingFormData(data);
      setShowAuthDialog(true);
      return;
    }

    // User is logged in, proceed with submission
    await handleFormSubmission(data);
  };

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>
          {editId ? t("meta.edit_title") : t("meta.submit_title")} - LepakMasjid
        </title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main id="main-content" className="flex-1">
          <div className="container-main py-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
              {editId ? t("submit.edit_title") : t("submit.title")}
            </h1>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 max-w-2xl"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("submit.name_en")} *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g., Al-Khairiah Mosque"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_bm">{t("submit.name_bm")}</Label>
                  <Input
                    id="name_bm"
                    {...register("name_bm")}
                    placeholder="e.g., Masjid Al-Khairiah"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("submit.address")} *</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="e.g., Jalan Bunga Raya, 54200 Kuala Lumpur"
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">{t("submit.contact")}</Label>
                <Input
                  id="contact"
                  {...register("contact")}
                  placeholder="e.g., 03-9105 3524"
                />
                {errors.contact && (
                  <p className="text-sm text-destructive">
                    {errors.contact.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">{t("submit.state")} *</Label>
                <Select
                  value={selectedState || ""}
                  onValueChange={(value) => setValue("state", value, { shouldValidate: true })}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder={t("submit.state_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {MALAYSIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-destructive">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">{t("submit.latitude")} *</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    {...register("lat", { valueAsNumber: true })}
                    placeholder="e.g., 3.1390"
                  />
                  {errors.lat && (
                    <p className="text-sm text-destructive">
                      {errors.lat.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lng">{t("submit.longitude")} *</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    {...register("lng", { valueAsNumber: true })}
                    placeholder="e.g., 101.6869"
                  />
                  {errors.lng && (
                    <p className="text-sm text-destructive">
                      {errors.lng.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t("submit.description_en")}
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    placeholder="e.g., A beautiful mosque located in the heart of Kuala Lumpur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_bm">
                    {t("submit.description_bm")}
                  </Label>
                  <Textarea
                    id="description_bm"
                    {...register("description_bm")}
                    rows={4}
                    placeholder="e.g., Masjid yang cantik terletak di tengah-tengah Kuala Lumpur"
                  />
                </div>
              </div>

              {/* Amenities Section */}
              <div className="space-y-4">
                <div>
                  <Label>{t("submit.amenities")}</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("submit.amenities_hint")}
                  </p>

                  {amenitiesLoading ? (
                    <div className="text-sm text-muted-foreground">
                      {t("common.loading")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {amenities.map((amenity) => {
                        const isChecked = selectedAmenities.has(amenity.id);
                        const label =
                          language === "bm"
                            ? amenity.label_bm
                            : amenity.label_en;

                        return (
                          <div
                            key={amenity.id}
                            className="space-y-2 border rounded-lg p-3"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`amenity-${amenity.id}`}
                                checked={isChecked}
                                onCheckedChange={() =>
                                  handleAmenityToggle(amenity.id)
                                }
                              />
                              <Label
                                htmlFor={`amenity-${amenity.id}`}
                                className="font-medium cursor-pointer flex-1"
                              >
                                {label}
                              </Label>
                            </div>
                            {isChecked && (
                              <div className="ml-6 space-y-2">
                                <Label
                                  htmlFor={`amenity-details-${amenity.id}`}
                                  className="text-sm"
                                >
                                  {t("submit.amenity_details")}
                                </Label>
                                <Input
                                  id={`amenity-details-${amenity.id}`}
                                  value={
                                    selectedAmenities.get(amenity.id)?.details
                                      ?.notes || ""
                                  }
                                  onChange={(e) =>
                                    handleAmenityDetailsChange(
                                      amenity.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder={t(
                                    "submit.amenity_details_placeholder"
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Custom Amenities */}
                <div className="space-y-3">
                  {customAmenities.map((custom, index) => {
                    const label =
                      language === "bm" ? custom.label_bm : custom.label_en;
                    return (
                      <div
                        key={index}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{label}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCustomAmenity(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">
                            {t("submit.amenity_details")}
                          </Label>
                          <Input
                            value={custom.details?.notes || ""}
                            onChange={(e) =>
                              handleCustomAmenityDetailsChange(
                                index,
                                e.target.value
                              )
                            }
                            placeholder={t(
                              "submit.amenity_details_placeholder"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {!showCustomAmenityForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomAmenityForm(true)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("submit.add_custom_amenity")}
                    </Button>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          {t("submit.add_custom_amenity")}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCustomAmenityForm(false);
                            setNewCustomAmenity({
                              key: "",
                              label_en: "",
                              label_bm: "",
                              icon: "",
                              details: { notes: "" },
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-key">
                          {t("submit.custom_amenity_key")} *
                        </Label>
                        <Input
                          id="custom-key"
                          value={newCustomAmenity.key || ""}
                          onChange={(e) =>
                            setNewCustomAmenity({
                              ...newCustomAmenity,
                              key: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "_"),
                            })
                          }
                          placeholder={t(
                            "submit.custom_amenity_key_placeholder"
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="custom-label-en">
                            {t("submit.custom_amenity_name_en")} *
                          </Label>
                          <Input
                            id="custom-label-en"
                            value={newCustomAmenity.label_en || ""}
                            onChange={(e) =>
                              setNewCustomAmenity({
                                ...newCustomAmenity,
                                label_en: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-label-bm">
                            {t("submit.custom_amenity_name_bm")} *
                          </Label>
                          <Input
                            id="custom-label-bm"
                            value={newCustomAmenity.label_bm || ""}
                            onChange={(e) =>
                              setNewCustomAmenity({
                                ...newCustomAmenity,
                                label_bm: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-icon">
                          {t("submit.custom_amenity_icon")}
                        </Label>
                        <Input
                          id="custom-icon"
                          value={newCustomAmenity.icon || ""}
                          onChange={(e) =>
                            setNewCustomAmenity({
                              ...newCustomAmenity,
                              icon: e.target.value,
                            })
                          }
                          placeholder="e.g., circle, wifi, car"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-details">
                          {t("submit.amenity_details")}
                        </Label>
                        <Input
                          id="custom-details"
                          value={newCustomAmenity.details?.notes || ""}
                          onChange={(e) =>
                            setNewCustomAmenity({
                              ...newCustomAmenity,
                              details: {
                                ...newCustomAmenity.details,
                                notes: e.target.value,
                              },
                            })
                          }
                          placeholder={t("submit.amenity_details_placeholder")}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddCustomAmenity}
                        className="w-full"
                      >
                        {t("common.add") || "Add"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Activities Section */}
              <div className="space-y-4">
                <div>
                  <Label>{t("submit.activities")}</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("submit.activities_hint")}
                  </p>

                  {activities.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {activities.map((activity, index) => {
                        const title =
                          language === "bm" && activity.title_bm
                            ? activity.title_bm
                            : activity.title;
                        return (
                          <div
                            key={index}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{title}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveActivity(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <Badge variant="secondary">{activity.type}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!showActivityForm ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowActivityForm(true)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("submit.add_activity")}
                    </Button>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          {t("submit.add_activity")}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowActivityForm(false);
                            setNewActivity({
                              title: "",
                              title_bm: "",
                              description: "",
                              description_bm: "",
                              type: "one_off",
                              schedule_json: {},
                              start_date: "",
                              end_date: "",
                              status: "active",
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity-title">
                          {t("submit.activity_title")}
                        </Label>
                        <Input
                          id="activity-title"
                          value={newActivity.title || ""}
                          onChange={(e) =>
                            handleActivityFieldChange("title", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity-title-bm">
                          {t("submit.activity_title_bm")}
                        </Label>
                        <Input
                          id="activity-title-bm"
                          value={newActivity.title_bm || ""}
                          onChange={(e) =>
                            handleActivityFieldChange(
                              "title_bm",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="activity-description">
                            {t("submit.activity_description")}
                          </Label>
                          <Textarea
                            id="activity-description"
                            value={newActivity.description || ""}
                            onChange={(e) =>
                              handleActivityFieldChange(
                                "description",
                                e.target.value
                              )
                            }
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="activity-description-bm">
                            {t("submit.activity_description_bm")}
                          </Label>
                          <Textarea
                            id="activity-description-bm"
                            value={newActivity.description_bm || ""}
                            onChange={(e) =>
                              handleActivityFieldChange(
                                "description_bm",
                                e.target.value
                              )
                            }
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity-type">
                          {t("submit.activity_type")}
                        </Label>
                        <Select
                          value={newActivity.type || "one_off"}
                          onValueChange={(
                            value: "one_off" | "recurring" | "fixed"
                          ) => handleActivityFieldChange("type", value)}
                        >
                          <SelectTrigger id="activity-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one_off">
                              {t("submit.activity_type_one_off")}
                            </SelectItem>
                            <SelectItem value="recurring">
                              {t("submit.activity_type_recurring")}
                            </SelectItem>
                            <SelectItem value="fixed">
                              {t("submit.activity_type_fixed")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Schedule fields based on type */}
                      {newActivity.type === "one_off" && (
                        <div className="grid md:grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="activity-date">
                              {t("submit.activity_date")}
                            </Label>
                            <Input
                              id="activity-date"
                              type="date"
                              value={newActivity.schedule_json?.date || ""}
                              onChange={(e) =>
                                handleScheduleJsonChange("date", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="activity-time">
                              {t("submit.activity_time")}
                            </Label>
                            <Input
                              id="activity-time"
                              type="time"
                              value={newActivity.schedule_json?.time || ""}
                              onChange={(e) =>
                                handleScheduleJsonChange("time", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}

                      {newActivity.type === "recurring" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="activity-recurrence">
                              {t("submit.activity_recurrence")}
                            </Label>
                            <Select
                              value={
                                newActivity.schedule_json?.recurrence || ""
                              }
                              onValueChange={(
                                value: "daily" | "weekly" | "monthly"
                              ) =>
                                handleScheduleJsonChange("recurrence", value)
                              }
                            >
                              <SelectTrigger id="activity-recurrence">
                                <SelectValue placeholder="Select recurrence" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">
                                  {t("submit.activity_recurrence_daily")}
                                </SelectItem>
                                <SelectItem value="weekly">
                                  {t("submit.activity_recurrence_weekly")}
                                </SelectItem>
                                <SelectItem value="monthly">
                                  {t("submit.activity_recurrence_monthly")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor="activity-start-date">
                                {t("submit.activity_start_date")}
                              </Label>
                              <Input
                                id="activity-start-date"
                                type="date"
                                value={
                                  newActivity.schedule_json?.start_date || ""
                                }
                                onChange={(e) =>
                                  handleScheduleJsonChange(
                                    "start_date",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="activity-end-date">
                                {t("submit.activity_end_date")}
                              </Label>
                              <Input
                                id="activity-end-date"
                                type="date"
                                value={
                                  newActivity.schedule_json?.end_date || ""
                                }
                                onChange={(e) =>
                                  handleScheduleJsonChange(
                                    "end_date",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          {newActivity.schedule_json?.recurrence ===
                            "weekly" && (
                            <div className="space-y-2">
                              <Label>{t("submit.activity_days_of_week")}</Label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday",
                                ].map((day, index) => (
                                  <div
                                    key={day}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`day-${index}`}
                                      checked={
                                        newActivity.schedule_json?.days_of_week?.includes(
                                          index
                                        ) || false
                                      }
                                      onCheckedChange={(checked) => {
                                        const currentDays =
                                          newActivity.schedule_json
                                            ?.days_of_week || [];
                                        const newDays = checked
                                          ? [...currentDays, index]
                                          : currentDays.filter(
                                              (d) => d !== index
                                            );
                                        handleScheduleJsonChange(
                                          "days_of_week",
                                          newDays.sort()
                                        );
                                      }}
                                    />
                                    <Label
                                      htmlFor={`day-${index}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {day}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {newActivity.type === "fixed" && (
                        <div className="space-y-2">
                          <Label htmlFor="activity-time">
                            {t("submit.activity_time")}
                          </Label>
                          <Input
                            id="activity-time"
                            type="time"
                            value={newActivity.schedule_json?.time || ""}
                            onChange={(e) =>
                              handleScheduleJsonChange("time", e.target.value)
                            }
                          />
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleAddActivity}
                        className="w-full"
                      >
                        {t("common.add")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">{t("submit.image")}</Label>
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("submit.image_hint")}
                  </p>
                  {imageError && (
                    <p className="text-sm text-destructive">{imageError}</p>
                  )}
                  {imagePreview && (
                    <div className="relative inline-block mt-2">
                      <img
                        src={imagePreview}
                        alt={t("submit.image_preview")}
                        className="max-w-full h-auto max-h-64 rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemoveImage}
                        aria-label={t("submit.remove_image")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={createSubmission.isPending}>
                  {createSubmission.isPending
                    ? t("submit.submitting")
                    : t("common.submit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/explore")}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </div>
        </main>

        <Footer />
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  );
};

export default Submit;
