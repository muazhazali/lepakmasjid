import { Link } from "react-router-dom";
import { Github, Mail } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container-main py-12 lg:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/lepak-masjid-logo.png" 
                alt="Lepak Masjid Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="font-display text-xl font-bold text-foreground">
                lepak<span className="text-primary">masjid</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/muazhazali/lepakmasjid"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@lepakmasjid.app"
                className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t("footer.quick_links")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/explore"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.explore_mosques")}
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.add_mosque")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.about_us")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t("footer.resources")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.api_docs")}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/muazhazali/lepakmasjid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.github_repo")}
                </a>
              </li>
              <li>
                <a
                  href="https://umami.muaz.app/share/vH9QwmwSuIv2mDiu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.web_analytics")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.privacy_policy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.terms_of_use")}
                </Link>
              </li>
              <li>
                <Link
                  to="/content-policy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.content_policy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Cool Projects */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t("footer.cool_projects")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://sedekah.je/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  sedekah.je
                </a>
              </li>
              <li>
                <a
                  href="https://www.getdoa.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  getdoa.com
                </a>
              </li>
              <li>
                <a
                  href="https://waktusolat.app/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  waktusolat.app
                </a>
              </li>
              <li>
                <a
                  href="https://pasarmalam.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  pasarmalam.app
                </a>
              </li>
              <li>
                <a
                  href="https://kalori-api.my/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  kalori-api.my
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LepakMasjid. {t("footer.copyright")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("footer.made_with")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
