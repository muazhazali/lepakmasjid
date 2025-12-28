import { useState, useEffect, useRef } from "react";
import { MosqueMap, type MosqueMapRef } from "./MosqueMap";
import type { Mosque } from "@/types";
import { Button } from "@/components/ui/button";
import { Navigation, Loader2 } from "lucide-react";

interface MapViewProps {
  mosques: Mosque[];
  className?: string;
}

export const MapView = ({ mosques, className }: MapViewProps) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isInitialLocationLoading, setIsInitialLocationLoading] =
    useState(true);
  const [isZooming, setIsZooming] = useState(false);
  const mapRef = useRef<MosqueMapRef | null>(null);

  useEffect(() => {
    // Try to get user location on mount
    if (navigator.geolocation) {
      setIsInitialLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
          setIsInitialLocationLoading(false);
        },
        () => {
          // User denied or error getting location
          setUserLocation(null);
          setIsInitialLocationLoading(false);
        }
      );
    } else {
      setIsInitialLocationLoading(false);
    }
  }, []);

  const handleGoToMyLocation = () => {
    if (userLocation) {
      // If we already have location, just fly to it
      setIsZooming(true);
      mapRef.current?.flyToUserLocation();
      // Reset zooming state after animation duration (1 second)
      setTimeout(() => {
        setIsZooming(false);
      }, 1000);
    } else {
      // Request location again
      setIsLocating(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            setUserLocation(newLocation);
            setIsLocating(false);
            setIsZooming(true);
            // Small delay to ensure map is ready
            setTimeout(() => {
              mapRef.current?.flyToUserLocation();
              // Reset zooming state after animation duration
              setTimeout(() => {
                setIsZooming(false);
              }, 1000);
            }, 100);
          },
          () => {
            setIsLocating(false);
            // Could show a toast/alert here
          }
        );
      }
    }
  };

  const center =
    userLocation ||
    (mosques.length > 0
      ? ([mosques[0].lat, mosques[0].lng] as [number, number])
      : ([3.139, 101.6869] as [number, number])); // Default to KL

  // Zoom level: 15 for neighborhood level (good for viewing nearby mosques)
  // 13-14 for city level, 16+ for street level
  const zoom = userLocation ? 15 : 11;

  return (
    <>
      {/* CSS to ensure Leaflet elements stay below filter sidebar (z-50) */}
      <style>{`
        .leaflet-container {
          z-index: 10 !important;
        }
        .leaflet-popup,
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          z-index: 45 !important;
        }
        .leaflet-control {
          z-index: 45 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 45 !important;
        }
      `}</style>
      <div className={`relative z-10 ${className}`}>
        <MosqueMap
          ref={mapRef}
          mosques={mosques}
          center={center}
          zoom={zoom}
          userLocation={userLocation}
          prioritizeUserLocation={!!userLocation}
        />
        {/* Floating "My Location" button */}
        <Button
          onClick={handleGoToMyLocation}
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 z-[60] shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Go to my location"
          disabled={isLocating || isZooming}
        >
          {isLocating || isZooming ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Navigation className="h-5 w-5" />
          )}
        </Button>

        {/* Loading overlay for initial location fetch */}
        {isInitialLocationLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-[60] flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Getting your location...
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
