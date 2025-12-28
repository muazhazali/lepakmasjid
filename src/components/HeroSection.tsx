import { Search, MapPin, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { useAmenities } from "@/hooks/use-amenities";

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

const HeroSection = ({
  searchQuery,
  onSearchChange,
  onSearch,
}: HeroSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: amenities = [] } = useAmenities();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  // Map filter display names to amenity keys
  const filterMap: Record<string, string> = {
    WiFi: "wifi",
    "Working Space": "working_space",
    "OKU Friendly": "oku_access",
    Parking: "parking",
  };

  const handleFilterClick = (filterName: string) => {
    const amenityKey = filterMap[filterName];
    if (!amenityKey) return;

    // Find the amenity by key
    const amenity = amenities.find((a) => a.key === amenityKey);
    if (!amenity) return;

    // Navigate to explore page with the amenity filter
    navigate(`/explore?amenities=${amenity.id}`);
  };

  return (
    <section className="relative overflow-hidden bg-primary pattern-islamic">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />

      <div className="relative container-main py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-medium mb-6 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <MapPin className="h-4 w-4" />
            <span>{t("hero.badge")}</span>
          </div>

          {/* Headline */}
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-up text-balance"
            style={{ animationDelay: "0.2s" }}
          >
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            {t("hero.subtitle")}
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("hero.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-12 h-14 text-lg bg-background border-0 shadow-elevated placeholder:text-muted-foreground"
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="h-14 px-8"
              >
                <Search className="h-5 w-5 mr-2" />
                {t("hero.search_button")}
              </Button>
            </div>
          </form>

          {/* Quick filters */}
          <div
            className="flex flex-wrap justify-center items-center gap-2 mt-6 animate-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            <span className="text-primary-foreground/60 text-sm w-full sm:w-auto text-center sm:text-left">
              {t("hero.popular")}
            </span>
            {["WiFi", "Working Space", "OKU Friendly", "Parking"].map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterClick(filter)}
                  className="px-3 py-1.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 active:bg-primary-foreground/30 text-primary-foreground/90 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 focus:ring-offset-2 focus:ring-offset-primary"
                >
                  {filter}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full h-auto">
          <path
            d="M0 80V40C240 0 480 0 720 40C960 80 1200 80 1440 40V80H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
