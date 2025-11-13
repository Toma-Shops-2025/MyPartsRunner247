import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';
import { Search, HelpCircle, Users, Truck, CreditCard } from 'lucide-react';

const FAQPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'general', name: 'General', icon: HelpCircle },
    { id: 'drivers', name: 'For Drivers', icon: Truck },
    { id: 'customers', name: 'For Customers', icon: Users },
    { id: 'billing', name: 'Billing & Payments', icon: CreditCard }
  ];

  const faqs = [
    {
      id: 1,
      category: 'general',
      question: 'What is MY-RUNNER.COM?',
      answer: 'MY-RUNNER.COM is an on-demand delivery service that connects customers who need auto parts with drivers who can pick them up and deliver them quickly.'
    },
    {
      id: 2,
      category: 'general',
      question: 'How fast can I get my parts delivered?',
      answer: 'Most deliveries are completed within 1-2 hours, depending on your location and the availability of drivers in your area.'
    },
    {
      id: 3,
      category: 'customers',
      question: 'How do I request a delivery?',
      answer: 'Simply open the app, enter the auto parts store location, your delivery address, and any special instructions. A driver will be assigned to your order.'
    },
    {
      id: 4,
      category: 'customers',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, PayPal, and Apple Pay. Payment is processed securely through our app.'
    },
    {
      id: 5,
      category: 'drivers',
      question: 'How do I become a MY-RUNNER.COM driver?',
      answer: 'You can apply through our driver application page. You\'ll need a valid driver\'s license, vehicle insurance, and pass a background check.'
    },
    {
      id: 6,
      category: 'drivers',
      question: 'How much can I earn as a driver?',
      answer: 'Driver earnings vary based on location, time of day, and number of deliveries. Most drivers earn $15-25 per hour including tips.'
    },
    {
      id: 7,
      category: 'drivers',
      question: 'What vehicle requirements do you have?',
      answer: 'Your vehicle must be 2010 or newer, have valid registration and insurance, and be able to safely transport auto parts.'
    },
    {
      id: 8,
      category: 'billing',
      question: 'How is delivery pricing calculated?',
      answer: 'Pricing is based on distance, demand, and delivery complexity. You\'ll see the total cost before confirming your order.'
    },
    {
      id: 9,
      category: 'billing',
      question: 'Can I tip my driver?',
      answer: 'Yes! You can add a tip through the app before or after delivery. Tips go directly to your driver.'
    },
    {
      id: 10,
      category: 'general',
      question: 'What areas do you serve?',
      answer: 'We currently serve major metropolitan areas across the United States. Check our app to see if service is available in your area.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-300">
            Find answers to common questions about MY-RUNNER.COM
          </p>
        </div>

        <Card className="mb-8 bg-gray-800 border-gray-600">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-2"
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon className="w-4 h-4 mr-1" />
                {category.name}
              </Badge>
            );
          })}
        </div>

        <Card className="bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedCategory === 'all' ? 'All Questions' : 
               categories.find(c => c.id === selectedCategory)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                  <AccordionTrigger className="text-left text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No questions found
                </h3>
                <p className="text-gray-300">
                  Try adjusting your search or browse different categories
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8 bg-gray-800 border-gray-600">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-medium text-white mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-300 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
              <button
                onClick={() => navigate('/driver-application')}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Become a Driver
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;