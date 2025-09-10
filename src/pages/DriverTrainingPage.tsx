import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle, Clock, BookOpen, Award } from 'lucide-react';

const DriverTrainingPage = () => {
  const navigate = useNavigate();
  const [modules] = useState([
    {
      id: 1,
      title: 'Safety Guidelines',
      description: 'Learn essential safety protocols for deliveries',
      duration: '15 min',
      progress: 100,
      completed: true,
      required: true
    },
    {
      id: 2,
      title: 'App Navigation',
      description: 'Master the MyPartsRunner driver app',
      duration: '20 min',
      progress: 75,
      completed: false,
      required: true
    },
    {
      id: 3,
      title: 'Customer Service',
      description: 'Best practices for customer interactions',
      duration: '12 min',
      progress: 0,
      completed: false,
      required: true
    },
    {
      id: 4,
      title: 'Vehicle Maintenance',
      description: 'Keep your vehicle in top condition',
      duration: '18 min',
      progress: 100,
      completed: true,
      required: false
    },
    {
      id: 5,
      title: 'Emergency Procedures',
      description: 'Handle unexpected situations professionally',
      duration: '10 min',
      progress: 0,
      completed: false,
      required: false
    }
  ]);

  const [certifications] = useState([
    {
      id: 1,
      name: 'Basic Driver Certification',
      earned: true,
      earnedDate: '2024-01-15'
    },
    {
      id: 2,
      name: 'Safety Excellence',
      earned: false,
      requirement: 'Complete all safety modules'
    },
    {
      id: 3,
      name: 'Customer Champion',
      earned: false,
      requirement: 'Maintain 4.8+ rating for 30 days'
    }
  ]);

  const completedModules = modules.filter(m => m.completed).length;
  const totalProgress = (completedModules / modules.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Driver Training
            </h1>
            <p className="text-gray-600">
              Complete training modules to improve your skills
            </p>
          </div>
          <Button onClick={() => navigate('/driver-dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-medium">{completedModules}/{modules.length} modules</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(totalProgress)}% complete
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 mb-8">
          <h2 className="text-xl font-semibold">Training Modules</h2>
          {modules.map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      module.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {module.completed ? <CheckCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {module.required && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Required
                      </Badge>
                    )}
                    <Badge variant={module.completed ? 'default' : 'secondary'}>
                      {module.completed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {module.duration}
                  </div>
                  {!module.completed && (
                    <Progress value={module.progress} className="flex-1 mx-4 h-2" />
                  )}
                </div>
                <Button 
                  className="w-full"
                  variant={module.completed ? 'outline' : 'default'}
                >
                  {module.completed ? 'Review Module' : module.progress > 0 ? 'Continue' : 'Start Module'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      cert.earned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{cert.name}</h4>
                      {cert.earned ? (
                        <p className="text-sm text-gray-600">Earned on {cert.earnedDate}</p>
                      ) : (
                        <p className="text-sm text-gray-600">{cert.requirement}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={cert.earned ? 'default' : 'outline'}>
                    {cert.earned ? 'Earned' : 'Not Earned'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverTrainingPage;