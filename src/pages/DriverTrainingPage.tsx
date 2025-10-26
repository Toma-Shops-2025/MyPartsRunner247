import React from 'react';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import DriverTraining from '@/components/DriverTraining';

const DriverTrainingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="flex-grow">
        <DriverTraining />
      </main>
      <Footer />
    </div>
  );
};

export default DriverTrainingPage;