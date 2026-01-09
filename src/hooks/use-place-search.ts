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

    setLoading(true);
    fetch(
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
    )
      .then((r) => r.json())
      .then(setResults)
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  return { results, loading };
}
