import { MapPin, Users, Building2, Star } from 'lucide-react';

const stats = [
  {
    icon: Building2,
    value: '500+',
    label: 'Mosques Listed',
    description: 'Growing directory',
  },
  {
    icon: MapPin,
    value: '16',
    label: 'States Covered',
    description: 'Nationwide coverage',
  },
  {
    icon: Users,
    value: '1,200+',
    label: 'Contributors',
    description: 'Community powered',
  },
  {
    icon: Star,
    value: '98%',
    label: 'Accuracy Rate',
    description: 'Verified information',
  },
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container-main">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-background shadow-soft animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
