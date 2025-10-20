import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Zap } from 'lucide-react';
import Button from '../UI/Button';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-bg to-lisk-900/20"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-lisk-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-lisk-600/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-lisk-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 mt-32">
            <span className="text-white">Liquid</span>
            <span className="gradient-lisk-strong"> Vault</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-dark-textMuted mb-12 max-w-3xl mx-auto leading-relaxed">
            A decentralized lending platform where you can borrow and lend assets across different blockchain networks with competitive rates and enhanced security.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/dashboard">
              <Button size="lg" className="group">
                Launch App
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="">
             <Button variant="secondary" size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
            </Link>
            <Button variant="secondary" size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass-strong p-6 rounded-2xl border border-lisk-500/20">
              <div className="w-12 h-12 bg-lisk-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-lisk-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Audited</h3>
              <p className="text-dark-textMuted text-sm">Smart contracts audited by leading security firms for maximum protection</p>
            </div>
            
            <div className="glass-strong p-6 rounded-2xl border border-lisk-500/20">
              <div className="w-12 h-12 bg-lisk-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-lisk-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Competitive Rates</h3>
              <p className="text-dark-textMuted text-sm">Optimized interest rates for both borrowers and lenders</p>
            </div>
            
            <div className="glass-strong p-6 rounded-2xl border border-lisk-500/20">
              <div className="w-12 h-12 bg-lisk-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-lisk-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Chain</h3>
              <p className="text-dark-textMuted text-sm">Seamless lending across multiple blockchain networks</p>
            </div>
          </div>
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

export default HeroSection;