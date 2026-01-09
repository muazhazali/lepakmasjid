import { useEffect, useState } from "react";
import type { Mosque } from "@/types";

export type Route = { 
  lat: number; 
  lon: number;
};

export function useRouteMosque(
  mosques: Mosque[] | undefined, 
  route: Route[] | undefined, 
  radius = 5000 //5km for now
) {
  const [mosquesAlongRoute, setMosquesAlongRoute] = useState<Mosque[]>([]);
  const [closestMosque, setClosestMosque] = useState<Mosque | null>(null);


  useEffect(() => {
    if (!mosques || !route || route.length === 0) {
      setMosquesAlongRoute([]);
      setClosestMosque(null);
      return;
    }

    // Haversine distance function
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371e3; // meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    let closest: Mosque | null = null;
    let minDistance = Infinity;
    const alongRoute: Mosque[] = [];

    mosques.forEach((mosque) => {
      // Use mosque.lng instead of mosque.lon
      const mosqueLon = mosque.lng;
      const mosqueLat = mosque.lat;

      for (const point of route) {
        // point uses .lon
        const d = getDistance(point.lat, point.lon, mosqueLat, mosqueLon);

        // Mosque is close enough to the route
        if (d <= radius) {
          alongRoute.push(mosque);
          break; // no need to check other route points
        }

        // Track closest mosque
        if (d < minDistance) {
          minDistance = d;
          closest = mosque;
        }
      }
    });

    setMosquesAlongRoute(alongRoute);
    setClosestMosque(closest);

  }, [mosques, route, radius]);

  return { mosquesAlongRoute, closestMosque };
}
