import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import Button from "../UI/Button";

const AboutHero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-bg to-lisk-900/20"></div>

      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-lisk-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
        <div
          className="absolute top-40 right-10 w-96 h-96 bg-lisk-600/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/2 w-80 h-80 bg-lisk-400/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto mt-32">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">We're on a mission to </span>
            <span className="gradient-lisk-strong">simplify DeFi lending</span>
            <span className="text-white"> for all crypto holders.</span>
          </h1>

          <p className="text-xl md:text-2xl text-dark-textMuted mb-12 max-w-3xl mx-auto leading-relaxed">
            LiquidVault lets you borrow stablecoins against your crypto without
            selling your assets — unlocking liquidity while keeping your upside
            potential.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/careers">
              <Button size="lg" className="group">
                Join Our Team
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about#learn-more">
              <Button variant="secondary" size="lg">
                <Users className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </Link>
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

export default AboutHero;
