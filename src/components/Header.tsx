import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Moon,
  Sun,
  MapPin,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { LanguageToggle } from "./LanguageToggle";
import { FontSizeToggle } from "./FontSizeToggle";
import { AuthDialog } from "./Auth/AuthDialog";
import { useTranslation } from "@/hooks/use-translation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore();
  const { theme, setTheme, isDark } = useThemeStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleToggleTheme = () => {
    // Toggle directly between light and dark, ignoring system preference
    if (isDark) {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container-main">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft group-hover:shadow-glow transition-shadow duration-300">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                lepak<span className="text-primary">masjid</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/explore"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {t("nav.explore")}
              </Link>
              <Link
                to="/submit"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {t("nav.contribute")}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {t("nav.admin")}
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <FontSizeToggle />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleTheme}
                aria-label={
                  isDark ? t("common.switch_light") : t("common.switch_dark")
                }
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("common.user_menu")}
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name || user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/submit")}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t("nav.add_mosque")}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        {t("nav.admin")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("auth.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="default"
                  className="hidden md:flex"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  {t("auth.login")}
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={t("common.toggle_menu")}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border/50 animate-fade-in">
              <div className="flex flex-col gap-2">
                <Link
                  to="/explore"
                  className="px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.explore")}
                </Link>
                <Link
                  to="/submit"
                  className="px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t("nav.contribute")}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("nav.admin")}
                  </Link>
                )}
                {!isAuthenticated && (
                  <div className="px-4 pt-2">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setAuthDialogOpen(true);
                      }}
                    >
                      {t("auth.login")}
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Header;
