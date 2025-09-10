import React from 'react';
import { Check, Star } from 'lucide-react';

const PricingSection: React.FC = () => {
  const plans = [
    {
      name: "Personal",
      price: "$4.99",
      period: "per delivery",
      description: "Perfect for individuals and occasional deliveries",
      features: [
        "Same-day delivery",
        "Real-time tracking",
        "Photo confirmation",
        "Basic support",
        "Up to 25 lbs"
      ],
      popular: false,
      color: "from-teal-500 to-blue-600"
    },
    {
      name: "Business",
      price: "$29.99",
      period: "per month",
      description: "Ideal for small businesses with regular delivery needs",
      features: [
        "Unlimited deliveries",
        "Priority matching",
        "Dedicated support",
        "Business dashboard",
        "Up to 50 lbs",
        "Scheduled deliveries",
        "Bulk discounts"
      ],
      popular: true,
      color: "from-blue-500 to-purple-600"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "Tailored solutions for large organizations",
      features: [
        "Custom pricing",
        "API integration",
        "White-label option",
        "24/7 premium support",
        "Unlimited weight",
        "Advanced analytics",
        "Custom workflows"
      ],
      popular: false,
      color: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your delivery needs. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`relative ${plan.popular ? 'scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 ${plan.popular ? 'border-2 border-blue-200' : 'border border-gray-100'}`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mr-3`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-full font-semibold transition-all transform hover:scale-105 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700' 
                    : 'border-2 border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600'
                }`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            All plans include our core features: real-time tracking, secure payments, and 24/7 support
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 30-day money back</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;