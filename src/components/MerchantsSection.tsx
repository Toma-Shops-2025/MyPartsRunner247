import React from 'react';

const MerchantsSection: React.FC = () => {
  const packageImages = [
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471456076_70b3a2e8.webp",
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471458017_1e66fbc9.webp",
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471459740_731d032b.webp",
    "https://d64gsuwffb70l.cloudfront.net/68c0e29a764640203ce73338_1757471461440_84bba105.webp"
  ];

  const features = [
    { icon: "🚀", title: "Instant Delivery", description: "Same-day and on-demand delivery options" },
    { icon: "📊", title: "Analytics Dashboard", description: "Track orders, revenue, and customer satisfaction" },
    { icon: "💳", title: "Easy Billing", description: "Automated invoicing and payment processing" },
    { icon: "🌍", title: "Nationwide Coverage", description: "Serve customers anywhere in the country" }
  ];

  return (
    <section id="merchants" className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            For <span className="text-blue-600">Businesses</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expand your reach with our delivery network. Perfect for businesses that don't offer delivery 
            or need extra help during busy periods.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <div className="grid grid-cols-2 gap-4">
            {packageImages.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image} 
                  alt={`Package ${index + 1}`}
                  className="w-full h-32 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-all"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Deliver More, Worry Less
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Whether you're a restaurant, retail store, or service provider, 
              MyPartsRunner helps you offer delivery without the overhead.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="bg-gradient-to-r from-blue-500 to-teal-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-teal-700 transform hover:scale-105 transition-all shadow-lg">
              Partner with Us
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Partner Businesses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">95%</div>
              <div className="text-gray-600">On-Time Delivery</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.8★</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Expand Your Business?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our merchant network and start offering delivery to your customers today. 
              No setup fees, no long-term contracts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-teal-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-teal-700 transition-all">
                Get Started
              </button>
              <button className="border-2 border-blue-500 text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MerchantsSection;