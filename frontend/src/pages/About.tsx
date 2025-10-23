import React from "react";
import LandingHeader from "../components/Landing/LandingHeader";
import AboutHero from "../components/About/AboutHero";
import AboutStats from "../components/About/AboutStats";
import AboutValues from "../components/About/AboutValues";
import AboutTeam from "../components/About/AboutTeam";
import AboutPress from "../components/About/AboutPress";
import AboutPartners from "../components/About/AboutPartners";
import FooterSection from "../components/Landing/FooterSection";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <LandingHeader />
      <AboutHero />
      <AboutStats />
      <AboutValues />
      <AboutTeam />
      <AboutPress />
      <AboutPartners />
      <FooterSection />
    </div>
  );
};

export default About;
