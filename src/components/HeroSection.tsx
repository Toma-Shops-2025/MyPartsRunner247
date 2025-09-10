import React from 'react';

interface HeroSectionProps {
  onRequestPickup?: () => void;
  onBecomeDriver?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onRequestPickup, onBecomeDriver }) => {
  return (
    <section className="relative bg-gradient-to-br from-teal-50 to-blue-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Anything, Anytime, Anywhere
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The only delivery service that picks up from absolutely anywhere. 
              Forgot something? Need it delivered? We've got you covered 24/7 nationwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <button 
                onClick={onRequestPickup}
                className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
              >
                Request Pickup Now
              </button>
              <button 
                onClick={onBecomeDriver}
                className="border-2 border-teal-500 text-teal-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-teal-50 transition-all"
              >
                Become a Driver
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-teal-600">24/7</div>
                <div className="text-gray-600">Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">50+</div>
                <div className="text-gray-600">States</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-600">∞</div>
                <div className="text-gray-600">Possibilities</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/68c0f01bf7edb10d59672309_1757475042488_67ce2f8f.webp"
              alt="MyPartsRunner Delivery Service"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg">
              <div className="text-sm text-gray-600">Live Orders</div>
              <div className="text-2xl font-bold text-teal-600">1,247</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <svg width="404" height="404" fill="none" viewBox="0 0 404 404">
          <defs>
            <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;