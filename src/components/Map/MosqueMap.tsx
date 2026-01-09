import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Mosque } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguageStore } from "@/stores/language";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { MapPin, Navigation } from "lucide-react";
import { calculateDistance } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MosqueMapProps {
  mosques: Mosque[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (mosque: Mosque) => void;
  className?: string;
  userLocation?: [number, number] | null;
  prioritizeUserLocation?: boolean;
}

// Component to render mosque popup content
function MosquePopupContent({ mosque, userLocation }: { mosque: Mosque; userLocation?: [number, number] | null }) {
  const navigate = useNavigate();
  const { language } = useLanguageStore();

  const displayName =
    language === "bm" && mosque.name_bm ? mosque.name_bm : mosque.name;

  // Calculate distance if user location is available
  const distance = userLocation
    ? calculateDistance(userLocation[0], userLocation[1], mosque.lat, mosque.lng)
    : null;

  // Get icon component dynamically (same logic as MosqueCard)
  const getIcon = (iconName: string) => {
    if (!iconName) return MapPin;

    const normalized = iconName.toLowerCase().trim();
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

    const mappedName = iconMap[normalized];
    type LucideIconName = keyof typeof LucideIcons;
    const IconComponent = mappedName
      ? ((LucideIcons as Record<string, React.ComponentType>)[
          mappedName as LucideIconName
        ] as typeof MapPin) || MapPin
      : MapPin;

    return IconComponent;
  };

  // Combine regular amenities and custom amenities
  const allAmenities = [
    ...(mosque.amenities || []).map((amenity) => ({
      id: amenity.id,
      label: language === "bm" ? amenity.label_bm : amenity.label_en,
      icon: amenity.icon,
      isCustom: false,
    })),
    ...(mosque.customAmenities || []).map((customAmenity) => ({
      id: customAmenity.id,
      label:
        language === "bm"
          ? customAmenity.details.custom_name || "Custom Amenity"
          : customAmenity.details.custom_name_en || "Custom Amenity",
      icon: customAmenity.details.custom_icon || "MapPin",
      isCustom: true,
    })),
  ];

  return (
    <div className="p-3 min-w-[200px] max-w-[280px]">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-base">{displayName}</h3>
        {distance !== null && (
          <Badge
            variant="secondary"
            className="bg-primary/90 text-primary-foreground flex items-center gap-1 flex-shrink-0"
          >
            <Navigation className="h-3 w-3" />
            <span className="text-xs">
              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
            </span>
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {mosque.address}
      </p>

      {/* Amenities/Facilities */}
      {allAmenities.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Facilities:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allAmenities.slice(0, 6).map((amenity) => {
              const IconComponent = getIcon(amenity.icon);
              return (
                <Badge
                  key={amenity.id}
                  variant="secondary"
                  className="bg-muted text-muted-foreground font-normal px-2 py-0.5 flex items-center gap-1 text-xs"
                >
                  <IconComponent className="h-3 w-3" />
                  <span className="text-xs">{amenity.label}</span>
                </Badge>
              );
            })}
            {allAmenities.length > 6 && (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground font-normal px-2 py-0.5 text-xs"
              >
                +{allAmenities.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* View Details Button */}
      <Button
        size="sm"
        className="w-full mt-2"
        onClick={() => navigate(`/mosque/${mosque.id}`)}
      >
        View Details
      </Button>
    </div>
  );
}

export interface MosqueMapRef {
  flyToUserLocation: () => void;
}

// Component to fit map bounds to markers
function FitBounds({
  mosques,
  userLocation,
  prioritizeUserLocation,
}: {
  mosques: Mosque[];
  userLocation?: [number, number] | null;
  prioritizeUserLocation?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    // If user location is prioritized, don't auto-fit bounds
    // Let the initial center/zoom handle it
    if (prioritizeUserLocation) {
      return;
    }

    if (mosques.length > 0) {
      const bounds = L.latLngBounds(
        mosques.map((m) => [m.lat, m.lng] as [number, number])
      );

      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend(userLocation);
      }

      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, mosques, userLocation, prioritizeUserLocation]);

  return null;
}

// Component to handle map centering and zooming to user location
function MapController({
  userLocation,
  center,
  zoom,
  prioritizeUserLocation,
  onMapReady,
}: {
  userLocation?: [number, number] | null;
  center: [number, number];
  zoom: number;
  prioritizeUserLocation?: boolean;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]); // Only depend on map, not onMapReady

  useEffect(() => {
    // If user location is prioritized and available, center on it
    if (prioritizeUserLocation && userLocation) {
      map.setView(userLocation, zoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, userLocation, zoom, prioritizeUserLocation]);

  return null;
}

// Create user location icon (blue circle)
const createUserLocationIcon = () => {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        position: relative;
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export const MosqueMap = forwardRef<MosqueMapRef, MosqueMapProps>(
  (
    {
      mosques,
      center = [3.139, 101.6869], // Default to KL
      zoom = 11,
      onMarkerClick,
      className = "h-[500px] w-full rounded-lg",
      userLocation,
      prioritizeUserLocation = false,
    },
    ref
  ) => {
    const mapInstanceRef = useRef<L.Map | null>(null);

    useImperativeHandle(ref, () => ({
      flyToUserLocation: () => {
        if (userLocation && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(userLocation, 15, {
            animate: true,
            duration: 1,
          });
        }
      },
    }));

    const handleMapReady = (map: L.Map) => {
      mapInstanceRef.current = map;
    };

    if (mosques.length === 0 && !userLocation) {
      return (
        <div
          className={`${className} flex items-center justify-center bg-muted rounded-lg`}
        >
          <p className="text-muted-foreground">No mosques to display on map</p>
        </div>
      );
    }

    return (
      <MapContainer
        center={center}
        zoom={zoom}
        className={className}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController
          userLocation={userLocation}
          center={center}
          zoom={zoom}
          prioritizeUserLocation={prioritizeUserLocation}
          onMapReady={handleMapReady}
        />
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserLocationIcon()}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-sm">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        {mosques.map((mosque) => (
          <Marker key={mosque.id} position={[mosque.lat, mosque.lng]}>
            <Popup>
              <MosquePopupContent mosque={mosque} userLocation={userLocation} />
            </Popup>
          </Marker>
        ))}
        <FitBounds
          mosques={mosques}
          userLocation={userLocation}
          prioritizeUserLocation={prioritizeUserLocation}
        />
      </MapContainer>
    );
  }
);

MosqueMap.displayName = "MosqueMap";
