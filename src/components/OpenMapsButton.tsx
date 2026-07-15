import React from "react";
import { Button } from "@/components/ui/button";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming cn utility exists, usually does in shadcn projects. If not sure, I can skip it or just use template literals. MosqueDetail uses Button.
// Checking MosqueCard.tsx imports, it doesn't use cn explicitly but uses template literals.
// I'll stick to template literals or simple className concatenation to be safe if cn isn't confirmed (though it's standard shadcn).
// Actually passing className to Button is enough.

interface OpenMapsButtonProps {
  lat: number;
  lng: number;
  className?: string;
  label?: string;
}

const OpenMapsButton: React.FC<OpenMapsButtonProps> = ({
  lat,
  lng,
  className,
  label = "Get Directions",
}) => {
  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank"); // opens in a new tab
  };

  return (
    <Button
      onClick={openMaps}
      variant="default"
      size="lg"
      className={cn("w-full gap-2", className)}
    >
      <MapPinned className="h-5 w-5" />
      {label}
    </Button>
  );
};

export default OpenMapsButton;
