import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, FileText, CreditCard, Shield } from 'lucide-react';

const DriverOnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      id: 1,
      title: 'Upload Documents',
      description: 'Driver\'s license, insurance, vehicle registration',
      icon: FileText,
      required: ['Driver License', 'Insurance Card', 'Vehicle Registration']
    },
    {
      id: 2,
      title: 'Background Check',
      description: 'Complete background verification process',
      icon: Shield,
      status: 'In Progress'
    },
    {
      id: 3,
      title: 'Training',
      description: 'Complete driver training modules',
      icon: Upload,
      modules: ['Safety Guidelines', 'App Usage', 'Customer Service']
    }
  ];

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    }
  };

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Driver Onboarding
          </h1>
          <p className="text-gray-600 mb-4">
            Complete these steps to start delivering with MyPartsRunner
          </p>
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              {completedSteps.length} of {steps.length} steps completed
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <Card key={step.id} className={`${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        isCompleted ? 'bg-green-100 text-green-600' : 
                        isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <Badge variant={isCompleted ? 'default' : isCurrent ? 'secondary' : 'outline'}>
                      {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Pending'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {step.required && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Required Documents:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {step.required.map((doc) => (
                          <li key={doc} className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {step.modules && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Training Modules:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {step.modules.map((module) => (
                          <li key={module} className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            {module}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isCurrent && !isCompleted && (
                    <Button 
                      onClick={() => handleStepComplete(step.id)}
                      className="w-full"
                    >
                      Complete {step.title}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {completedSteps.length === steps.length && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Onboarding Complete!
              </h2>
              <p className="text-green-600 mb-4">
                You're all set to start delivering with MyPartsRunner
              </p>
              <Button onClick={() => navigate('/driver-dashboard')}>
                Go to Driver Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverOnboardingPage;