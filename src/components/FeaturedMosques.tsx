import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MosqueCard from '@/components/MosqueCard';
import { MOCK_MOSQUES } from '@/data/mosques';

const FeaturedMosques = () => {
  const featured = MOCK_MOSQUES.slice(0, 3);

  return (
    <section className="py-16 lg:py-24">
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Mosques
            </h2>
            <p className="text-muted-foreground text-lg">
              Discover popular mosques with excellent facilities
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" className="group">
              View all mosques
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((mosque, index) => (
            <div
              key={mosque.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <MosqueCard mosque={mosque} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedMosques;
