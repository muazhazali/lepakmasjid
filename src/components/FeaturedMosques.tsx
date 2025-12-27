import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MosqueCard from '@/components/MosqueCard';
import { useMosques } from '@/hooks/use-mosques';
import { useTranslation } from '@/hooks/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FeaturedMosques = () => {
  const { data: mosquesData, isLoading, error } = useMosques({ perPage: 3 });
  const { t } = useTranslation();
  const mosques = mosquesData?.items || [];
  const featured = mosques.slice(0, 3);

  return (
    <section className="py-16 lg:py-24">
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t('featured.title')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('featured.subtitle')}
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" className="group">
              {t('featured.view_all')}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error instanceof Error ? error.message : t('featured.error')}
            </AlertDescription>
          </Alert>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('featured.error_message')}</p>
          </div>
        ) : featured.length > 0 ? (
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
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('featured.no_mosques')}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedMosques;
