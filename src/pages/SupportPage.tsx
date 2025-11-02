import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import CustomerSupport from '@/components/CustomerSupport';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <CustomerSupport />
      </main>
    </div>
  );
};

export default SupportPage;
