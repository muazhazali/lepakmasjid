import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Filter, Grid, List, MapIcon, Map as MapIcon2, Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import MosqueCard from "@/components/MosqueCard";
import { MapView } from "@/components/Map/MapView";
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
import type { MosqueFilters } from "@/types";

const VIEW_MODE_STORAGE_KEY = "explore-view-mode";
const PER_PAGE = 12;

const Explore = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedState, setSelectedState] = useState(
    searchParams.get("state") || ""
  );

  // Initialize amenities from URL params
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => {
    const amenitiesParam = searchParams.get("amenities");
    if (amenitiesParam) {
      return amenitiesParam.split(",").filter(Boolean);
    }
    return [];
  });

  // Initialize view mode from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (saved as "grid" | "list" | "map") || "grid";
  });

  const [sortBy, setSortBy] = useState<
    "nearest" | "most_amenities" | "alphabetical"
  >("alphabetical");
  const [currentPage, setCurrentPage] = useState(1);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedState, selectedAmenities, sortBy]);

  const filters: MosqueFilters = useMemo(
    () => ({
      state: selectedState || undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      search: searchQuery || undefined,
      sortBy,
      page: viewMode !== "map" ? currentPage : undefined,
      perPage: viewMode !== "map" ? PER_PAGE : undefined,
    }),
    [
      searchQuery,
      selectedState,
      selectedAmenities,
      sortBy,
      currentPage,
      viewMode,
    ]
  );

  // Use paginated query for grid/list view, all mosques for map view
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useMosques(viewMode !== "map" ? filters : undefined);
  const {
    data: allMosques = [],
    isLoading: isLoadingAll,
    error: errorAll,
  } = useMosquesAll(
    viewMode === "map"
      ? {
          state: selectedState || undefined,
          amenities:
            selectedAmenities.length > 0 ? selectedAmenities : undefined,
          search: searchQuery || undefined,
          sortBy,
        }
      : undefined
  );

  const mosques = viewMode === "map" ? allMosques : paginatedData?.items || [];
  const isLoadingView = viewMode === "map" ? isLoadingAll : isLoading;
  const errorView = viewMode === "map" ? errorAll : error;
  const totalPages = paginatedData?.totalPages || 1;
  const totalItems = paginatedData?.totalItems || mosques.length;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("");
    setSelectedAmenities([]);
    setCurrentPage(1);
    navigate("/explore", { replace: true });
  };

  const handleViewModeChange = (mode: "grid" | "list" | "map") => {
    setViewMode(mode);
    setCurrentPage(1); // Reset to first page when changing view mode
  };

  const activeFilterCount =
    (selectedState ? 1 : 0) + selectedAmenities.length + (searchQuery ? 1 : 0);

  return (
    <>
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

          <div className="container-main py-8">
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
                          {(currentPage - 1) * PER_PAGE + 1}
                        </span>
                        {" - "}
                        <span className="font-medium text-foreground">
                          {Math.min(currentPage * PER_PAGE, totalItems)}
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

                    {/* Pagination */}
                    {viewMode !== "map" && totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage > 1) {
                                    setCurrentPage((prev) => prev - 1);
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
                                    setCurrentPage((prev) => prev + 1);
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
