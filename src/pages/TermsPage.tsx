import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: January 1, 2024
          </p>
        </div>

        <Card>
          <CardContent className="prose max-w-none p-8">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using MyPartsRunner's services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Service Description</h2>
            <p>
              MyPartsRunner provides an on-demand delivery platform that connects customers who need auto parts with independent contractor drivers who can pick up and deliver those parts.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To use our services, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2>4. Driver Requirements</h2>
            <p>
              Drivers must meet the following requirements:
            </p>
            <ul>
              <li>Valid driver's license</li>
              <li>Vehicle insurance</li>
              <li>Background check clearance</li>
              <li>Vehicle meeting our standards</li>
            </ul>

            <h2>5. Payment Terms</h2>
            <p>
              Customers agree to pay all fees associated with their delivery requests. Drivers will receive payment according to our driver payment terms.
            </p>

            <h2>6. Liability and Insurance</h2>
            <p>
              MyPartsRunner maintains appropriate insurance coverage. Users acknowledge that they use the service at their own risk.
            </p>

            <h2>7. Prohibited Uses</h2>
            <p>
              Users may not use our service for illegal activities, harassment, or any purpose that violates these terms.
            </p>

            <h2>8. Termination</h2>
            <p>
              We reserve the right to terminate accounts that violate these terms or for any reason with appropriate notice.
            </p>

            <h2>9. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of our service constitutes acceptance of updated terms.
            </p>

            <h2>10. Contact Information</h2>
            <p>
              For questions about these terms, contact us at legal@mypartsrunner.com or 1-800-PARTS-RUN.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;