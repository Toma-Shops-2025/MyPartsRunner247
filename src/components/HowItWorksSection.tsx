import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface HowItWorksSectionProps {
  onRequestPickup?: () => void;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onRequestPickup }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const steps = [
    {
      step: "1",
      title: "Request Pickup",
      description: "Tell us what you need picked up and where from. Add photos and special instructions.",
      icon: "📱"
    },
    {
      step: "2", 
      title: "Get Matched",
      description: "Our system finds the nearest available driver and provides real-time pricing.",
      icon: "🤝"
    },
    {
      step: "3",
      title: "Track Live",
      description: "Follow your driver's progress with live GPS tracking and ETA updates.",
      icon: "📍"
    },
    {
      step: "4",
      title: "Delivered",
      description: "Receive your items with photo confirmation and rate your experience.",
      icon: "✅"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            How It <span className="text-blue-400">Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Getting your items delivered is simple and fast. 
            Our streamlined process gets you connected with drivers in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className="bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-teal-400 hover:bg-gray-600">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-gray-700 p-8 rounded-2xl shadow-lg inline-block">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to get started?</h3>
            <p className="text-gray-300 mb-6">Join thousands of satisfied customers nationwide.</p>
            <button 
              onClick={onRequestPickup || (() => navigate('/services'))}
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
            >
              Request Your First Pickup
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;