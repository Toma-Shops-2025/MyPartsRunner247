import React from 'react';

const PromotionalVideo: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Discover MyPartsRunner: Your Ultimate Delivery Solution
        </h2>
        
        {/* YouTube Video Embed */}
        <div className="mb-6">
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/i3E84GErrN4"
              title="MyPartsRunner Promotional Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
        
        {/* Service highlights */}
        <div className="bg-gradient-to-br from-teal-600 to-blue-700 rounded-lg p-6 text-center">
          <div className="text-white">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-4">Your Ultimate Delivery Solution</h3>
            <p className="text-base mb-4">
              Anything, anytime, anywhere - delivered with care.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl mb-1">📦</div>
                <div className="font-semibold">Any Item</div>
                <div className="text-white/80 text-xs">From groceries to documents</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl mb-1">⏰</div>
                <div className="font-semibold">24/7 Service</div>
                <div className="text-white/80 text-xs">Available around the clock</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-xl mb-1">📍</div>
                <div className="font-semibold">Anywhere</div>
                <div className="text-white/80 text-xs">Local and long-distance</div>
              </div>
            </div>
            
            {/* Call to action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.href = '/services'}
                className="bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
              >
                Start Your Delivery
              </button>
              <button 
                onClick={() => window.location.href = '/driver-application'}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors text-sm"
              >
                Become a Driver
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 text-center mt-4 text-sm">
          Watch the video above to learn more about MyPartsRunner's delivery services
        </p>
      </div>
    </div>
  );
};

export default PromotionalVideo;
