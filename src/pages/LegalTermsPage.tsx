import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const LegalTermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Legal Terms & Policies</h1>
          <p className="text-gray-300 text-lg">Important legal information for MyPartsRunner users</p>
        </div>

        <Alert className="bg-yellow-900/20 border-yellow-600/30 mb-8">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription className="text-yellow-300">
            <strong>Legal Notice:</strong> These terms are for demonstration purposes. 
            For production use, consult with a qualified attorney to ensure compliance with local laws and regulations.
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          {/* Terms of Service */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" />
                Terms of Service
                <Badge className="bg-red-900/30 text-red-300 border-red-600/30">
                  Legal Review Required
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">1. Service Description</h3>
                <p className="text-gray-300 mb-4">
                  MyPartsRunner is a delivery service platform that connects customers with independent drivers 
                  for pickup and delivery services. We facilitate transactions but are not a transportation company.
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Service available 24/7 nationwide</li>
                  <li>• Independent contractor drivers</li>
                  <li>• Real-time tracking and notifications</li>
                  <li>• Secure payment processing</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">2. User Responsibilities</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Customer Responsibilities:</h4>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Provide accurate pickup and delivery addresses</li>
                      <li>• Ensure items are legal and safe for transport</li>
                      <li>• Be available for pickup and delivery</li>
                      <li>• Pay all fees and charges promptly</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Driver Responsibilities:</h4>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Maintain valid driver's license and insurance</li>
                      <li>• Pass background checks and verification</li>
                      <li>• Provide professional service</li>
                      <li>• Follow all traffic laws and safety protocols</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">3. Prohibited Items</h3>
                <p className="text-gray-300 mb-3">The following items are strictly prohibited:</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Hazardous materials (chemicals, explosives, etc.)</li>
                  <li>• Illegal substances or contraband</li>
                  <li>• Live animals (except service animals)</li>
                  <li>• Perishable food without proper packaging</li>
                  <li>• Items over 50 pounds without prior approval</li>
                  <li>• Cash, jewelry, or high-value items over $500</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">4. Payment Terms</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• All payments processed through Stripe</li>
                  <li>• Prices include base delivery fee + distance charges</li>
                  <li>• Tips are optional and go directly to drivers</li>
                  <li>• Refunds processed within 3-5 business days</li>
                  <li>• Service fees are non-refundable</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">5. Liability and Insurance</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Drivers are independent contractors with their own insurance</li>
                  <li>• MyPartsRunner provides platform insurance up to $1M per incident</li>
                  <li>• Customers responsible for item value over $500</li>
                  <li>• Claims must be reported within 24 hours</li>
                  <li>• Investigation process may take 5-10 business days</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">6. Dispute Resolution</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• All disputes subject to binding arbitration</li>
                  <li>• Governing law: State of Delaware</li>
                  <li>• Class action waiver</li>
                  <li>• 30-day resolution timeline</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                Privacy Policy
                <Badge className="bg-red-900/30 text-red-300 border-red-600/30">
                  Legal Review Required
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Personal Information:</h4>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• Name, email, phone number</li>
                      <li>• Payment information (processed by Stripe)</li>
                      <li>• Location data for service delivery</li>
                      <li>• Driver license and insurance information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">Usage Information:</h4>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li>• App usage patterns and preferences</li>
                      <li>• Device information and IP address</li>
                      <li>• Communication records</li>
                      <li>• Performance and error data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">2. How We Use Information</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Provide and improve our services</li>
                  <li>• Process payments and transactions</li>
                  <li>• Verify driver credentials and safety</li>
                  <li>• Send service updates and notifications</li>
                  <li>• Prevent fraud and ensure safety</li>
                  <li>• Comply with legal obligations</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h3>
                <p className="text-gray-300 mb-3">We share information only in these circumstances:</p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• With drivers to complete deliveries</li>
                  <li>• With payment processors (Stripe)</li>
                  <li>• With law enforcement when legally required</li>
                  <li>• With your explicit consent</li>
                  <li>• In case of emergency or safety concerns</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">4. Data Security</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• End-to-end encryption for sensitive data</li>
                  <li>• Regular security audits and updates</li>
                  <li>• Secure data centers with 99.9% uptime</li>
                  <li>• Employee access controls and training</li>
                  <li>• Incident response procedures</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">5. Your Rights (GDPR/CCPA)</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Access your personal data</li>
                  <li>• Correct inaccurate information</li>
                  <li>• Delete your account and data</li>
                  <li>• Opt-out of marketing communications</li>
                  <li>• Data portability</li>
                  <li>• Withdraw consent at any time</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Driver Agreement */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5" />
                Driver Agreement
                <Badge className="bg-red-900/30 text-red-300 border-red-600/30">
                  Legal Review Required
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">1. Independent Contractor Status</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• You are an independent contractor, not an employee</li>
                  <li>• You control your own schedule and work methods</li>
                  <li>• You are responsible for your own taxes and insurance</li>
                  <li>• You can work for other companies</li>
                  <li>• You provide your own vehicle and equipment</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">2. Driver Requirements</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Valid driver's license for at least 2 years</li>
                  <li>• Clean driving record (no major violations)</li>
                  <li>• Pass criminal background check</li>
                  <li>• Maintain auto insurance coverage</li>
                  <li>• Vehicle registration and inspection</li>
                  <li>• Complete safety training course</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">3. Earnings and Payments</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• 70% of delivery fee goes to driver</li>
                  <li>• 100% of tips go to driver</li>
                  <li>• INSTANT/DAILY payouts via Stripe</li>
                  <li>• Detailed earnings statements provided</li>
                  <li>• Tax forms issued annually (1099)</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">4. Safety and Conduct</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Follow all traffic laws and safety protocols</li>
                  <li>• Maintain professional appearance and conduct</li>
                  <li>• Report incidents immediately</li>
                  <li>• No discrimination or harassment</li>
                  <li>• Respect customer privacy and property</li>
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">5. Termination</h3>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Either party may terminate with 24-hour notice</li>
                  <li>• Immediate termination for safety violations</li>
                  <li>• Appeal process available</li>
                  <li>• Final payment within 30 days</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <Card className="bg-red-900/20 border-red-600/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="w-5 h-5" />
                Important Legal Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-red-200">
                <p>
                  <strong>These legal documents are templates for demonstration purposes only.</strong> 
                  Before using MyPartsRunner in production, you must:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Consult with a qualified attorney</li>
                  <li>• Review local, state, and federal regulations</li>
                  <li>• Obtain appropriate business insurance</li>
                  <li>• Ensure compliance with transportation laws</li>
                  <li>• Review employment law implications</li>
                  <li>• Consider data protection regulations (GDPR, CCPA)</li>
                </ul>
                <p className="font-semibold">
                  MyPartsRunner is not responsible for legal compliance. 
                  Users assume all legal risks and responsibilities.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalTermsPage;
