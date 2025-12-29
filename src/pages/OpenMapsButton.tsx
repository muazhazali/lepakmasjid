import React from "react";

interface OpenMapsButtonProps {
  lat: number;
  lng: number;
}

const OpenMapsButton: React.FC<OpenMapsButtonProps> = ({ lat, lng }) => {
  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank"); // opens in a new tab
  };

  return (
    <button
      onClick={openMaps}
      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
    >
      Open in Maps
    </button>
  );
};

export default OpenMapsButton;
