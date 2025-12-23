import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, MapIcon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterSidebar from '@/components/FilterSidebar';
import MosqueCard from '@/components/MosqueCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_MOSQUES, Mosque } from '@/data/mosques';

const Explore = () => {
  const [searchParams] = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedState, setSelectedState] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newValue);
  };

  const filteredMosques = useMemo(() => {
    return MOCK_MOSQUES.filter((mosque) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = mosque.name.toLowerCase().includes(query);
        const matchesAddress = mosque.address.toLowerCase().includes(query);
        const matchesState = mosque.state.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesState) return false;
      }

      // State filter
      if (selectedState && selectedState !== 'all' && mosque.state !== selectedState) {
        return false;
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every((a) => mosque.amenities.includes(a));
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  }, [searchQuery, selectedState, selectedAmenities]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setSelectedAmenities([]);
  };

  const activeFilterCount = (selectedState ? 1 : 0) + selectedAmenities.length;

  return (
    <>
      <Helmet>
        <title>Explore Mosques - lepakmasjid</title>
        <meta 
          name="description" 
          content="Browse and search mosques in Malaysia. Filter by state, facilities like WiFi, working space, and accessibility features." 
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header isDark={isDark} onToggleTheme={toggleTheme} />

        <main className="flex-1">
          {/* Page header */}
          <div className="bg-secondary/30 border-b border-border">
            <div className="container-main py-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Explore Mosques
              </h1>
              <p className="text-muted-foreground text-lg">
                Find mosques with the facilities you need
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
              />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      type="search"
                      placeholder="Search mosques..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="lg:hidden"
                      onClick={() => setIsFilterOpen(true)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                    <div className="hidden sm:flex border border-border rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                        className="rounded-none"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                        className="rounded-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Results count */}
                <p className="text-sm text-muted-foreground mb-6">
                  Showing <span className="font-medium text-foreground">{filteredMosques.length}</span> mosques
                  {(searchQuery || selectedState || selectedAmenities.length > 0) && (
                    <button 
                      onClick={clearFilters}
                      className="ml-2 text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </p>

                {/* Results grid */}
                {filteredMosques.length > 0 ? (
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {filteredMosques.map((mosque, index) => (
                      <div
                        key={mosque.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <MosqueCard mosque={mosque} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <MapIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No mosques found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search or filter criteria
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
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
