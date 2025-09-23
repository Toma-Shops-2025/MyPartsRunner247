import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Small Business Owner",
    image: "https://d64gsuwffb70l.cloudfront.net/68c0f01bf7edb10d59672309_1757475059261_a399835e.webp",
    content: "MyPartsRunner saved my business when I needed urgent parts delivered. Their drivers are professional and reliable.",
    rating: 5
  },
  {
    name: "Mike Chen",
    role: "Restaurant Manager",
    image: "https://d64gsuwffb70l.cloudfront.net/68c0f01bf7edb10d59672309_1757475061057_4ce591c0.webp",
    content: "24/7 availability is a game-changer. We can get ingredients delivered even during late hours.",
    rating: 5
  },
  {
    name: "Lisa Rodriguez",
    role: "Event Coordinator",
    image: "https://d64gsuwffb70l.cloudfront.net/68c0f01bf7edb10d59672309_1757475062827_041bb1d4.webp",
    content: "From forgotten decorations to last-minute supplies, they've never let me down. Absolutely fantastic service!",
    rating: 5
  },
  {
    name: "David Park",
    role: "Freelance Photographer",
    image: "https://d64gsuwffb70l.cloudfront.net/68c0f01bf7edb10d59672309_1757475064558_e82f8f40.webp",
    content: "Quick equipment pickups and deliveries. The real-time tracking gives me peace of mind.",
    rating: 5
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of satisfied customers who trust MyPartsRunner for their delivery needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-600">
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-300">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <p className="text-gray-300 italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;