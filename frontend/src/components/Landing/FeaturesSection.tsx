import React from 'react';
import { Shield, TrendingUp, Zap, Globe, Lock, BarChart3 } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure & Audited',
      description: 'Smart contracts audited by leading security firms with multiple security layers and insurance funds.',
      color: 'from-lisk-400 to-lisk-600'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rates',
      description: 'Algorithmically optimized interest rates that adapt to market conditions for maximum efficiency.',
      color: 'from-success-400 to-success-600'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant deposits and withdrawals with optimized gas fees and seamless user experience.',
      color: 'from-warning-400 to-warning-600'
    },
    {
      icon: Globe,
      title: 'Multi-Chain Support',
      description: 'Operate across multiple blockchain networks with unified liquidity and cross-chain capabilities.',
      color: 'from-lisk-400 to-lisk-600'
    },
    {
      icon: Lock,
      title: 'Non-Custodial',
      description: 'Maintain full control of your assets with our non-custodial, decentralized architecture.',
      color: 'from-success-400 to-success-600'
    },
    {
      icon: BarChart3,
      title: 'Transparent Analytics',
      description: 'Real-time analytics and detailed reporting for informed decision-making and portfolio management.',
      color: 'from-warning-400 to-warning-600'
    }
  ];

  return (
    <section className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-bg"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Why Choose </span>
            <span className="gradient-lisk-strong">LiquidVault</span>
          </h2>
          <p className="text-xl text-dark-textMuted max-w-3xl mx-auto">
            Built with security, efficiency, and user experience in mind. Our platform offers the best-in-class features for decentralized lending with an 8% interest.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-strong p-8 rounded-2xl border border-dark-border hover:border-lisk-500/30 transition-all duration-300 hover:transform hover:scale-[1.02] group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-dark-textMuted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="glass-strong p-8 rounded-2xl border border-lisk-500/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to get started?
            </h3>
            <p className="text-dark-textMuted mb-6 max-w-2xl mx-auto">
              Join thousands of users who are already earning competitive yields and accessing liquidity through our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-lisk-500 to-lisk-600 hover:from-lisk-400 hover:to-lisk-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-lisk-glow">
                Start Lending
              </button>
              <button className="glass-strong border border-dark-border hover:border-lisk-500/30 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;