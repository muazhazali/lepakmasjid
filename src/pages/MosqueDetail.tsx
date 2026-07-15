import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Edit, ArrowLeft, Calendar, Clock, Phone, Copy, Check, Navigation } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MosqueMap } from "@/components/Map/MosqueMap";
import { useMosque } from "@/hooks/use-mosques";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/stores/language";
import { SkipLink } from "@/components/SkipLink";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/pocketbase-images";
import SedekahQR from "@/components/SedekahQR";
import OpenMapsButton from "../components/OpenMapsButton";
import Nearby from "@/components/Nearby";
import { toast } from "sonner";
import { useNearMe } from "@/components/NearMe";
import { calculateDistance } from "@/lib/utils";

const MosqueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: mosque, isLoading } = useMosque(id || null);
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [copied, setCopied] = useState(false);
  const { location: userLocation } = useNearMe();

  // Calculate distance if user location is available
  const distance = userLocation && mosque
    ? calculateDistance(userLocation.lat, userLocation.lng, mosque.lat, mosque.lng)
    : undefined;

  const handleCopyContact = async () => {
    if (mosque?.contact) {
      try {
        await navigator.clipboard.writeText(mosque.contact);
        setCopied(true);
        toast.success(t("common.copied") || "Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error(t("common.copy_failed") || "Failed to copy");
      }
    }
  };

  if (isLoading) {
    return (
      <>
        <SkipLink />
        <Header />
        <main id="main-content" className="container-main py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </main>
        <Footer />
      </>
    );
  }

  if (!mosque) {
    return (
      <>
        <SkipLink />
        <Header />
        <main id="main-content" className="container-main py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">
              {t("mosque_detail.not_found")}
            </h1>
            <Button onClick={() => navigate("/explore")}>
              {t("mosque_detail.back_to_explore")}
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const displayName =
    language === "bm" && mosque.name_bm ? mosque.name_bm : mosque.name;
  const displayDescription =
    language === "bm" && mosque.description_bm
      ? mosque.description_bm
      : mosque.description;

  const name_bm = mosque.name_bm;
  const name = mosque.name;
  // Get image URL for the mosque
  const imageUrl = getImageUrl(mosque, mosque.image);

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>{displayName} - LepakMasjid</title>
        <meta
          name="description"
          content={displayDescription || `Information about ${displayName}`}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main id="main-content" className="flex-1">
          <div className="container-main py-8">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => {
                // Clear the saved scroll position flag so it restores properly
                navigate(-1);
              }}
              className="mb-6 hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>

            {/* Image */}
            {imageUrl && (
              <div className="mb-8">
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="w-full h-[400px] object-cover rounded-lg"
                  loading="eager"
                />
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {displayName}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{mosque.address}</span>
                  </div>
                  {mosque.contact && (
                    <div className="flex items-center gap-2 mb-4">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">
                        {t("mosque.contact")}:
                      </span>
                      <a
                        href={`tel:${mosque.contact}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {mosque.contact}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={handleCopyContact}
                        title={copied ? t("common.copied") || "Copied!" : t("common.copy") || "Copy"}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{mosque.state}</Badge>
                    {distance !== undefined && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/90 text-primary-foreground flex items-center gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>
                          {distance < 1
                            ? `${(distance * 1000).toFixed(0)}m`
                            : `${distance.toFixed(1)}km`}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/submit?edit=${mosque.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t("mosque.suggest_edit")}
                  </Button>
                )}
              </div>

              {displayDescription && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {displayDescription}
                </p>
              )}
            </div>

            {/* Map and Nearby Places */}
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold mb-4">
                {t("mosque.location")}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <MosqueMap
                    mosques={[mosque]}
                    center={[mosque.lat, mosque.lng]}
                    zoom={15}
                    className="h-[400px] w-full rounded-lg"
                    userLocation={userLocation}
                  />
                  <OpenMapsButton
                    lat={mosque?.lat}
                    lng={mosque?.lng}
                    className="mt-4 w-full"
                  />
                </div>
                <div className="lg:col-span-1">
                  <Nearby longitude={mosque.lng} latitude={mosque.lat} />
                </div>
              </div>
            </div>

            {/* Amenities */}
            {mosque.amenities && mosque.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">
                  {t("mosque.amenities")}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mosque.amenities.map((amenity) => {
                    const label =
                      language === "bm" ? amenity.label_bm : amenity.label_en;
                    return (
                      <div
                        key={amenity.id}
                        className="p-4 rounded-lg border border-border bg-card"
                      >
                        <div className="font-medium mb-1">{label}</div>
                        {amenity.details?.notes && (
                          <p className="text-sm text-muted-foreground">
                            {amenity.details.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activities */}
            {mosque.activities && mosque.activities.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold mb-4">
                  {t("mosque.activities")}
                </h2>
                <div className="space-y-4">
                  {mosque.activities.map((activity) => {
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
                        key={activity.id}
                        className="p-4 rounded-lg border border-border bg-card"
                      >
                        <h3 className="font-semibold text-lg mb-2">{title}</h3>
                        <p className="text-muted-foreground mb-3">
                          {description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {activity.type === "one_off" &&
                              activity.schedule_json?.date
                                ? format(
                                    new Date(activity.schedule_json.date),
                                    "PPP"
                                  )
                                : activity.type === "recurring"
                                  ? t("mosque_detail.recurring")
                                  : t("mosque_detail.fixed_schedule")}
                            </span>
                          </div>
                          {activity.schedule_json?.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{activity.schedule_json.time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <SedekahQR
              masjidName_BM={name_bm}
              masjidName_Eng={name}
            ></SedekahQR>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MosqueDetail;
