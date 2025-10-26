import React, { useEffect } from 'react';
import LandingHeader from '../components/Landing/LandingHeader';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import HowItWorksSection from '../components/Landing/HowItWorksSection';
import StatsSection from '../components/Landing/StatsSection';
import AboutStats from '../components/About/AboutStats';
import AboutValues from '../components/About/AboutValues';
import AboutTeam from '../components/About/AboutTeam';
import AboutPress from '../components/About/AboutPress';
// import AboutPartners from '../components/About/AboutPartners';
import FooterSection from '../components/Landing/FooterSection';

const Landing: React.FC = () => {
  useEffect(() => {
    // Smooth scroll behavior for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const href = target.getAttribute('href');
      
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <LandingHeader />
      
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <div id="stats">
          <StatsSection />
        </div>
        <div id="about-stats">
          <AboutStats />
        </div>
        <div id="about-values">
          <AboutValues />
        </div>
        <div id="about-team">
          <AboutTeam />
        </div>
        <div id="about-press">
          <AboutPress />
        </div>
        {/* <div id="about-partners">
          <AboutPartners />
        </div> */}
      </main>
      
      <FooterSection />
    </div>
  );
};

export default Landing;
