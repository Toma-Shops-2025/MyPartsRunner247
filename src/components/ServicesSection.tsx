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
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            We Deliver <span className="text-teal-600">Everything</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From forgotten lunch boxes to urgent business documents, 
            MyPartsRunner handles any pickup and delivery request within the law.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-teal-200">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="space-y-1">
                {service.examples.map((example, i) => (
                  <li key={i} className="text-sm text-teal-600 flex items-center">
                    <span className="w-1 h-1 bg-teal-600 rounded-full mr-2"></span>
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