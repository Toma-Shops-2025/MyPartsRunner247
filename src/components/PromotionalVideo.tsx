import React from 'react';

const PromotionalVideo: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Discover MyPartsRunner: Your Ultimate Delivery Solution
        </h2>
        
        {/* Beautiful promotional content instead of problematic video */}
        <div className="bg-gradient-to-br from-teal-600 to-blue-700 rounded-lg p-8 text-center">
          <div className="text-white">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-4">Welcome to MyPartsRunner!</h3>
            <p className="text-lg mb-6">
              Your ultimate delivery solution for anything, anytime, anywhere.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl mb-2">📦</div>
                <div className="font-semibold">Any Item</div>
                <div className="text-white/80">From groceries to documents</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-semibold">24/7 Service</div>
                <div className="text-white/80">Available around the clock</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl mb-2">📍</div>
                <div className="font-semibold">Anywhere</div>
                <div className="text-white/80">Local and long-distance</div>
              </div>
            </div>
            
            {/* Call to action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/services'}
                className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Your Delivery
              </button>
              <button 
                onClick={() => window.location.href = '/driver-application'}
                className="bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
              >
                Become a Driver
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 text-center mt-4">
          Learn more about MyPartsRunner's delivery services above
        </p>
      </div>
    </div>
  );
};

export default PromotionalVideo;
