import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle,
  Send,
  Search,
  Filter,
  Star,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Building2,
  FileBadge,
  Lock
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'delivery' | 'general';
  createdAt: string;
  updatedAt: string;
  response?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}

const CustomerSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    category: 'general' as const,
    priority: 'medium' as const
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I place an order?',
      answer: 'Simply click "Request Pickup" on the homepage, enter your pickup and delivery addresses, describe your item, and complete payment. A driver will be assigned to your order.',
      category: 'general',
      helpful: 45,
      notHelpful: 2
    },
    {
      id: '2',
      question: 'What can I have delivered?',
      answer: 'MyPartsRunner can pick up and deliver almost anything - packages, documents, food, groceries, personal items, and more. We cannot transport hazardous materials, illegal items, or live animals.',
      category: 'general',
      helpful: 38,
      notHelpful: 1
    },
    {
      id: '3',
      question: 'How much does delivery cost?',
      answer: 'Our pricing is based on distance and item size. Base delivery starts at $5.99. You can see the exact cost before confirming your order.',
      category: 'billing',
      helpful: 52,
      notHelpful: 3
    },
    {
      id: '4',
      question: 'How do I track my order?',
      answer: 'Once your order is accepted by a driver, you can track it in real-time through the "My Orders" section. You\'ll receive notifications for status updates.',
      category: 'delivery',
      helpful: 41,
      notHelpful: 1
    },
    {
      id: '5',
      question: 'What if my driver doesn\'t show up?',
      answer: 'If your driver doesn\'t arrive within the estimated time, contact support immediately. We\'ll assign a new driver and may provide compensation for the delay.',
      category: 'delivery',
      helpful: 29,
      notHelpful: 4
    },
    {
      id: '6',
      question: 'How do I become a driver?',
      answer: 'Click "Become a Driver" on our homepage, complete the application, and pass our background check. You\'ll need a valid driver\'s license and insurance.',
      category: 'general',
      helpful: 67,
      notHelpful: 2
    },
    {
      id: '7',
      question: 'How do I get a refund?',
      answer: 'Refunds are processed through your original payment method within 3-5 business days. Contact support with your order number for assistance.',
      category: 'billing',
      helpful: 33,
      notHelpful: 5
    },
    {
      id: '8',
      question: 'Is my payment information secure?',
      answer: 'Yes, we use Stripe for payment processing, which is PCI DSS compliant. Your payment information is encrypted and never stored on our servers.',
      category: 'technical',
      helpful: 48,
      notHelpful: 1
    }
  ];

  const categories = ['all', 'general', 'billing', 'delivery', 'technical'];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate ticket submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitSuccess(true);
      setTicketForm({
        subject: '',
        message: '',
        category: 'general',
        priority: 'medium'
      });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFAQFeedback = (faqId: string, helpful: boolean) => {
    // In a real app, this would update the database
    console.log(`FAQ ${faqId} feedback: ${helpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Customer Support</h1>
        <p className="text-gray-300">We're here to help! Find answers or get in touch with our support team.</p>
      </div>

      <Alert className="bg-emerald-900/15 border-emerald-500/40 text-emerald-200">
        <ShieldCheck className="w-5 h-5" />
        <AlertDescription className="space-y-1 text-sm">
          <p className="font-semibold text-emerald-100">Verified & Protected</p>
          <div className="grid gap-1 sm:grid-cols-3 text-emerald-200/90">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Kentucky LLC · EIN on file
            </span>
            <span className="inline-flex items-center gap-2">
              <FileBadge className="h-4 w-4" />
              Commercial liability coverage active
            </span>
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Supabase RLS & Stripe PCI-DSS compliance
            </span>
          </div>
          <p className="pt-1 text-xs text-emerald-200/70">
            Need documentation for your records? <a href="/security" className="underline text-emerald-100 hover:text-emerald-50">See our Security & Compliance overview</a>.
          </p>
        </AlertDescription>
      </Alert>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <Button
          variant={activeTab === 'faq' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('faq')}
          className="flex-1"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          FAQ
        </Button>
        <Button
          variant={activeTab === 'contact' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('contact')}
          className="flex-1"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Us
        </Button>
        <Button
          variant={activeTab === 'tickets' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('tickets')}
          className="flex-1"
        >
          <Clock className="w-4 h-4 mr-2" />
          My Tickets
        </Button>
      </div>

      {/* FAQ Section */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Filter className="w-4 h-4 text-gray-400 mt-2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-300 mb-4">{faq.answer}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                      {faq.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Was this helpful?</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFAQFeedback(faq.id, true)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {faq.helpful}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFAQFeedback(faq.id, false)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        {faq.notHelpful}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contact Us Section */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Phone Support</h3>
                <p className="text-gray-300 mb-3">Call us for immediate assistance</p>
                <p className="text-teal-400 font-semibold">1-800-MYPARTS</p>
                <p className="text-sm text-gray-400">24/7 Available</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
                <p className="text-gray-300 mb-3">Send us a detailed message</p>
                <p className="text-teal-400 font-semibold">infomypartsrunner@gmail.com</p>
                <p className="text-sm text-gray-400">Response within 2 hours</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
                <p className="text-gray-300 mb-3">Chat with our support team</p>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  Start Chat
                </Button>
                <p className="text-sm text-gray-400 mt-2">Available 9 AM - 9 PM EST</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Ticket Form */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Submit a Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              {submitSuccess && (
                <Alert className="bg-green-900/20 border-green-600/30 mb-4">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription className="text-green-300">
                    Your support ticket has been submitted successfully! We'll get back to you within 2 hours.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <Input
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                      placeholder="Brief description of your issue"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({...ticketForm, category: e.target.value as any})}
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <Textarea
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                    placeholder="Please provide detailed information about your issue..."
                    className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Tickets Section */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Support Tickets</h3>
              <p className="text-gray-300 mb-4">
                You haven't submitted any support tickets yet. Use the "Contact Us" tab to get help.
              </p>
              <Button 
                onClick={() => setActiveTab('contact')}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomerSupport;
