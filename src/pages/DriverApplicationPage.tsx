import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DriverRegistration from '@/components/DriverRegistration';

const DriverApplicationPage = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // This will be called when the driver registration is complete
    console.log('Driver registration completed');
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Become a MyPartsRunner Driver
          </h1>
          <p className="text-gray-300">
            Join our team and start earning money delivering auto parts
          </p>
        </div>

        <DriverRegistration onComplete={handleComplete} />
      </div>
    </div>
  );
};

export default DriverApplicationPage;