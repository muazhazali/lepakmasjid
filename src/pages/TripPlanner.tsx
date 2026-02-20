"use client";

import Header from "@/components/Header";
import MapOSM from "@/components/MapOSM";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Navigation, ArrowRight } from "lucide-react";
import { usePlaceSearch } from "@/hooks/use-place-search";
import { useState } from "react";
import { useCoords } from "@/hooks/use-coords";
import { useRoutes } from "@/hooks/use-route";

import { useMosquesAll } from "@/hooks/use-mosques";
import { useRouteMosque } from "@/hooks/use-route-mosque";

import type { Mosque } from "@/types";
import { X } from "lucide-react";

const TripPlanner = () => {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [showFromResults, setShowFromResults] = useState(false);
  const [showToResults, setShowToResults] = useState(false);
  const [fromPlace, setFromPlace] = useState<any>(null);
  const [toPlace, setToPlace] = useState<any>(null);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const { results: fromResults } = usePlaceSearch(fromValue);
  const { results: toResults } = usePlaceSearch(toValue);
  const { coords: fromCoords } = useCoords(fromPlace);
  const { coords: toCoords } = useCoords(toPlace);
  
  const [searchTrigger, setSearchTrigger] = useState<{from: any, to: any} | null>(null);
  const { routes, loading } = useRoutes(searchTrigger?.from, searchTrigger?.to);
  const { data: mosques } = useMosquesAll();
  const { mosquesAlongRoute, closestMosque } = useRouteMosque(mosques, routes);
  
  const handleSearch = () => {
    if (fromCoords && toCoords) {
      setSearchTrigger({ from: fromCoords, to: toCoords });
    }
  };
  
  const handleFromSelect = (place: any) => {
    setFromValue(place.display_name);
    setFromPlace(place);
    setShowFromResults(false);
  };

  const handleToSelect = (place: any) => {
    setToValue(place.display_name);
    setToPlace(place);
    setShowToResults(false);
  };

  const mapCenter = toPlace
    ? { lat: parseFloat(toPlace.lat), lon: parseFloat(toPlace.lon) }
    : fromPlace
      ? { lat: parseFloat(fromPlace.lat), lon: parseFloat(fromPlace.lon) }
      : undefined;

  return (
    <div className="min-h-screen flex flex-col supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh]">
      <Header />
      <main className="flex-grow relative h-[calc(100vh-4rem)]">
        {/* Floating Search Card */}
        <div className="absolute top-2 md:top-4 left-0 md:left-4 z-[1000] w-full md:w-auto md:max-w-md px-2 md:px-0 pointer-events-none flex flex-col gap-2">
          {/* Main Search Logic - pointer-events-auto for interactions */}
          <div className="bg-white/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-2xl border border-white/20 space-y-4 md:space-y-6 pointer-events-auto transition-all duration-300">
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Plan Your Journey
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Find the best route and discover mosques along your way
              </p>
            </div>

            <div className="space-y-3 md:space-y-4">
              {/* FROM Input */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-green-500" /> From
                </label>
                <div className="relative group">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <Input
                      value={fromValue}
                      onChange={(e) => {
                        setFromValue(e.target.value);
                        setShowFromResults(true);
                      }}
                      placeholder="Enter starting location..."
                      className="pl-10 pr-4 py-4 md:py-6 text-sm md:text-base bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm rounded-xl text-black"
                    />
                  </div>
                  {showFromResults && fromResults.length > 0 && (
                    <ul className="absolute z-[2000] mt-2 w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-xl max-h-48 md:max-h-60 overflow-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-200">
                      {fromResults.map((place, i) => (
                        <li
                          key={i}
                          className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer flex items-start gap-3 transition-colors group/item"
                          onClick={() => handleFromSelect(place)}
                        >
                          <MapPin className="h-4 w-4 text-gray-400 group-hover/item:text-blue-500 mt-1 shrink-0 transition-colors" />
                          <span className="text-sm text-gray-700 line-clamp-2">
                            {place.display_name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* TO Input */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-green-500" /> To
                </label>
                <div className="relative group">
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    <Input
                      value={toValue}
                      onChange={(e) => {
                        setToValue(e.target.value);
                        setShowToResults(true);
                      }}
                      placeholder="Enter destination..."
                      className="pl-10 pr-4 py-4 md:py-6 text-sm md:text-base bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all shadow-sm rounded-xl text-black"
                    />
                  </div>
                  {showToResults && toResults.length > 0 && (
                    <ul className="absolute z-[2000] mt-2 w-full bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-xl max-h-48 md:max-h-60 overflow-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-200">
                      {toResults.map((place, i) => (
                        <li
                          key={i}
                          className="px-4 py-3 hover:bg-green-50/50 cursor-pointer flex items-start gap-3 transition-colors group/item"
                          onClick={() => handleToSelect(place)}
                        >
                          <Navigation className="h-4 w-4 text-gray-400 group-hover/item:text-green-500 mt-1 shrink-0 transition-colors" />
                          <span className="text-sm text-gray-700 line-clamp-2">
                            {place.display_name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                disabled={!fromCoords || !toCoords || loading}
                className="w-full py-6 text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
              >
                {loading ? "Calculating..." : "Search Route"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              {/* Loading Indicator */}
              {loading && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-center gap-3 py-3 bg-blue-50/50 rounded-xl border border-blue-100 text-green-600">
                    <div className="h-5 w-5 bg-green-500 rounded-full animate-ping absolute opacity-20"></div>
                    <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin relative"></div>
                    <span className="text-sm font-medium">
                      Calculating best route...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Mosque Card */}
          {selectedMosque && (
            <div className="mt-2 md:mt-4 bg-white/90 backdrop-blur-xl p-0 rounded-2xl shadow-2xl border border-white/20 overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-500 ring-1 ring-black/5">
              <div className="relative group">
                {/* Image Header */}
                <div className="h-32 md:h-40 bg-gray-100 w-full relative overflow-hidden">
                  {selectedMosque.image &&
                  typeof selectedMosque.image === "string" ? (
                    <img
                      src={`https://pb.muaz.app/api/files/${selectedMosque.collectionId}/${selectedMosque.id}/${selectedMosque.image}`}
                      alt={selectedMosque.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-300">
                      <MapPin className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60" />

                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border border-white/10 shadow-sm transition-all"
                    onClick={() => setSelectedMosque(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 md:p-5 space-y-3 -mt-4 relative">
                  <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-base md:text-lg leading-tight text-gray-900 mb-1">
                      {selectedMosque.name}
                    </h3>
                    <div className="flex items-start gap-2 text-gray-500">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed line-clamp-2">
                        {selectedMosque.address}
                      </p>
                    </div>
                  </div>
                  
                 
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="h-full w-full bg-gray-100">
          <MapOSM
            className="h-full w-full mt-0 rounded-none z-0"
            lat={mapCenter?.lat}
            lon={mapCenter?.lon}
            route={routes}
            mosques={mosquesAlongRoute}
            onMosqueClick={setSelectedMosque}
          />
        </div>
      </main>
    </div>
  );
};

export default TripPlanner;
