/**
 * Hook to manage geolocation state for the Nearby Mosque component.
 * @returns location, loading state, error, and functions to request/clear location.
 */

import { useState, useCallback, useEffect } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UseNearMeReturn {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  requestLocation: () => void;
  clearLocation: () => void;
}

const LOCATION_STORAGE_KEY = "nearme-location";
const LOCATION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface StoredLocation {
  location: UserLocation;
  timestamp: number;
}

/**
 * Hook to manage geolocation state for the "Near Me" feature.
 * Returns location, loading state, error, and functions to request/clear location.
 */
export const useNearMe = (): UseNearMeReturn => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => "geolocation" in navigator);

  // Try to restore location from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed: StoredLocation = JSON.parse(stored);
        const now = Date.now();
        // Only use stored location if it's less than 10 minutes old
        if (now - parsed.timestamp < LOCATION_EXPIRY_MS) {
          setLocation(parsed.location);
        } else {
          sessionStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        setIsLoading(false);
        setError(null);

        // Store in sessionStorage with timestamp
        try {
          const toStore: StoredLocation = {
            location: newLocation,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(toStore));
        } catch {
          // Ignore storage errors
        }
      },
      (geoError) => {
        setIsLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location access denied. Please enable location permissions.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case geoError.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An error occurred while getting your location.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // Accept cached position up to 5 minutes old
      }
    );
  }, [isSupported]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    try {
      sessionStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    isSupported,
    requestLocation,
    clearLocation,
  };
};

export default useNearMe;