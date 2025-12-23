import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import FeaturedMosques from '@/components/FeaturedMosques';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newValue);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <Helmet>
        <title>lepakmasjid - Find Mosques with Facilities You Need</title>
        <meta 
          name="description" 
          content="Discover mosques in Malaysia with WiFi, working spaces, accessibility features, and more. Community-powered mosque directory for travelers and remote workers." 
        />
        <meta name="keywords" content="mosque, masjid, Malaysia, prayer space, WiFi, working space, accessibility, halal, Muslim" />
        <link rel="canonical" href="https://lepakmasjid.my" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header isDark={isDark} onToggleTheme={toggleTheme} />
        
        <main className="flex-1">
          <HeroSection 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
          />
          <StatsSection />
          <FeaturedMosques />
          <CTASection />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
