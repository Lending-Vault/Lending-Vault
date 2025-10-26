import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Blocks,
  Cloud,
  Briefcase,
  Layers,
  BarChart3,
  Rocket,
  Globe,
  Cpu,
} from "lucide-react";

const AboutPartners: React.FC = () => {
  const partners = [
    { name: "Lisk", icon: <Blocks className="w-8 h-8 text-lisk-400" /> },
    { name: "Ethereum", icon: <Cloud className="w-8 h-8 text-lisk-400" /> },
    { name: "Polygon", icon: <Briefcase className="w-8 h-8 text-lisk-400" /> },
    { name: "Base", icon: <Layers className="w-8 h-8 text-lisk-400" /> },
    {
      name: "Arbitrum",
      icon: <BarChart3 className="w-8 h-8 text-lisk-400" />,
    },
    { name: "Startup", icon: <Rocket className="w-8 h-8 text-lisk-400" /> },
    { name: "Ecosystem", icon: <Globe className="w-8 h-8 text-lisk-400" /> },
    { name: "Infrastructure", icon: <Cpu className="w-8 h-8 text-lisk-400" /> },
  ];

  const settings = {
    dots: false,
    infinite: true,
    speed: 5000,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    arrows: false,
    pauseOnHover: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="relative py-24 bg-dark-bg text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="mb-12 text-center flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Partners</h2>
          <p className="text-lg text-dark-textMuted max-w-2xl text-center">
            We collaborate with leading blockchain networks and institutions to
            build a transparent and inclusive DeFi ecosystem.
          </p>
        </div>

        <Slider {...settings}>
          {partners.map((partner, index) => (
            <div key={index} className="px-4">
              <div className="glass-strong flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dark-border hover:border-lisk-500/30 transition-all duration-300 hover:transform hover:scale-[1.03] group h-40">
                <div className="mb-3 w-12 h-12 bg-lisk-500/20 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-r from-lisk-500/40 to-lisk-400/40 transition-all duration-500">
                  {partner.icon}
                </div>
                <h4 className="text-lg font-semibold text-white group-hover:text-lisk-400 transition-colors duration-300">
                  {partner.name}
                </h4>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Subtle gradient overlay edges */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-dark-bg via-dark-bg/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-dark-bg via-dark-bg/20 to-transparent pointer-events-none" />
    </section>
  );
};

export default AboutPartners;
