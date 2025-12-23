import { X, Wifi, Laptop, BookOpen, Accessibility, Car, Droplets, Users, Wind, Coffee, GraduationCap } from 'lucide-react';
import { AMENITIES, STATES } from '@/data/mosques';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterSidebarProps {
  selectedState: string;
  onStateChange: (state: string) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
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

const FilterSidebar = ({
  selectedState,
  onStateChange,
  selectedAmenities,
  onAmenitiesChange,
  onClear,
  isOpen,
  onClose,
}: FilterSidebarProps) => {
  const handleAmenityToggle = (key: string) => {
    if (selectedAmenities.includes(key)) {
      onAmenitiesChange(selectedAmenities.filter((a) => a !== key));
    } else {
      onAmenitiesChange([...selectedAmenities, key]);
    }
  };

  const hasActiveFilters = selectedState !== '' || selectedAmenities.length > 0;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 h-full lg:h-auto w-80 lg:w-72 
          bg-background lg:bg-transparent border-r lg:border-0 border-border
          transform transition-transform duration-300 z-50 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        <div className="p-6 lg:p-0 space-y-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-display text-xl font-bold">Filters</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedAmenities.length + (selectedState ? 1 : 0)} active filters
              </span>
              <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive">
                Clear all
              </Button>
            </div>
          )}

          {/* State filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">State</Label>
            <Select value={selectedState} onValueChange={onStateChange}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amenities filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Facilities</Label>
            <div className="space-y-2">
              {AMENITIES.map((amenity) => {
                const IconComponent = iconMap[amenity.icon];
                const isChecked = selectedAmenities.includes(amenity.key);
                
                return (
                  <label
                    key={amenity.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${isChecked ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary border border-transparent'}
                    `}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleAmenityToggle(amenity.key)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {IconComponent && (
                        <IconComponent className={`h-4 w-4 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                      <span className={`text-sm font-medium ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {amenity.label_en}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Apply button (mobile) */}
          <div className="lg:hidden pt-4">
            <Button className="w-full" onClick={onClose}>
              Apply Filters
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
