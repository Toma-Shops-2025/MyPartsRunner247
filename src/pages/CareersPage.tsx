import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Users } from 'lucide-react';

const CareersPage: React.FC = () => {
  const jobs = [
    {
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120k - $160k',
      description: 'Build scalable systems for our delivery platform using React, Node.js, and cloud technologies.'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$130k - $170k',
      description: 'Drive product strategy and roadmap for our driver and customer experiences.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Austin, TX',
      type: 'Full-time',
      salary: '$70k - $90k',
      description: 'Ensure our customers and drivers have amazing experiences with our platform.'
    },
    {
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      salary: '$60k - $80k',
      description: 'Develop and execute marketing campaigns to grow our user base and brand awareness.'
    }
  ];

  const benefits = [
    'Competitive salary and equity',
    'Comprehensive health insurance',
    'Unlimited PTO policy',
    'Remote work flexibility',
    'Professional development budget',
    'Free delivery credits',
    'Team retreats and events',
    '401(k) matching'
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Join Our <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">Team</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Help us revolutionize delivery and build the future of logistics. 
            We're looking for passionate people who want to make a real impact.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Work With Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gray-800 border-gray-600">
                <CardContent className="p-6 text-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-300">{benefit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Open Positions</h2>
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <Card key={index} className="hover:shadow-2xl transition-shadow bg-gray-700 border-gray-600">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2 text-white">{job.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {job.department}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.type}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {job.salary}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-800">{job.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{job.description}</p>
                  <Button className="bg-teal-600 hover:bg-teal-700">Apply Now</Button>
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
            Don't See Your Role?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            We're always looking for talented people to join our team. 
            Send us your resume and tell us how you'd like to contribute.
          </p>
          <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
            Send Us Your Resume
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;