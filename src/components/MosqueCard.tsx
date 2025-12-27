import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Mosque } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguageStore } from '@/stores/language';
import * as LucideIcons from 'lucide-react';
import { getImageUrl } from '@/lib/pocketbase-images';

interface MosqueCardProps {
  mosque: Mosque;
  onClick?: () => void;
  viewMode?: 'grid' | 'list';
}

const MosqueCard = ({ mosque, onClick, viewMode = 'grid' }: MosqueCardProps) => {
  const { language } = useLanguageStore();
  
  const displayName = language === 'bm' && mosque.name_bm ? mosque.name_bm : mosque.name;
  
  // Get image URL for the mosque
  const imageUrl = getImageUrl(mosque as any, mosque.image, viewMode === 'list' ? '300x200' : '400x300');
  const isListView = viewMode === 'list';

  // Get icon component dynamically
  // Convert icon name to PascalCase and handle special cases
  const getIcon = (iconName: string) => {
    if (!iconName) return MapPin;
    
    // Normalize the icon name (lowercase, handle hyphens)
    const normalized = iconName.toLowerCase().trim();
    
    // Map lowercase icon names from seed data to Lucide React icon names
    const iconMap: Record<string, string> = {
      'wifi': 'Wifi',
      'laptop': 'Laptop',
      'book': 'BookOpen',
      'accessibility': 'Accessibility',
      'car': 'Car',
      'droplet': 'Droplet',
      'users': 'Users',
      'wind': 'Wind',
      'utensils': 'UtensilsCrossed',
      'graduation-cap': 'GraduationCap',
      'graduationcap': 'GraduationCap',
    };
    
    // Get the mapped icon name
    const mappedName = iconMap[normalized];
    
    // Try to get the icon component
    const IconComponent = mappedName 
      ? ((LucideIcons as any)[mappedName] || MapPin)
      : MapPin;
    
    return IconComponent;
  };

  // Combine regular amenities and custom amenities
  const allAmenities = [
    ...(mosque.amenities || []).map(amenity => ({
      id: amenity.id,
      label: language === 'bm' ? amenity.label_bm : amenity.label_en,
      icon: amenity.icon,
      isCustom: false,
    })),
    ...(mosque.customAmenities || []).map(customAmenity => ({
      id: customAmenity.id,
      label: language === 'bm' 
        ? (customAmenity.details.custom_name || 'Custom Amenity')
        : (customAmenity.details.custom_name_en || 'Custom Amenity'),
      icon: customAmenity.details.custom_icon || 'MapPin',
      isCustom: true,
    })),
  ];

  // Get activities with language support
  const activities = mosque.activities || [];
  const displayActivities = activities.map(activity => ({
    id: activity.id,
    title: language === 'bm' && activity.title_bm ? activity.title_bm : activity.title,
  }));
  
  // Show first 3 activities, then "+X more"
  const MAX_VISIBLE_ACTIVITIES = 3;
  const visibleActivities = displayActivities.slice(0, MAX_VISIBLE_ACTIVITIES);
  const remainingCount = displayActivities.length - MAX_VISIBLE_ACTIVITIES;

  return (
    <Link to={`/mosque/${mosque.id}`} onClick={onClick}>
      <article
        className={`card-elevated cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
          isListView 
            ? 'flex gap-4 p-4' 
            : 'p-5'
        }`}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${displayName}`}
      >
        {/* Image */}
        <div className={`relative rounded-lg overflow-hidden ${isListView ? 'w-48 h-32 flex-shrink-0' : 'h-40 mb-4'}`}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}
          {/* State badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
          >
            {mosque.state.replace('Wilayah Persekutuan ', 'WP ')}
          </Badge>
        </div>

        {/* Content */}
        <div className={`${isListView ? 'flex-1 min-w-0' : 'space-y-3'}`}>
          <div>
            <h3 className={`font-display font-bold text-foreground group-hover:text-primary transition-colors ${
              isListView ? 'text-lg line-clamp-1' : 'text-xl line-clamp-1'
            }`}>
              {displayName}
            </h3>
            <p className={`text-muted-foreground mt-1 ${isListView ? 'text-sm line-clamp-1' : 'text-sm line-clamp-2'}`}>
              {mosque.address}
            </p>
          </div>

          {/* Amenities */}
          {allAmenities.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isListView ? 'mt-2' : 'pt-2'}`}>
              {allAmenities.slice(0, isListView ? 4 : allAmenities.length).map((amenity) => {
                const IconComponent = getIcon(amenity.icon);
                return (
                  <Badge
                    key={amenity.id}
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-normal px-2.5 py-1 flex items-center gap-1.5"
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span className="text-xs">{amenity.label}</span>
                  </Badge>
                );
              })}
              {isListView && allAmenities.length > 4 && (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground font-normal px-2.5 py-1"
                >
                  <span className="text-xs">+{allAmenities.length - 4} more</span>
                </Badge>
              )}
            </div>
          )}

          {/* Activities */}
          {displayActivities.length > 0 && (
            <>
              {allAmenities.length > 0 && !isListView && (
                <Separator className="my-3 border-border" />
              )}
              {isListView && allAmenities.length > 0 && (
                <Separator className="my-2 border-border" />
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {visibleActivities.slice(0, isListView ? 2 : visibleActivities.length).map((activity) => (
                  <Badge
                    key={activity.id}
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-normal px-2.5 py-1"
                  >
                    <span className="text-xs">{activity.title}</span>
                  </Badge>
                ))}
                {remainingCount > 0 && !isListView && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-normal px-2.5 py-1"
                  >
                    <span className="text-xs">+{remainingCount} more</span>
                  </Badge>
                )}
                {isListView && displayActivities.length > 2 && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground font-normal px-2.5 py-1"
                  >
                    <span className="text-xs">+{displayActivities.length - 2} more</span>
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </article>
    </Link>
  );
};

export default MosqueCard;
