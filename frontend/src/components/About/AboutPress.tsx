import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const AboutPress: React.FC = () => {
  const pressItems = [
    {
      title: "Crypto Insider",
      quote: "“LiquidVault introduces predictability to DeFi borrowing.”",
    },
    {
      title: "DeFi Weekly",
      quote: "“A fresh, user-first approach to multi-chain DeFi.”",
    },
    {
      title: "Web3 Times",
      quote: "“Borrow stablecoins without losing your crypto exposure.”",
    },
    {
      title: "Blockchain Digest",
      quote:
        "“LiquidVault redefines decentralized finance with simplicity and transparency.”",
    },
    {
      title: "Fintech Journal",
      quote: "“A breakthrough in fixed-rate lending for DeFi enthusiasts.”",
    },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <section className="relative py-24 bg-dark-bg text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">In the News</h2>
        <p className="text-xl text-dark-textMuted max-w-3xl mx-auto mb-16">
          LiquidVault is being recognized for redefining decentralized lending
          through simplicity, transparency, and accessibility.
        </p>

        <Slider {...settings}>
          {pressItems.map((item, i) => (
            <div key={i} className="px-4">
              <div className="glass-strong min-h-[220px] flex flex-col justify-center p-10 rounded-2xl border border-dark-border hover:border-lisk-500/30 transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer">
                <h4 className="text-2xl font-semibold text-white mb-4">
                  {item.title}
                </h4>
                <p className="text-dark-textMuted text-lg leading-relaxed">
                  {item.quote}
                </p>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Custom slick dots styling */}
      <style>{`
        .slick-dots {
          bottom: -40px;
        }
        .slick-dots li button:before {
          color: white !important;
          opacity: 0.5 !important;
          font-size: 10px;
        }
        .slick-dots li.slick-active button:before {
          color: white !important;
          opacity: 1 !important;
        }
        .slick-dots li button:hover:before {
          opacity: 0.8 !important;
        }
      `}</style>
    </section>
  );
};

export default AboutPress;
