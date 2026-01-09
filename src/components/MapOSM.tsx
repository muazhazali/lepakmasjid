"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow,
});

import { cn } from "@/lib/utils";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function MapController({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], zoom);
  }, [lat, lon, zoom, map]);
  return null;
}

import type { Mosque } from "@/types";

type MapOSMProps = {
  lat?: number;
  lon?: number;
  zoom?: number;
  className?: string;
  route?: { lat: number; lon: number }[];
  mosques?: Mosque[];
  onMosqueClick?: (mosque: Mosque) => void;
};

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapOSM({
  lat = 3.139,
  lon = 101.6869,
  zoom = 13,
  className,
  route,
  mosques,
  onMosqueClick,
}: MapOSMProps) {
  const routePoints = route?.map((p) => [p.lat, p.lon] as [number, number]);
  const start = routePoints?.[0]; 
  const end = routePoints?.[routePoints.length - 1]; 

  return (
    <div className={cn("w-full h-[500px] mt-6 rounded-xl overflow-hidden", className)}>
      <MapContainer
        center={[lat, lon]}
        zoom={zoom}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="bottomright" />
        <MapController lat={lat} lon={lon} zoom={zoom} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Route polyline */}
        {routePoints && <Polyline positions={routePoints} color="green" />}

        {/* Start marker */}
        {start && (
          <Marker position={start} icon={greenIcon}>
            <Popup>Start</Popup>
          </Marker>
        )}

        {/* End marker */}
        {end && (
          <Marker position={end} icon={greenIcon}>
            <Popup>End</Popup>
          </Marker>
        )}

        {/* Mosque markers */}
        {mosques?.map((mosque) => (
          <Marker
            key={mosque.id}
            position={[mosque.lat, mosque.lng]}
            icon={blueIcon}
            eventHandlers={{
              click: () => onMosqueClick?.(mosque),
            }}
          >
           {/* Popup removed to rely on side UI, or can keep it active */} 
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
