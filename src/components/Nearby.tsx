import { useEffect, useState, useCallback } from "react";
import {
  UtensilsCrossed,
  ShoppingBag,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface NearbyProps {
  longitude: number;
  latitude: number;
}

interface Place {
  id: number;
  type: "restaurant" | "mall" | "transport";
  name: string;
  lat: number;
  lng: number;
  distance: number; // Distance in kilometers
}

interface RawPlace {
  id: number;
  type: "restaurant" | "mall" | "transport" | "unknown";
  name: string;
  lat: number;
  lng: number;
}

import { calculateDistance } from "@/lib/utils";

const Nearby: React.FC<NearbyProps> = ({ longitude, latitude }) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const [showAllMalls, setShowAllMalls] = useState(false);
  const [showAllTransport, setShowAllTransport] = useState(false);

  const fetchOSM = useCallback(async (attempt: number = 0): Promise<void> => {
    const MAX_RETRIES = 3;
    
    try {
      setIsLoading(true);
      setRetryAttempt(attempt);
      if (attempt === 0) {
        setError(null);
      }

        const query = `
[out:json];
(
  /* Halal restaurants */
  node["amenity"="restaurant"]["diet:halal"="yes"](around:5000,${latitude},${longitude});
  node["amenity"="restaurant"]["halal"="yes"](around:5000,${latitude},${longitude});

  /* Malls */
  node["shop"="mall"](around:5000,${latitude},${longitude});

  /* Bus stations */
  node["amenity"="bus_station"](around:5000,${latitude},${longitude});

  /* Public transport stations (modern tagging) */
  node["public_transport"="station"](around:5000,${latitude},${longitude});
  way["public_transport"="station"](around:5000,${latitude},${longitude});
  relation["public_transport"="station"](around:5000,${latitude},${longitude});

  /* Railway stations by type */
  node["railway"="station"]["station"="subway"](around:5000,${latitude},${longitude});      /* MRT */
  node["railway"="station"]["station"="light_rail"](around:5000,${latitude},${longitude}); /* LRT */
  node["railway"="station"]["station"="train"](around:5000,${latitude},${longitude});      /* KTM */

  /* Stops & entrances */
  node["railway"="tram_stop"](around:5000,${latitude},${longitude});
  node["railway"="subway_entrance"](around:5000,${latitude},${longitude});
);
out center tags;
`;

        const url =
          "https://overpass-api.de/api/interpreter?data=" +
          encodeURIComponent(query);

        const res = await fetch(url);
        
        // Retry on 504 (Gateway Timeout) or 503 (Service Unavailable) errors
        if (!res.ok && (res.status === 504 || res.status === 503)) {
          if (attempt < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchOSM(attempt + 1);
          } else {
            throw new Error(`Service temporarily unavailable. Please try again later.`);
          }
        }
        
        if (!res.ok) {
          throw new Error(`Failed to load nearby places (${res.status})`);
        }
        
        const data = await res.json();

        // Check if response is valid and has elements
        if (!data || !Array.isArray(data.elements)) {
          setPlaces([]);
          return;
        }

        const fetchedPlaces = data.elements.map((el: any): RawPlace | null => {
  const tags = el.tags || {};

  let type: RawPlace["type"] = "unknown";

  // 🍽️ Restaurant
  if (tags.amenity === "restaurant") {
    type = "restaurant";

  // 🏬 Mall
  } else if (tags.shop === "mall") {
    type = "mall";

  // 🚉 Transport (bus, MRT, LRT, train)
  } else if (
    tags.amenity === "bus_station" ||
    tags.highway === "bus_stop" ||
    tags.public_transport === "station" ||
    tags.railway === "tram_stop" ||
    tags.railway === "subway_entrance" ||
    (tags.railway === "station" &&
      ["subway", "light_rail", "train"].includes(tags.station))
  ) {
    type = "transport";
  }

  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;

  // Only include places with valid coordinates
  if (lat == null || lng == null) {
    return null;
  }

  return {
    id: el.id,
    type,
    name: tags.name ?? "Unnamed",
    lat,
    lng,
  };
}).filter((p): p is RawPlace => p !== null);

        // Calculate distances and convert to Place with distance, then sort by distance
        const placesWithDistance: Place[] = fetchedPlaces
          .filter((p): p is Place => p.type !== "unknown")
          .map((place) => ({
            ...place,
            distance: calculateDistance(latitude, longitude, place.lat, place.lng),
          }))
          .sort((a, b) => a.distance - b.distance); // Sort by nearest first

        setPlaces(placesWithDistance);
        setRetryAttempt(0); // Reset retry count on success

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load nearby places";
      setError(errorMessage);
      console.error("Error fetching nearby places:", err);
      setRetryAttempt(0); // Reset retry count on final failure
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (typeof longitude === "number" && typeof latitude === "number" && !isNaN(longitude) && !isNaN(latitude)) {
      fetchOSM();
    } else {
      setIsLoading(false);
      setError("Invalid coordinates");
    }
  }, [longitude, latitude, fetchOSM]);

  const restaurants = places.filter((p) => p.type === "restaurant");
  const malls = places.filter((p) => p.type === "mall");
  const transport = places.filter((p) => p.type === "transport");

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Nearby Places</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {retryAttempt > 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Retrying... (Attempt {retryAttempt + 1} of 4)
            </div>
          )}
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Nearby Places</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOSM()}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Nearby Places
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[400px] overflow-y-auto">
        {/* Halal Restaurants */}
        {restaurants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Halal Restaurants</h3>
              <Badge variant="secondary" className="ml-auto">
                {restaurants.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {(showAllRestaurants ? restaurants : restaurants.slice(0, 5)).map(
                (restaurant) => (
                  <div
                    key={restaurant.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{restaurant.name}</p>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {restaurant.distance.toFixed(1)} km
                      </Badge>
                    </div>
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`;
                        window.open(url, "_blank");
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline transition-all"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Google Maps</span>
                    </button>
                  </div>
                )
              )}
              {restaurants.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllRestaurants(!showAllRestaurants)}
                  className="w-full text-xs"
                >
                  {showAllRestaurants ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      See All ({restaurants.length - 5} more)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Shopping Malls */}
        {malls.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Shopping Malls</h3>
              <Badge variant="secondary" className="ml-auto">
                {malls.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {(showAllMalls ? malls : malls.slice(0, 5)).map((mall) => (
                <div
                  key={mall.id}
                  className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{mall.name}</p>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {mall.distance.toFixed(1)} km
                    </Badge>
                  </div>
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${mall.lat},${mall.lng}`;
                      window.open(url, "_blank");
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline transition-all"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open in Google Maps</span>
                  </button>
                </div>
              ))}
              {malls.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllMalls(!showAllMalls)}
                  className="w-full text-xs"
                >
                  {showAllMalls ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      See All ({malls.length - 5} more)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Public Transport */}
        {transport.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Public Transport</h3>
              <Badge variant="secondary" className="ml-auto">
                {transport.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {(showAllTransport ? transport : transport.slice(0, 5)).map(
                (station) => (
                  <div
                    key={station.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{station.name}</p>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {station.distance.toFixed(1)} km
                      </Badge>
                    </div>
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`;
                        window.open(url, "_blank");
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline transition-all"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Google Maps</span>
                    </button>
                  </div>
                )
              )}
              {transport.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTransport(!showAllTransport)}
                  className="w-full text-xs"
                >
                  {showAllTransport ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      See All ({transport.length - 5} more)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {places.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No nearby places found
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Nearby;
