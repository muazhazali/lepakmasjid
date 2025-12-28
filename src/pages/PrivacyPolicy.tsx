import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { useTranslation } from "@/hooks/use-translation";

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>{t("privacy.title")} - lepakmasjid</title>
        <meta name="description" content={t("privacy.meta_description")} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-content" className="flex-1">
          <div className="container-main py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {t("privacy.title")}
              </h1>
              <p className="text-muted-foreground mb-8">
                {t("privacy.last_updated")}
              </p>

              <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.introduction_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.introduction_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.data_collection_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("privacy.data_collection_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("privacy.data_collection_item1")}</li>
                    <li>{t("privacy.data_collection_item2")}</li>
                    <li>{t("privacy.data_collection_item3")}</li>
                    <li>{t("privacy.data_collection_item4")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.data_use_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.data_use_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.data_sharing_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.data_sharing_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.data_security_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.data_security_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.user_rights_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t("privacy.user_rights_content")}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>{t("privacy.user_rights_item1")}</li>
                    <li>{t("privacy.user_rights_item2")}</li>
                    <li>{t("privacy.user_rights_item3")}</li>
                    <li>{t("privacy.user_rights_item4")}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.cookies_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.cookies_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.changes_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.changes_content")}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">
                    {t("privacy.contact_title")}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("privacy.contact_content")}
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

export default PrivacyPolicy;
