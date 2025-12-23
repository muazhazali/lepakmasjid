import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const Header = ({ isDark, onToggleTheme }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
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
              Explore
            </Link>
            <Link 
              to="/contribute" 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Contribute
            </Link>
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              About
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button variant="default" className="hidden md:flex">
              Add Mosque
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                Explore Mosques
              </Link>
              <Link 
                to="/contribute" 
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contribute
              </Link>
              <Link 
                to="/about" 
                className="px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="px-4 pt-2">
                <Button variant="default" className="w-full">
                  Add Mosque
                </Button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
