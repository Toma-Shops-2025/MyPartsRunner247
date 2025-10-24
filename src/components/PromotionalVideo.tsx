import React from 'react';

const PromotionalVideo: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Discover MyPartsRunner: Your Ultimate Delivery Solution
        </h2>
        <div 
          className="relative overflow-hidden rounded-lg bg-gray-700"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe 
            src="https://share.synthesia.io/embeds/videos/af3acad2-1420-42f3-a8fa-8931644ae681" 
            loading="lazy" 
            title="Synthesia video player - Discover MyPartsRunner: Your Ultimate Delivery Solution" 
            allowFullScreen 
            allow="encrypted-media; fullscreen; microphone; autoplay;" 
            frameBorder="0"
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
          {/* Fallback content if video fails to load */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">Loading promotional video...</p>
            </div>
          </div>
        </div>
        <p className="text-gray-300 text-center mt-4">
          Watch our introduction video to learn more about MyPartsRunner's delivery services
        </p>
      </div>
    </div>
  );
};

export default PromotionalVideo;
