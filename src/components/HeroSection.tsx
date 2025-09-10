import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onRequestPickup?: () => void;
  onBecomeDriver?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onRequestPickup, onBecomeDriver }) => {
  const navigate = useNavigate();
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
                onClick={onRequestPickup || (() => {})}
                className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
              >
                Request Pickup Now
              </button>
              <button 
                onClick={() => navigate('/driver-application')}
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
            {/* Main Hero Image - Driver with packages */}
            <div className="relative w-full h-96 rounded-2xl shadow-2xl overflow-hidden">
              <img 
                src="/Screenshot_20250605-093441_Chrome.png"
                alt="MyPartsRunner Delivery Driver with packages"
                className="w-full h-full object-cover"
              />
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-900/60 to-blue-900/40"></div>
              
              {/* Brand Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-3xl font-bold mb-2">MyPartsRunner</h3>
                  <p className="text-lg opacity-90">Delivery Service</p>
                </div>
              </div>
            </div>
            
            {/* Secondary Image - Driver in vehicle */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-xl shadow-lg overflow-hidden border-4 border-white">
              <img 
                src="/Screenshot_20250605-093407_Chrome.png"
                alt="MyPartsRunner Driver in vehicle"
                className="w-full h-full object-cover"
              />
            </div>
            
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