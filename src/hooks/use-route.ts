import { useEffect, useState } from "react";

export type RoutePoint = { lat: number; lon: number };

export function useRoutes(
  from: { lat: number; lon: number } | null,
  to: { lat: number; lon: number } | null
) {
  const [routes, setRoutes] = useState<RoutePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!from || !to) {
      console.log("Incomplete coordinates");
      setRoutes([]);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates; 
          const routePoints = coords.map((c: [number, number]) => ({
            lat: c[1],
            lon: c[0],
          }));
          setRoutes(routePoints);
        } else {
          setRoutes([]);
        }
      } catch (err) {
        console.error("Error fetching route:", err);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [from, to]);

  return { loading, routes };
}
