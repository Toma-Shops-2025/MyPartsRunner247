import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NotificationTestPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [smsPhone, setSmsPhone] = useState('');
  const [smsBody, setSmsBody] = useState('🚚 Test delivery alert from MyPartsRunner.');
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('MyPartsRunner Test Email');
  const [emailBody, setEmailBody] = useState('<p>This is a test notification email from MyPartsRunner.</p>');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!loading && (!user || profile?.user_type !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <Card className="max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <p>This testing page is available to admins only.</p>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSendSms = async (event: React.FormEvent) => {
    event.preventDefault();
    setSmsStatus('Sending...');

    try {
      const response = await fetch('/.netlify/functions/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: smsPhone, body: smsBody }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to send SMS');
      }

      setSmsStatus('✅ SMS sent successfully.');
    } catch (error: any) {
      setSmsStatus(`❌ ${error.message || 'SMS failed to send.'}`);
    }
  };

  const handleSendEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailStatus('Sending...');

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          text: emailBody.replace(/<[^>]+>/g, ''),
          html: emailBody,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to send email');
      }

      setEmailStatus('✅ Email sent successfully.');
    } catch (error: any) {
      setEmailStatus(`❌ ${error.message || 'Email failed to send.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notification Test Harness</h1>
            <p className="text-gray-400">Use this page to verify Twilio SMS and SendGrid email delivery. Remove after setup.</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Send Test SMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSendSms} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Phone Number (E.164 or local)</label>
                <Input
                  value={smsPhone}
                  onChange={(event) => setSmsPhone(event.target.value)}
                  placeholder="+15025550123"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Message</label>
                <textarea
                  value={smsBody}
                  onChange={(event) => setSmsBody(event.target.value)}
                  className="w-full min-h-[120px] rounded-md bg-gray-900 border border-gray-700 p-3 text-sm"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Send SMS</Button>
            </form>
            {smsStatus && <p className="text-sm text-gray-300">{smsStatus}</p>}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Recipient Email</label>
                <Input
                  type="email"
                  value={emailTo}
                  onChange={(event) => setEmailTo(event.target.value)}
                  placeholder="driver@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Subject</label>
                <Input
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">HTML Body</label>
                <textarea
                  value={emailBody}
                  onChange={(event) => setEmailBody(event.target.value)}
                  className="w-full min-h-[160px] rounded-md bg-gray-900 border border-gray-700 p-3 text-sm"
                  required
                />
                <p className="text-xs text-gray-400">Plain text will be generated automatically from the HTML.</p>
              </div>
              <Button type="submit" className="w-full">Send Email</Button>
            </form>
            {emailStatus && <p className="text-sm text-gray-300">{emailStatus}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationTestPage;

