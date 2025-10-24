import React, { useState, useEffect } from 'react';

const PromotionalVideo: React.FC = () => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Set a timeout to show fallback if video doesn't load
    const timer = setTimeout(() => {
      if (!videoLoaded) {
        setShowFallback(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [videoLoaded]);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setShowFallback(false);
  };

  const handleVideoError = () => {
    setShowFallback(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Discover MyPartsRunner: Your Ultimate Delivery Solution
        </h2>
        
        {!showFallback ? (
          <div 
            className="relative overflow-hidden rounded-lg bg-gray-700"
            style={{ paddingTop: '56.25%' }}
          >
            <iframe 
              src="https://share.synthesia.io/embeds/videos/af3acad2-1420-42f3-a8fa-8931644ae681" 
              loading="eager" 
              title="Synthesia video player - Discover MyPartsRunner: Your Ultimate Delivery Solution" 
              allowFullScreen 
              allow="encrypted-media; fullscreen; microphone; autoplay; clipboard-write;" 
              frameBorder="0"
              onLoad={handleVideoLoad}
              onError={handleVideoError}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                border: 'none',
                padding: 0,
                margin: 0,
                overflow: 'hidden'
              }}
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-teal-600 to-blue-700 rounded-lg p-8 text-center">
            <div className="text-white">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-4">Welcome to MyPartsRunner!</h3>
              <p className="text-lg mb-6">
                Your ultimate delivery solution for anything, anytime, anywhere.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
            </div>
          </div>
        )}
        
        <p className="text-gray-300 text-center mt-4">
          {showFallback 
            ? "Learn more about MyPartsRunner's delivery services above"
            : "Watch our introduction video to learn more about MyPartsRunner's delivery services"
          }
        </p>
      </div>
    </div>
  );
};

export default PromotionalVideo;
