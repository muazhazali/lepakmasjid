import { useState, useMemo, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Filter, Grid, List, MapIcon, Map as MapIcon2, Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import MosqueCard from "@/components/MosqueCard";
import { MapView } from "@/components/Map/MapView";
import { useNearMe } from "@/components/NearMe";
import { LocationPermissionDialog, shouldShowLocationDialog } from "@/components/LocationPermissionDialog";
import { calculateDistance } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMosques, useMosquesAll } from "@/hooks/use-mosques";
import { useTranslation } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkipLink } from "@/components/SkipLink";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { MosqueFilters, Mosque } from "@/types";

const VIEW_MODE_STORAGE_KEY = "explore-view-mode";
const PER_PAGE = 12;

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Near Me geolocation hook
  const {
    location: userLocation,
    isLoading: isLoadingLocation,
    error: locationError,
    requestLocation,
    clearLocation,
  } = useNearMe();

  // Read from URL params
  const searchQuery = searchParams.get("q") || "";
  const selectedState = searchParams.get("state") || "";
  const selectedAmenities = useMemo(() => {
    const amenitiesParam = searchParams.get("amenities");
    return amenitiesParam ? amenitiesParam.split(",").filter(Boolean) : [];
  }, [searchParams]);

  // Near Me state from URL
  const nearMeEnabled = searchParams.get("nearme") === "true";
  const radius = useMemo(() => {
    const radiusParam = searchParams.get("radius");
    const parsed = radiusParam ? parseInt(radiusParam, 10) : 10;
    return parsed > 0 && parsed <= 50 ? parsed : 10;
  }, [searchParams]);

  const viewMode: "grid" | "list" | "map" = useMemo(() => {
    const urlView = searchParams.get("view");
    if (urlView && ["grid", "list", "map"].includes(urlView)) {
      return urlView as "grid" | "list" | "map";
    }
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (saved as "grid" | "list" | "map") || "grid";
  }, [searchParams]);

  const sortBy: "nearest" | "most_amenities" | "alphabetical" = useMemo(() => {
    const urlSort = searchParams.get("sort");
    if (urlSort && ["nearest", "most_amenities", "alphabetical"].includes(urlSort)) {
      return urlSort as "nearest" | "most_amenities" | "alphabetical";
    }
    return "alphabetical";
  }, [searchParams]);

  const currentPage = useMemo(() => {
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    return page > 0 ? page : 1;
  }, [searchParams]);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Show location permission dialog on mount if needed
  useEffect(() => {
    // Don't show dialog if user already has location or dialog was dismissed
    if (userLocation) {
      // User already has location, don't show dialog
      setShowLocationDialog(false);
      return;
    }

    if (!isLoadingLocation && shouldShowLocationDialog()) {
      // Small delay to let the page render and location to be restored from storage
      const timer = setTimeout(() => {
        // Double check userLocation hasn't been set during the delay
        setShowLocationDialog(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userLocation, isLoadingLocation]);

  const handleLocationAccept = () => {
    requestLocation();
  };

  const handleLocationDecline = () => {
    // User declined, dialog will handle saving preference if "never show again" is checked
  };

  // Scroll to content area when page changes
  useEffect(() => {
    if (contentRef.current) {
      const headerOffset = 80; // Offset to account for any fixed headers
      const elementPosition = contentRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [currentPage]);

  // Determine if we need all mosques (for map view or near me filtering)
  const needsAllMosques = viewMode === "map" || (nearMeEnabled && userLocation);

  const filters: MosqueFilters = useMemo(
    () => ({
      state: selectedState || undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      search: searchQuery || undefined,
      sortBy,
      page: !needsAllMosques ? currentPage : undefined,
      perPage: !needsAllMosques ? PER_PAGE : undefined,
    }),
    [
      searchQuery,
      selectedState,
      selectedAmenities,
      sortBy,
      currentPage,
      needsAllMosques,
    ]
  );

  // Use paginated query when not using "Near Me" or map view
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useMosques(!needsAllMosques ? filters : undefined);

  // Use all mosques query for map view or Near Me filtering (cached for 5 minutes)
  const {
    data: allMosquesData = [],
    isLoading: isLoadingAll,
    error: errorAll,
  } = useMosquesAll(
    needsAllMosques
      ? {
          state: selectedState || undefined,
          amenities:
            selectedAmenities.length > 0 ? selectedAmenities : undefined,
          search: searchQuery || undefined,
          sortBy: nearMeEnabled && userLocation ? "nearest" : sortBy,
        }
      : undefined
  );

  // Filter mosques by distance when Near Me is enabled (client-side filtering on cached data)
  const filteredMosques = useMemo(() => {
    if (!nearMeEnabled || !userLocation) {
      return allMosquesData;
    }

    // Filter by radius and sort by distance
    const withDistance = allMosquesData
      .map((mosque) => ({
        ...mosque,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          mosque.lat,
          mosque.lng
        ),
      }))
      .filter((mosque) => mosque.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return withDistance;
  }, [allMosquesData, nearMeEnabled, userLocation, radius]);

  // Get base mosques list
  const baseMosques = useMemo(() => {
    return needsAllMosques ? filteredMosques : paginatedData?.items || [];
  }, [needsAllMosques, filteredMosques, paginatedData?.items]);

  // Add distance to all mosques when user location is available (even if nearMe is not enabled)
  const mosques = useMemo(() => {
    if (!userLocation || needsAllMosques) {
      // If nearMeEnabled, distance is already calculated in filteredMosques
      return baseMosques;
    }

    // Add distance to paginated mosques when we have user location
    return baseMosques.map((mosque) => ({
      ...mosque,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        mosque.lat,
        mosque.lng
      ),
    }));
  }, [baseMosques, userLocation, needsAllMosques]);
  const isLoadingView = needsAllMosques ? isLoadingAll : isLoading;
  const errorView = needsAllMosques ? errorAll : error;
  const totalPages = needsAllMosques ? 1 : paginatedData?.totalPages || 1;
  const totalItems = needsAllMosques ? filteredMosques.length : paginatedData?.totalItems || mosques.length;

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    setSearchParams(params, { replace: true });
  };

  const setSearchQuery = (query: string) => {
    updateParams({ q: query, page: null }); // Reset page when searching
  };

  const setSelectedState = (state: string) => {
    updateParams({ state, page: null }); // Reset page when filtering
  };

  const setSelectedAmenities = (amenities: string[]) => {
    updateParams({ 
      amenities: amenities.length > 0 ? amenities.join(",") : null,
      page: null // Reset page when filtering
    });
  };

  const setSortBy = (sort: "nearest" | "most_amenities" | "alphabetical") => {
    updateParams({ 
      sort: sort !== "alphabetical" ? sort : null,
      page: null // Reset page when sorting
    });
  };

  const setViewMode = (mode: "grid" | "list" | "map") => {
    updateParams({
      view: mode,
      page: null // Reset page when changing view
    });
  };

  const setCurrentPage = (page: number) => {
    updateParams({ page: page > 1 ? page.toString() : null });
  };

  const setNearMeEnabled = (enabled: boolean) => {
    if (enabled) {
      // Request location when enabling Near Me
      requestLocation();
      updateParams({ nearme: "true", page: null });
    } else {
      clearLocation();
      updateParams({ nearme: null, radius: null, page: null });
    }
  };

  const setRadius = (newRadius: number) => {
    updateParams({ radius: newRadius !== 10 ? newRadius.toString() : null });
  };

  const clearFilters = () => {
    clearLocation();
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleViewModeChange = (mode: "grid" | "list" | "map") => {
    setViewMode(mode);
  };

  const activeFilterCount =
    (selectedState ? 1 : 0) + selectedAmenities.length + (searchQuery ? 1 : 0) + (nearMeEnabled ? 1 : 0);

  return (
    <>
      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onAccept={handleLocationAccept}
        onDecline={handleLocationDecline}
      />

      <SkipLink />
      <Helmet>
        <title>{t("explore.title")} - LepakMasjid</title>
        <meta name="description" content={t("explore.subtitle")} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main id="main-content" className="flex-1">
          {/* Page header */}
          <div className="bg-secondary/30 border-b border-border">
            <div className="container-main py-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                {t("explore.title")}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("explore.subtitle")}
              </p>
            </div>
          </div>

          <div ref={contentRef} className="container-main py-8">
            <div className="flex gap-8">
              {/* Sidebar */}
              <FilterSidebar
                selectedState={selectedState}
                onStateChange={setSelectedState}
                selectedAmenities={selectedAmenities}
                onAmenitiesChange={setSelectedAmenities}
                onClear={clearFilters}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                sortBy={sortBy}
                onSortChange={setSortBy}
                // Near Me props
                nearMeEnabled={nearMeEnabled}
                onNearMeToggle={setNearMeEnabled}
                userLocation={userLocation}
                isLoadingLocation={isLoadingLocation}
                locationError={locationError}
                distance={radius}
                onDistanceChange={setRadius}
              />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      type="search"
                      placeholder={t("explore.search_placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate("/submit")}
                      className="h-12"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("nav.contribute")}
                    </Button>
                    <Button
                      variant="outline"
                      className="lg:hidden"
                      onClick={() => setIsFilterOpen(true)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {t("common.filter")}
                      {activeFilterCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                    <div className="flex border border-border rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => handleViewModeChange("grid")}
                        className="rounded-none"
                        aria-label={t("explore.grid_view")}
                        aria-pressed={viewMode === "grid"}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => handleViewModeChange("list")}
                        className="rounded-none"
                        aria-label={t("explore.list_view")}
                        aria-pressed={viewMode === "list"}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "map" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => handleViewModeChange("map")}
                        className="rounded-none"
                        aria-label={t("explore.map_view")}
                        aria-pressed={viewMode === "map"}
                      >
                        <MapIcon2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error state */}
                {errorView && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                      {errorView instanceof Error
                        ? errorView.message
                        : t("featured.error")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Results count */}
                {!errorView && (
                  <p className="text-sm text-muted-foreground mb-6">
                    {viewMode === "map" ? (
                      <>
                        {t("explore.showing")}{" "}
                        <span className="font-medium text-foreground">
                          {totalItems}
                        </span>{" "}
                        {t("explore.mosques")}
                      </>
                    ) : (
                      <>
                        {t("explore.showing")}{" "}
                        <span className="font-medium text-foreground">
                          {totalItems > 0 ? (needsAllMosques ? 1 : (currentPage - 1) * PER_PAGE + 1) : 0}
                        </span>
                        {" - "}
                        <span className="font-medium text-foreground">
                          {needsAllMosques ? totalItems : Math.min(currentPage * PER_PAGE, totalItems)}
                        </span>
                        {" of "}
                        <span className="font-medium text-foreground">
                          {totalItems}
                        </span>{" "}
                        {t("explore.mosques")}
                      </>
                    )}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="ml-2 text-primary hover:underline"
                      >
                        {t("explore.clear_filters")}
                      </button>
                    )}
                  </p>
                )}

                {/* Results */}
                {isLoadingView ? (
                  <div
                    className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : viewMode === "list" ? "grid-cols-1" : "grid-cols-1"}`}
                  >
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton
                        key={i}
                        className={
                          viewMode === "list" ? "h-48 w-full" : "h-64 w-full"
                        }
                      />
                    ))}
                  </div>
                ) : errorView ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                      <MapIcon className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t("explore.connection_error")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("explore.connection_error_message")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      {t("explore.retry")}
                    </Button>
                  </div>
                ) : viewMode === "map" ? (
                  <MapView mosques={mosques} className="h-[600px] w-full" />
                ) : mosques.length > 0 ? (
                  <>
                    <div
                      className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
                    >
                      {mosques.map((mosque, index) => (
                        <div
                          key={mosque.id}
                          className={`animate-fade-up ${viewMode === "list" ? "flex" : ""}`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <MosqueCard mosque={mosque} viewMode={viewMode} />
                        </div>
                      ))}
                    </div>

                    {/* Pagination - only show when not in map view or near me mode */}
                    {!needsAllMosques && totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                  }
                                }}
                                className={
                                  currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                                aria-disabled={currentPage === 1}
                              />
                            </PaginationItem>

                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }

                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentPage(pageNum);
                                      }}
                                      isActive={currentPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                            )}

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage < totalPages) {
                                    setCurrentPage(currentPage + 1);
                                  }
                                }}
                                className={
                                  currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                                aria-disabled={currentPage === totalPages}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <MapIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t("explore.no_results")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("explore.adjust_search")}
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      {t("explore.clear_filters")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Explore;
