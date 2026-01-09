"use client";
import { useState, useEffect } from "react";

export function useCoords(placeName: string) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!placeName) return setCoords(null);

    const controller = new AbortController();
    setLoading(true);

    fetch(
      "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: placeName.name,
          format: "json",
          limit: "1",
        }),
      { signal: controller.signal, headers: { "User-Agent": "TripPlanner/1.0" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setCoords({ lat: Number(data[0].lat), lon: Number(data[0].lon) });
        } else {
          setCoords(null);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [placeName]);

  return { coords, loading };
}
