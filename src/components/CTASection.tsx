import { Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "react-router-dom";

const CTASection = () => {
  const { t } = useTranslation();
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
            {t("cta.title")}
          </h2>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            {t("cta.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="accent"
              size="xl"
              className="shadow-elevated"
              asChild
            >
              <Link to="/submit">
                <Plus className="h-5 w-5 mr-2" />
                {t("cta.add_mosque")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
