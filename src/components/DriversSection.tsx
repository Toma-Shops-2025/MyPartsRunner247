import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DriversSectionProps {
  onBecomeDriver?: () => void;
}

const DriversSection: React.FC<DriversSectionProps> = ({ onBecomeDriver }) => {
  const navigate = useNavigate();

  const benefits = [
    { icon: "💰", title: "Earn More", description: "Competitive rates with instant payouts via Stripe" },
    { icon: "⏰", title: "Flexible Hours", description: "Work when you want, 24/7 availability" },
    { icon: "📱", title: "Easy App", description: "Simple driver dashboard with Google Maps navigation" },
    { icon: "🚗", title: "Use Your Vehicle", description: "Car, bike, motorcycle - all welcome" }
  ];

  return (
    <section id="drivers" className="py-20 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Drive with <span className="text-teal-400">MyPartsRunner</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join our nationwide network of drivers and start earning today. 
            With instant payouts and flexible scheduling, driving has never been better.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center p-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-600 hover:border-teal-400">
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-300 text-sm">{benefit.description}</p>
            </div>
          ))}
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