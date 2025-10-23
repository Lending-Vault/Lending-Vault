import React from "react";
import LandingHeader from "../components/Landing/LandingHeader";
import AboutHero from "../components/About/AboutHero";
import AboutStats from "../components/About/AboutStats";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <LandingHeader />
      <AboutHero />
      <AboutStats />
    </div>
  );
};

export default About;
