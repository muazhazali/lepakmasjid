import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { useTranslation } from "@/hooks/use-translation";

const TermsOfUse = () => {
  const { t } = useTranslation();

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>{t("terms.title")} - lepakmasjid</title>
        <meta name="description" content={t("terms.meta_description")} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-content" className="flex-1">
          <div className="container-main py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {t("terms.title")}
              </h1>
              <p className="text-muted-foreground mb-8">
                {t("terms.last_updated")}
              </p>

              <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.acceptance_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.acceptance_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.use_license_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("terms.use_license_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("terms.use_license_item1")}</li>
                    <li>{t("terms.use_license_item2")}</li>
                    <li>{t("terms.use_license_item3")}</li>
                    <li>{t("terms.use_license_item4")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.user_conduct_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("terms.user_conduct_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("terms.user_conduct_item1")}</li>
                    <li>{t("terms.user_conduct_item2")}</li>
                    <li>{t("terms.user_conduct_item3")}</li>
                    <li>{t("terms.user_conduct_item4")}</li>
                    <li>{t("terms.user_conduct_item5")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.content_submission_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.content_submission_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.intellectual_property_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.intellectual_property_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.disclaimer_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.disclaimer_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.limitation_liability_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.limitation_liability_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.termination_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.termination_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.changes_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.changes_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("terms.contact_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("terms.contact_content")}
                  </p>
                </section>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsOfUse;
