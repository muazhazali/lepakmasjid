import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { useTranslation } from "@/hooks/use-translation";
import { MapPin, Users, Heart, Code, Github, Mail } from "lucide-react";

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>{t("about.title")} - lepakmasjid</title>
        <meta name="description" content={t("about.meta_description")} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-content" className="flex-1">
          <div className="container-main py-12 lg:py-16">
            {/* Hero Section */}
            <div className="text-center mb-12 lg:mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {t("about.title")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("about.subtitle")}
              </p>
            </div>

            {/* Mission Section */}
            <section className="mb-12 lg:mb-16">
              <div className="bg-card rounded-lg p-8 lg:p-12 border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl lg:text-3xl font-bold">
                    {t("about.mission_title")}
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t("about.mission_content")}
                </p>
              </div>
            </section>

            {/* Values Section */}
            <section className="mb-12 lg:mb-16">
              <h2 className="text-2xl lg:text-3xl font-bold mb-8 text-center">
                {t("about.values_title")}
              </h2>
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {t("about.community_title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("about.community_content")}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <Heart className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {t("about.accessibility_title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("about.accessibility_content")}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <Code className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {t("about.open_source_title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("about.open_source_content")}
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="mb-12 lg:mb-16">
              <div className="bg-card rounded-lg p-8 lg:p-12 border border-border">
                <h2 className="text-2xl lg:text-3xl font-bold mb-6">
                  {t("about.how_it_works_title")}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("about.how_it_works_content")}</p>
                </div>
              </div>
            </section>

            {/* Contribute Section */}
            <section className="mb-12 lg:mb-16">
              <div className="bg-primary/10 rounded-lg p-8 lg:p-12 border border-primary/20">
                <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                  {t("about.contribute_title")}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {t("about.contribute_content")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/submit"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {t("about.add_mosque_button")}
                  </Link>
                  <a
                    href="https://github.com/muazhazali/lepakmasjid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  >
                    <Github className="h-5 w-5" />
                    {t("about.view_on_github")}
                  </a>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <div className="bg-card rounded-lg p-8 lg:p-12 border border-border text-center">
                <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                  {t("about.contact_title")}
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  {t("about.contact_content")}
                </p>
                <p className="text-base text-muted-foreground mb-6">
                  {t("about.contact_email_info")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:hello@lepakmasjid.app"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    <Mail className="h-5 w-5" />
                    {t("about.contact_email")}
                  </a>
                  <a
                    href="https://github.com/muazhazali/lepakmasjid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  >
                    <Github className="h-5 w-5" />
                    {t("about.visit_github")}
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
