import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServicesSection: React.FC = () => {
  const navigate = useNavigate();
  const services = [
    {
      title: "Personal Pickups",
      description: "Forgot your lunch? Left your keys? We'll get it for you.",
      icon: "🏃‍♂️",
      examples: ["Forgotten items", "Lunch delivery", "Key pickup", "Personal errands"]
    },
    {
      title: "Emergency Runs",
      description: "Urgent deliveries when you need something fast.",
      icon: "🚨",
      examples: ["Medical supplies", "Work documents", "Baby formula", "Pet food"]
    },
    {
      title: "Scheduled Delivery",
      description: "Plan ahead with our flexible scheduling system.",
      icon: "📅",
      examples: ["Future pickups", "Recurring orders", "Event supplies", "Gift delivery"]
    },
    {
      title: "CarryOut Orders",
      description: "ANY establishment that ordinarily does not deliver",
      icon: "🛍️",
      examples: ["Tobacco Stores", "Liquor Stores", "Hardware Stores", "Any Store or Shop"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            We Deliver <span className="text-teal-400">Everything</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From forgotten lunch boxes to urgent business documents, 
            MyPartsRunner handles any pickup and delivery request within the law.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-600 hover:border-teal-400 hover:bg-gray-700">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
              <p className="text-gray-300 mb-4">{service.description}</p>
              <ul className="space-y-1">
                {service.examples.map((example, i) => (
                  <li key={i} className="text-sm text-teal-400 flex items-center">
                    <span className="w-1 h-1 bg-teal-400 rounded-full mr-2"></span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => navigate('/services')}
            className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
          >
            Start Your Delivery
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;