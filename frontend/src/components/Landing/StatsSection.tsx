import React from 'react';

const StatsSection: React.FC = () => {

  return (
    <section className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-lisk-900/10 to-transparent"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
      
        {/* Stats Grid */}
     

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="glass-strong p-8 rounded-2xl border border-lisk-500/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Join Our Growing Community
            </h3>
            <p className="text-dark-textMuted mb-6 max-w-2xl mx-auto">
              Be part of the decentralized finance revolution. Start earning competitive yields or access liquidity today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-lisk-500 to-lisk-600 hover:from-lisk-400 hover:to-lisk-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-lisk-glow">
                Get Started Now
              </button>
              <button className="glass-strong border border-dark-border hover:border-lisk-500/30 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;