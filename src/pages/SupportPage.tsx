import React from 'react';
import NewHeader from '@/components/NewHeader';
import CustomerSupport from '@/components/CustomerSupport';

const SupportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerSupport />
      </main>
    </div>
  );
};

export default SupportPage;
