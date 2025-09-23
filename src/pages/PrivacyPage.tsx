import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPage = () => {
  const navigate = useNavigate();

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
          <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-300">
            Last updated: January 1, 2024
          </p>
        </div>

        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="prose max-w-none p-8 text-gray-300">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, request a delivery, or contact us for support.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide and improve our delivery services</li>
              <li>Process payments and send receipts</li>
              <li>Communicate with you about your orders</li>
              <li>Send promotional materials (with your consent)</li>
              <li>Ensure safety and security of our platform</li>
            </ul>

            <h2>3. Location Information</h2>
            <p>
              We collect location data to match you with nearby drivers and provide accurate delivery services. You can control location sharing through your device settings.
            </p>

            <h2>4. Information Sharing</h2>
            <p>
              We may share your information with:
            </p>
            <ul>
              <li>Drivers to facilitate deliveries</li>
              <li>Service providers who help us operate our platform</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2>6. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content.
            </p>

            <h2>8. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services. We are not responsible for their privacy practices.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, contact us at privacy@mypartsrunner.com or 1-800-PARTS-RUN.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;