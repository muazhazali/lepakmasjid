import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { MALAYSIAN_STATES } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAmenities } from "@/hooks/use-amenities";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/stores/language";
import * as LucideIcons from "lucide-react";

interface FilterSidebarProps {
  selectedState: string;
  onStateChange: (state: string) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
  sortBy?: "nearest" | "most_amenities" | "alphabetical";
  onSortChange?: (sort: "nearest" | "most_amenities" | "alphabetical") => void;
  distance?: number;
  onDistanceChange?: (distance: number) => void;
}

const FilterSidebar = ({
  selectedState,
  onStateChange,
  selectedAmenities,
  onAmenitiesChange,
  onClear,
  isOpen,
  onClose,
  sortBy = "alphabetical",
  onSortChange,
  distance = 50,
  onDistanceChange,
}: FilterSidebarProps) => {
  const {
    data: amenities = [],
    isLoading: amenitiesLoading,
    error: amenitiesError,
  } = useAmenities();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    // Try to get user location for distance filter
    if (navigator.geolocation && onDistanceChange) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // User denied or error
        }
      );
    }
  }, [onDistanceChange]);

  const handleAmenityToggle = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onAmenitiesChange(selectedAmenities.filter((a) => a !== amenityId));
    } else {
      onAmenitiesChange([...selectedAmenities, amenityId]);
    }
  };

  const hasActiveFilters =
    (selectedState && selectedState !== "all") || selectedAmenities.length > 0;

  // Get icon component dynamically
  // Convert icon name to PascalCase and handle special cases
  const getIcon = (iconName: string) => {
    if (!iconName) return MapPin;

    // Normalize the icon name (lowercase, handle hyphens)
    const normalized = iconName.toLowerCase().trim();

    // Map lowercase icon names from seed data to Lucide React icon names
    const iconMap: Record<string, string> = {
      wifi: "Wifi",
      laptop: "Laptop",
      book: "BookOpen",
      accessibility: "Accessibility",
      car: "Car",
      droplet: "Droplet",
      users: "Users",
      wind: "Wind",
      utensils: "UtensilsCrossed",
      "graduation-cap": "GraduationCap",
      graduationcap: "GraduationCap",
    };

    // Get the mapped icon name
    const mappedName = iconMap[normalized];

    // Try to get the icon component
    type LucideIconName = keyof typeof LucideIcons;
    const IconComponent = mappedName
      ? ((LucideIcons as Record<string, React.ComponentType>)[
          mappedName as LucideIconName
        ] as typeof MapPin) || MapPin
      : MapPin;

    return IconComponent;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 h-full lg:h-auto w-80 lg:w-72 
          bg-background lg:bg-transparent border-r lg:border-0 border-border
          transform transition-transform duration-300 z-50 lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-y-auto
        `}
      >
        <div className="p-6 lg:p-0 space-y-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-display text-xl font-bold">
              {t("common.filter")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedAmenities.length + (selectedState ? 1 : 0)}{" "}
                {t("common.filter")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-destructive"
              >
                {t("common.clear")}
              </Button>
            </div>
          )}

          {/* Sort by */}
          {onSortChange && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t("filter.sort_by")}
              </Label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">
                    {t("filter.sort.alphabetical")}
                  </SelectItem>
                  <SelectItem value="most_amenities">
                    {t("filter.sort.most_amenities")}
                  </SelectItem>
                  {userLocation && (
                    <SelectItem value="nearest">
                      {t("filter.sort.nearest")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* State filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t("filter.state")}
            </Label>
            <Select
              value={selectedState || "all"}
              onValueChange={(value) =>
                onStateChange(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder={t("filter.all_states")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all_states")}</SelectItem>
                {MALAYSIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distance filter */}
          {onDistanceChange && userLocation && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t("filter.distance")} ({distance} km)
              </Label>
              <Slider
                value={[distance]}
                onValueChange={([value]) => onDistanceChange(value)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Amenities filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t("filter.amenities")}
            </Label>
            {amenitiesLoading ? (
              <div className="text-sm text-muted-foreground">
                {t("filter.loading_amenities")}
              </div>
            ) : amenitiesError ? (
              <div className="text-sm text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                {amenitiesError instanceof Error
                  ? amenitiesError.message
                  : t("filter.error_amenities")}
              </div>
            ) : amenities.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t("filter.no_amenities")}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {amenities.map((amenity) => {
                  const IconComponent = getIcon(amenity.icon);
                  const isChecked = selectedAmenities.includes(amenity.id);
                  const label =
                    language === "bm" ? amenity.label_bm : amenity.label_en;

                  return (
                    <label
                      key={amenity.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${isChecked ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary border border-transparent"}
                      `}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleAmenityToggle(amenity.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <IconComponent
                          className={`h-4 w-4 ${isChecked ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span
                          className={`text-sm font-medium ${isChecked ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {label}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply button (mobile) */}
          <div className="lg:hidden pt-4">
            <Button className="w-full" onClick={onClose}>
              {t("common.apply")}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
