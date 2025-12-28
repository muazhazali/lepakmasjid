import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { useTranslation } from "@/hooks/use-translation";

const ContentPolicy = () => {
  const { t } = useTranslation();

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>{t("content_policy.title")} - lepakmasjid</title>
        <meta
          name="description"
          content={t("content_policy.meta_description")}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-content" className="flex-1">
          <div className="container-main py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {t("content_policy.title")}
              </h1>
              <p className="text-muted-foreground mb-8">
                {t("content_policy.last_updated")}
              </p>

              <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.introduction_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("content_policy.introduction_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.acceptable_content_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("content_policy.acceptable_content_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("content_policy.acceptable_content_item1")}</li>
                    <li>{t("content_policy.acceptable_content_item2")}</li>
                    <li>{t("content_policy.acceptable_content_item3")}</li>
                    <li>{t("content_policy.acceptable_content_item4")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.prohibited_content_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("content_policy.prohibited_content_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("content_policy.prohibited_content_item1")}</li>
                    <li>{t("content_policy.prohibited_content_item2")}</li>
                    <li>{t("content_policy.prohibited_content_item3")}</li>
                    <li>{t("content_policy.prohibited_content_item4")}</li>
                    <li>{t("content_policy.prohibited_content_item5")}</li>
                    <li>{t("content_policy.prohibited_content_item6")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.accuracy_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("content_policy.accuracy_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.moderation_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("content_policy.moderation_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.reporting_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("content_policy.reporting_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.consequences_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("content_policy.consequences_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("content_policy.consequences_item1")}</li>
                    <li>{t("content_policy.consequences_item2")}</li>
                    <li>{t("content_policy.consequences_item3")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.changes_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("content_policy.changes_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("content_policy.contact_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("content_policy.contact_content")}
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

export default ContentPolicy;
