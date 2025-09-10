import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DriversSectionProps {
  onBecomeDriver?: () => void;
}

const DriversSection: React.FC<DriversSectionProps> = ({ onBecomeDriver }) => {
  const navigate = useNavigate();
  const driverImages = [
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471447192_9e91b7b0.webp",
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471448911_23ea40bf.webp",
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471450654_1649fe2a.webp",
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471452370_50149e67.webp"
  ];

  const benefits = [
    { icon: "💰", title: "Earn More", description: "Competitive rates with instant payouts via Stripe" },
    { icon: "⏰", title: "Flexible Hours", description: "Work when you want, 24/7 availability" },
    { icon: "📱", title: "Easy App", description: "Simple driver dashboard with Mapbox navigation" },
    { icon: "🚗", title: "Use Your Vehicle", description: "Car, bike, motorcycle - all welcome" }
  ];

  return (
    <section id="drivers" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Drive with <span className="text-teal-600">MyPartsRunner</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join our nationwide network of drivers and start earning today. 
              With instant payouts and flexible scheduling, driving has never been better.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="text-2xl">{benefit.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => navigate('/driver-application')}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
              >
                Apply to Drive
              </button>
              <div className="text-sm text-gray-500">
                Background check required. Must be 18+ with valid license.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {driverImages.map((image, index) => (
              <div key={index} className="relative">
                <img 
                  src={image} 
                  alt={`Driver ${index + 1}`}
                  className="w-full h-48 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                  ⭐ 4.9
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Start Earning Today</h3>
          <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
            Join thousands of drivers already earning with MyPartsRunner. 
            Quick onboarding, instant payments, and the freedom to work on your schedule.
          </p>
          <button 
            onClick={() => navigate('/driver-application')}
            className="bg-white text-teal-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-teal-50 transform hover:scale-105 transition-all shadow-lg mb-6"
          >
            Start Earning Today
          </button>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className="font-bold text-xl">$25+</div>
              <div className="text-sm text-teal-100">Per Hour Average</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className="font-bold text-xl">24/7</div>
              <div className="text-sm text-teal-100">Earning Potential</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className="font-bold text-xl">Instant</div>
              <div className="text-sm text-teal-100">Stripe Payouts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DriversSection;