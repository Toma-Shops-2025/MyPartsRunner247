import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Headphones, Zap, Camera, Calendar, Clock, Users, Star } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const navigate = useNavigate();
  const features = [
    {
      title: "Real-Time Tracking",
      description: "Follow your delivery with live GPS tracking powered by Mapbox",
      icon: MapPin,
      color: "from-teal-500 to-blue-600"
    },
    {
      title: "Instant Payments",
      description: "Secure payments with Stripe, automatic driver payouts",
      icon: CreditCard,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock customer service and driver assistance",
      icon: Headphones,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Smart Matching",
      description: "AI-powered driver matching for fastest delivery times",
      icon: Zap,
      color: "from-green-500 to-teal-600"
    },
    {
      title: "Photo Confirmation",
      description: "Visual proof of pickup and delivery for peace of mind",
      icon: Camera,
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Flexible Scheduling",
      description: "Schedule deliveries for now or later, your choice",
      icon: Calendar,
      color: "from-indigo-500 to-blue-600"
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose <span className="text-teal-400">MyPartsRunner</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We've built the most advanced delivery platform with features 
            that make getting your items simple, fast, and reliable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-600 hover:border-teal-400 group-hover:scale-105">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
              
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-8 lg:p-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              The Future of Delivery is Here
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join the revolution in on-demand delivery. With cutting-edge technology 
              and a nationwide network, we're changing how America gets things delivered.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-600 p-6 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-teal-400 mb-2">99.9%</div>
                <div className="text-gray-300">Uptime</div>
              </div>
              <div className="bg-gray-600 p-6 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-blue-400 mb-2">&lt;30min</div>
                <div className="text-gray-300">Avg Response</div>
              </div>
              <div className="bg-gray-600 p-6 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-teal-400 mb-2">4.9★</div>
                <div className="text-gray-300">User Rating</div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/services')}
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
            >
              Experience the Difference
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;