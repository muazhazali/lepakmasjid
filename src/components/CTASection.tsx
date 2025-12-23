import { Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-16 lg:py-24 bg-primary pattern-islamic relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />

      <div className="container-main relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 text-primary-foreground mb-6">
            <Heart className="h-8 w-8" />
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 text-balance">
            Help Build the Largest Mosque Directory
          </h2>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Know a mosque with great facilities? Contribute to our community directory and help travelers, remote workers, and the elderly find the perfect prayer space.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="xl" className="shadow-elevated">
              <Plus className="h-5 w-5 mr-2" />
              Add a Mosque
            </Button>
            <Button 
              variant="ghost" 
              size="xl" 
              className="text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Learn How to Contribute
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
