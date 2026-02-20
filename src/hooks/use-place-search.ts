import { useEffect, useState } from "react";

export type Place = {
  display_name: string;
  lat: string;
  lon: string;
};

export function usePlaceSearch(query: string) {
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({
              q: query,
              format: "json",
              limit: "5",
              countrycodes: "my",
            }),
          {
            signal: controller.signal,
            headers: {
              "User-Agent": "TripPlanner/1.0",
            },
          }
        );

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = (await response.json()) as Place[];
        setResults(data);
      } catch (error) {
        // Ignore abort errors when users keep typing quickly.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();

    return () => controller.abort();
  }, [query]);

  return { results, loading };
}
