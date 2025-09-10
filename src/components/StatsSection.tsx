import React from 'react';
import { Package, Clock, MapPin, Users } from 'lucide-react';

const stats = [
  {
    icon: Package,
    value: "500K+",
    label: "Deliveries Completed",
    description: "Successfully delivered packages nationwide"
  },
  {
    icon: Clock,
    value: "15 min",
    label: "Average Response Time",
    description: "Quick driver assignment and pickup"
  },
  {
    icon: MapPin,
    value: "50+",
    label: "States Covered",
    description: "Nationwide coverage for all your needs"
  },
  {
    icon: Users,
    value: "10K+",
    label: "Active Drivers",
    description: "Professional drivers ready to help"
  }
];

const StatsSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-teal-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Trusted by Thousands Nationwide
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Our numbers speak for themselves - we're the fastest-growing delivery service in America
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-xl font-semibold mb-2">{stat.label}</div>
              <p className="text-white/80">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;