import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedMosques from "@/components/FeaturedMosques";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { useTranslation } from "@/hooks/use-translation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setOAuthError } = useAuthStore();

  // Check for OAuth error in URL params
  const oauthError = searchParams.get("error");
  const oauthMessage = searchParams.get("message");

  useEffect(() => {
    if (oauthError === "oauth_failed" && oauthMessage) {
      // Set error in auth store to display in auth dialog
      setOAuthError(decodeURIComponent(oauthMessage));
      // Clear URL params
      setSearchParams({});
    }
  }, [oauthError, oauthMessage, setSearchParams, setOAuthError]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/explore");
    }
  };

  return (
    <>
      <SkipLink />
      <Helmet>
        <title>{t("meta.home_title")}</title>
        <meta name="description" content={t("meta.home_description")} />
        <meta
          name="keywords"
          content="mosque, masjid, Malaysia, prayer space, WiFi, working space, accessibility, halal, Muslim"
        />
        <link rel="canonical" href="https://lepakmasjid.my" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main id="main-content" className="flex-1">
          {/* OAuth Error Banner - Accessible and persistent */}
          {oauthError === "oauth_failed" && oauthMessage && (
            <div className="container mx-auto px-4 pt-4">
              <Alert
                variant="destructive"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="relative"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <AlertTitle>Sign in failed</AlertTitle>
                    <AlertDescription>
                      {decodeURIComponent(oauthMessage)}
                    </AlertDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => {
                      setSearchParams({});
                    }}
                    aria-label="Dismiss error message"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          <HeroSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
          />
          <FeaturedMosques />
          <CTASection />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
