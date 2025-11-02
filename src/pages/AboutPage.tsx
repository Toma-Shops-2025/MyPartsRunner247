import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, Award, Heart, ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To make delivery accessible from anywhere, anytime, connecting people with what they need most.'
    },
    {
      icon: Users,
      title: 'Our Team',
      description: 'A diverse group of logistics experts, developers, and customer service professionals.'
    },
    {
      icon: Award,
      title: 'Our Promise',
      description: 'Reliable, fast, and secure delivery services that exceed customer expectations.'
    },
    {
      icon: Heart,
      title: 'Our Values',
      description: 'Integrity, innovation, and putting our customers and drivers first in everything we do.'
    }
  ];

  const stats = [
    { number: '100K+', label: 'Deliveries Completed' },
    { number: '5K+', label: 'Active Drivers' },
    { number: '50+', label: 'States Covered' },
    { number: '24/7', label: 'Availability' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
        <NewHeader />
      
      {/* Hero Section */}
      <section className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              About <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">MyPartsRunner</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Founded on the simple belief that distance shouldn't be a barrier to getting what you need, 
              when you need it. We're revolutionizing delivery by making it truly universal.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Story</h2>
            <div className="text-gray-300 space-y-6">
              <p>
                MyPartsRunner was born from a simple frustration: the inability to get something delivered 
                from anywhere other than traditional retailers. Whether you forgot your laptop at home, 
                needed a specific part from a local shop, or wanted to send something to a friend across town, 
                existing delivery services fell short.
              </p>
              <p>
                In 2023, our founders set out to create the world's first truly universal delivery platform. 
                One that could pick up from absolutely anywhere - your home, a friend's house, a small business, 
                or even a street corner - and deliver it anywhere else.
              </p>
              <p>
                Today, MyPartsRunner operates in over 50 states with thousands of drivers ready to help. 
                We've completed over 100,000 deliveries, from emergency medication runs to forgotten birthday 
                gifts, proving that when it comes to delivery, anywhere really is possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What Drives Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center bg-gray-700 border-gray-600">
                <CardContent className="p-6">
                  <div className="bg-teal-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <value.icon className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-300">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">By the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-teal-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Join the MyPartsRunner Family
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Whether you need something delivered or want to earn money driving, 
            we'd love to have you as part of our community.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/services')}
              className="bg-gradient-to-r from-teal-500 to-blue-600 px-8 py-4 text-lg font-semibold"
            >
              Start Delivering
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;