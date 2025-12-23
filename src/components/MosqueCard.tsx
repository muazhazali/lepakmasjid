import { MapPin, Wifi, Laptop, BookOpen, Accessibility, Car, Droplets, Users, Wind, Coffee, GraduationCap } from 'lucide-react';
import { Mosque, AMENITIES } from '@/data/mosques';
import { Badge } from '@/components/ui/badge';

interface MosqueCardProps {
  mosque: Mosque;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wifi,
  Laptop,
  BookOpen,
  Accessibility,
  Car,
  Droplets,
  Users,
  Wind,
  Coffee,
  GraduationCap,
};

const MosqueCard = ({ mosque, onClick }: MosqueCardProps) => {
  const mosqueAmenities = AMENITIES.filter((a) => mosque.amenities.includes(a.key));
  const displayAmenities = mosqueAmenities.slice(0, 4);
  const remainingCount = mosqueAmenities.length - displayAmenities.length;

  return (
    <article
      onClick={onClick}
      className="card-elevated p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      role="button"
      tabIndex={0}
      aria-label={`View details for ${mosque.name}`}
    >
      {/* Image placeholder with gradient */}
      <div className="relative h-40 rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
        </div>
        {/* State badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
        >
          {mosque.state.replace('Wilayah Persekutuan ', 'WP ')}
        </Badge>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {mosque.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {mosque.address}
          </p>
        </div>

        {/* Description */}
        {mosque.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {mosque.description}
          </p>
        )}

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          {displayAmenities.map((amenity) => {
            const IconComponent = iconMap[amenity.icon];
            return (
              <div
                key={amenity.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
                title={amenity.label_en}
              >
                {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{amenity.label_en}</span>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className="flex items-center px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
              +{remainingCount} more
            </div>
          )}
        </div>

        {/* Activities count */}
        {mosque.activities.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-primary font-medium">
              {mosque.activities.length} {mosque.activities.length === 1 ? 'activity' : 'activities'} available
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default MosqueCard;
