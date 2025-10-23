import React from "react";
import { DollarSign, Award, Users } from "lucide-react";

const AboutStats: React.FC = () => {
  const stats = [
    {
      icon: <DollarSign className="w-6 h-6 text-lisk-400" />,
      title: "Over $1M in assets locked",
      desc: "Demonstrating user trust in decentralized liquidity solutions.",
    },
    {
      icon: <Award className="w-6 h-6 text-lisk-400" />,
      title: "8% fixed borrowing rate",
      desc: "Predictable, transparent costs for all borrowers.",
    },
    {
      icon: <Users className="w-6 h-6 text-lisk-400" />,
      title: "Over 1,000 testnet users",
      desc: "Growing DeFi adoption with simple, secure user flows.",
    },
  ];

  return (
    <section className="relative py-24 bg-dark-bg text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Take a look at the amazing results we had achieved
        </h2>
        <p className="text-xl text-dark-textMuted max-w-3xl mx-auto mb-16">
          Our mission to democratize investment has helped thousands of users
          access decentralized finance with transparency, scalability, and
          trust.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stats.map((item, i) => (
            <div
              key={i}
              className="glass-strong p-8 rounded-2xl border border-dark-border hover:border-lisk-500/30 transition-all duration-300 hover:transform hover:scale-[1.02] group"
            >
              <div className="w-12 h-12 bg-lisk-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-dark-textMuted text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutStats;
