import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Mosque } from "@/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MosqueMarkerProps {
  mosque: Mosque;
  onClick?: (mosque: Mosque) => void;
}

// Create custom icon
const createCustomIcon = (color: string = "#22c55e") => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-weight: bold;
        ">🕌</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

export const MosqueMarker = ({ mosque, onClick }: MosqueMarkerProps) => {
  return (
    <Marker
      position={[mosque.lat, mosque.lng]}
      icon={createCustomIcon()}
      eventHandlers={{
        click: () => onClick?.(mosque),
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-sm mb-1">{mosque.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{mosque.address}</p>
          <Link to={`/mosque/${mosque.id}`}>
            <Button size="sm" className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};
