import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, MapPin, Shield } from 'lucide-react';
import RequestPickupModal from '@/components/RequestPickupModal';

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  
  const services = [
    {
      icon: Package,
      title: 'Personal Pickups',
      description: 'Forgot something at home? Need something from a store? We\'ll pick it up and deliver it to you.',
      features: ['Any item, any location', 'Real-time tracking', 'Photo confirmation']
    },
    {
      icon: Clock,
      title: 'Emergency Runs',
      description: 'Urgent delivery needs? We provide priority emergency delivery services.',
      features: ['Priority handling', 'Fastest available driver', 'Real-time updates']
    },
    {
      icon: MapPin,
      title: 'Scheduled Delivery',
      description: 'Plan ahead with scheduled pickups and deliveries at your convenience.',
      features: ['Advance booking', 'Recurring deliveries', 'Flexible timing']
    },
    {
      icon: Shield,
      title: 'Secure Transport',
      description: 'Important documents or valuable items delivered with extra security measures.',
      features: ['ID verification', 'Signature required', 'Insurance coverage']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
        <NewHeader />
      
      {/* Hero Section */}
      <section className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Our <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">Services</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From personal errands to business solutions, MyPartsRunner provides reliable delivery services 
            that adapt to your needs. Available 24/7 nationwide.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-2xl transition-shadow bg-gray-800 border-gray-600">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="bg-teal-100 p-3 rounded-full">
                      <service.icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-300">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join thousands of satisfied customers who trust MyPartsRunner for their delivery needs.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => setIsPickupModalOpen(true)}
              className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Request Pickup Now
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      
      <RequestPickupModal 
        isOpen={isPickupModalOpen} 
        onClose={() => setIsPickupModalOpen(false)} 
      />
    </div>
  );
};

export default ServicesPage;