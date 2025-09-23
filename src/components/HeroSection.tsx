import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onRequestPickup?: () => void;
  onBecomeDriver?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onRequestPickup, onBecomeDriver }) => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Delivery Car Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/delivery-car-background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                Anything, Anytime, Anywhere
              </span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
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
                className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Become a Driver
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-teal-300">24/7</div>
                <div className="text-gray-200">Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-300">50+</div>
                <div className="text-gray-200">States</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-300">∞</div>
                <div className="text-gray-200">Possibilities</div>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Live Orders Card */}
            <div className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
              <div className="text-sm text-gray-600">Live Orders</div>
              <div className="text-2xl font-bold text-teal-600">1,247</div>
            </div>
            
            {/* Additional visual elements */}
            <div className="relative w-full h-96 rounded-2xl shadow-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-3xl font-bold mb-2">MyPartsRunner</h3>
                  <p className="text-lg opacity-90">Delivery Service</p>
                </div>
              </div>
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