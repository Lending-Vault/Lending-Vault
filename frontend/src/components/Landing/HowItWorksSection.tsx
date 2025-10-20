import React from 'react';
import { Wallet, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import Button from '../UI/Button';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: Wallet,
      title: 'Connect Wallet',
      description: 'Connect your crypto wallet to get started. We support multiple wallet providers including MetaMask, WalletConnect, and more.',
      color: 'from-lisk-400 to-lisk-600'
    },
    {
      icon: TrendingUp,
      title: 'Deposit or Borrow',
      description: 'Deposit your assets to earn competitive yields, or borrow against your collateral with favorable interest rates.',
      color: 'from-success-400 to-success-600'
    },
    {
      icon: Shield,
      title: 'Manage Positions',
      description: 'Monitor your positions, adjust collateral, and optimize your strategy with our intuitive dashboard and analytics tools.',
      color: 'from-warning-400 to-warning-600'
    }
  ];

  return (
    <section className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg to-lisk-900/10"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">How It </span>
            <span className="gradient-lisk-strong">Works</span>
          </h2>
          <p className="text-xl text-dark-textMuted max-w-3xl mx-auto">
            Get started with Lending Vault in just a few simple steps. Our streamlined process makes decentralized lending accessible to everyone.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-lisk-500 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                {index + 1}
              </div>
              
              {/* Step Card */}
              <div className="glass-strong p-8 rounded-2xl border border-dark-border hover:border-lisk-500/30 transition-all duration-300 h-full">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-dark-textMuted leading-relaxed mb-6">{step.description}</p>
                
                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                    <ArrowRight className="w-8 h-8 text-lisk-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - For Lenders */}
          <div className="glass-strong p-8 rounded-2xl border border-lisk-500/20">
            <h3 className="text-2xl font-bold text-white mb-6">
              For <span className="gradient-lisk-strong">Lenders</span>
            </h3>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-lisk-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Earn competitive yields on your idle assets</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-lisk-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Flexible deposit and withdrawal options</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-lisk-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Compound interest to maximize returns</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-lisk-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Diversify across multiple assets</span>
              </li>
            </ul>
            <Button variant="secondary" className="w-full">
              Start Earning Yield
            </Button>
          </div>

          {/* Right Column - For Borrowers */}
          <div className="glass-strong p-8 rounded-2xl border border-success-500/20">
            <h3 className="text-2xl font-bold text-white mb-6">
              For <span className="text-transparent bg-clip-text bg-gradient-to-r from-success-400 to-success-600">Borrowers</span>
            </h3>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Access liquidity without selling your assets</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Competitive interest rates with flexible terms</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">No credit checks or lengthy approval processes</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-dark-textMuted">Maintain exposure to your collateral assets</span>
              </li>
            </ul>
            <Button variant="secondary" className="w-full">
              Start Borrowing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;