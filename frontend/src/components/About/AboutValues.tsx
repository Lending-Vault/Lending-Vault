import React from "react";
import { Lock, Gauge, Sparkles, Globe } from "lucide-react";

const AboutValues: React.FC = () => {
  const values = [
    {
      icon: <Lock className="w-6 h-6 text-lisk-400" />,
      title: "Security First",
      desc: "Non-custodial, trustless smart contracts ensure user safety.",
    },
    {
      icon: <Gauge className="w-6 h-6 text-lisk-400" />,
      title: "Predictability",
      desc: "Borrowing costs stay constant — 8% APR fixed rate for all users.",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-lisk-400" />,
      title: "Simplicity",
      desc: "No complex formulas. No hidden variables. Just clear DeFi lending.",
    },
    {
      icon: <Globe className="w-6 h-6 text-lisk-400" />,
      title: "Multi-chain Future",
      desc: "Built for Ethereum, Lisk, and ready for other EVM-compatible chains.",
    },
  ];

  return (
    <section className="relative py-24 bg-[#0E1018] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="text-white">The values that drive </span>
          <span className="gradient-lisk-strong">LiquidVault</span>
        </h2>

        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-16">
          Our core principles ensure that LiquidVault remains transparent,
          community-driven, and built on trustless smart contracts for all
          users.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {values.map((item, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl border border-indigo-500/10 bg-[#1A1C28] hover:border-indigo-400/30 transition-all duration-300 hover:transform hover:scale-[1.02] group"
            >
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-lisk-500/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-lisk-500 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default AboutValues;
