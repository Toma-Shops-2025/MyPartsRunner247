import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, FileText, Building2, FileBadge, Lock, ClipboardList } from 'lucide-react';

const SecurityPage: React.FC = () => {
  const navigate = useNavigate();

  const highlights = [
    {
      icon: Building2,
      title: 'Registered Entity',
      description: 'MyPartsRunner LLC · Kentucky Secretary of State filing #0745623 · EIN available upon request.'
    },
    {
      icon: FileBadge,
      title: 'Insurance Coverage',
      description: 'Commercial general liability and hired/non-owned auto coverage in force for drivers and operations.'
    },
    {
      icon: Lock,
      title: 'Data Protection',
      description: 'Supabase RLS, encrypted storage, least-privilege service roles, and Stripe PCI-DSS compliant payments.'
    }
  ];

  const preparedness = [
    'Annual legal & tax review with licensed professionals.',
    'Document retention plan for operating agreement, EIN letter, insurance certificates, and key vendor contracts.',
    'Incident response plan covering service outages, data breaches, and driver safety escalations.',
    'Regular audits of Netlify environment variables and Supabase policies to prevent configuration drift.'
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NewHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-gray-300 hover:text-white w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <section className="space-y-6 text-center">
          <ShieldCheck className="w-14 h-14 text-emerald-400 mx-auto" />
          <h1 className="text-4xl font-bold">Security & Compliance</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            MyPartsRunner is committed to protecting customers, drivers, and partners through sound legal registration,
            documented insurance, and secure technology practices. Use this page to reference our credentials or request
            supporting paperwork.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6 space-y-3">
                <Icon className="w-10 h-10 text-emerald-300" />
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-300" />
                Requested Documentation
              </h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Operating agreement / Articles of Organization</li>
                <li>• IRS EIN assignment letter</li>
                <li>• Certificates of insurance (general liability, NEMT/hired auto)</li>
                <li>• Stripe service agreement & PCI Attestation (via Stripe dashboard)</li>
                <li>• Supabase security policy summary and backup schedule</li>
              </ul>
              <p className="text-xs text-gray-400">
                Need a copy? Email <a href="mailto:legal@mypartsrunner.com" className="text-emerald-300 underline">legal@mypartsrunner.com</a>
                with subject “Documentation Request” and allow up to one business day.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-amber-300" />
                Operational Checklist
              </h2>
              <ul className="space-y-2 text-sm text-gray-300">
                {preparedness.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-400">
                Checklist owner: Toma Adkins, Founder. Last reviewed: November 8, 2025.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="text-center space-y-4">
          <p className="text-gray-300">
            For audits, partnership reviews, or legal inquiries, contact our compliance desk directly at{' '}
            <a href="mailto:compliance@mypartsrunner.com" className="text-emerald-300 underline">
              compliance@mypartsrunner.com
            </a>.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/support')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            Request Documentation
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SecurityPage;

