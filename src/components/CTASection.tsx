import React from 'react';
import { ArrowRight, Smartphone, Truck } from 'lucide-react';

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-teal-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join the MyPartsRunner community today. Whether you need something delivered or want to earn money driving, we've got you covered.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-teal-100">
            <div className="flex items-center mb-6">
              <div className="bg-teal-100 p-3 rounded-full mr-4">
                <Smartphone className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">For Customers</h3>
                <p className="text-gray-600">Need something delivered?</p>
              </div>
            </div>
            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-center">
                <ArrowRight className="w-5 h-5 text-teal-500 mr-3" />
                Request pickup from anywhere
              </li>
              <li className="flex items-center">
                <ArrowRight className="w-5 h-5 text-teal-500 mr-3" />
                Real-time tracking
              </li>
              <li className="flex items-center">
                <ArrowRight className="w-5 h-5 text-teal-500 mr-3" />
                24/7 availability
              </li>
            </ul>
            <button className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 rounded-full font-semibold hover:from-teal-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg">
              Request Pickup Now
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">For Drivers</h3>
                <p className="text-gray-600">Want to earn money?</p>
              </div>
            </div>
            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-center">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                Flexible schedule
              </li>
              <li className="flex items-center">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                Competitive pay
              </li>
              <li className="flex items-center">
                <ArrowRight className="w-5 h-5 text-blue-500 mr-3" />
                Weekly payouts
              </li>
            </ul>
            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
              Become a Driver
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;