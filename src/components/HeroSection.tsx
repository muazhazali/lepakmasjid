import { Search, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

const HeroSection = ({ searchQuery, onSearchChange, onSearch }: HeroSectionProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-medium mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <MapPin className="h-4 w-4" />
            <span>Community-powered mosque directory</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-up text-balance" style={{ animationDelay: '0.2s' }}>
            Find Your Perfect{' '}
            <span className="relative">
              Prayer Space
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Discover mosques with the facilities you need — WiFi, workspace, accessibility features, and more. Updated by the community, for the community.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search mosque name or location..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-12 h-14 text-lg bg-background border-0 shadow-elevated placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" variant="accent" size="lg" className="h-14 px-8">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <span className="text-primary-foreground/60 text-sm">Popular:</span>
            {['WiFi', 'Working Space', 'OKU Friendly', 'Parking'].map((filter) => (
              <button
                key={filter}
                className="px-3 py-1.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground/90 text-sm font-medium transition-colors"
              >
                {filter}
              </button>
            ))}
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
