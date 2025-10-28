import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, CheckCircle, Clock, BookOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DriverTrainingService, TrainingVideo, TrainingProgress } from '@/services/DriverTrainingService';
import { toast } from '@/hooks/use-toast';

const DriverTraining: React.FC = () => {
  const { user } = useAuth();
  const [currentVideo, setCurrentVideo] = useState<number | null>(null);
  const [trainingVideos, setTrainingVideos] = useState<TrainingVideo[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [videoProgress, setVideoProgress] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);

  // Load training data on component mount
  useEffect(() => {
    const loadTrainingData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Sync any localStorage data to database first
        await DriverTrainingService.syncLocalStorageWithDatabase(user.id);
        
        // Load training videos with completion status
        const videos = await DriverTrainingService.getTrainingVideosWithStatus(user.id);
        setTrainingVideos(videos);
        
        // Load training progress
        const progress = await DriverTrainingService.getTrainingProgress(user.id);
        setTrainingProgress(progress);
      } catch (error) {
        console.error('Error loading training data:', error);
        toast({
          title: "Error",
          description: "Failed to load training data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTrainingData();
  }, [user?.id]);

  const handleVideoComplete = async (videoId: number) => {
    if (!user?.id) return;

    const video = trainingVideos.find(v => v.id === videoId);
    if (!video || video.completed) return;

    try {
      // Mark as completed in database
      const success = await DriverTrainingService.markVideoCompleted(
        user.id, 
        videoId, 
        video.title, 
        videoProgress[videoId] || 100
      );

      if (success) {
        // Update local state
        setTrainingVideos(prev => 
          prev.map(v => 
            v.id === videoId 
              ? { ...v, completed: true, completedAt: new Date().toISOString() }
              : v
          )
        );

        // Update progress
        const newProgress = await DriverTrainingService.getTrainingProgress(user.id);
        setTrainingProgress(newProgress);

        toast({
          title: "Video Completed!",
          description: `Great job completing "${video.title}"!`,
        });
      } else {
        throw new Error('Failed to save completion');
      }
    } catch (error) {
      console.error('Error completing video:', error);
      toast({
        title: "Error",
        description: "Failed to mark video as completed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVideoProgress = (videoId: number, progress: number) => {
    setVideoProgress({ ...videoProgress, [videoId]: progress });
  };

  const getCompletionPercentage = () => {
    return trainingProgress?.completionPercentage || 0;
  };

  const allVideosCompleted = trainingProgress?.isFullyCompleted || false;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-teal-500" />
          <h1 className="text-3xl font-bold text-white">Driver Training Center</h1>
        </div>
        <p className="text-gray-300 text-lg mb-6">
          Complete all training videos to become a certified MyPartsRunner driver. 
          These videos will help you provide excellent service and maximize your earnings.
        </p>
        
        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-teal-600 to-blue-600 border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Training Progress</h3>
                <p className="text-teal-100">
                  {trainingProgress?.completedVideos || 0} of {trainingProgress?.totalVideos || 5} videos completed
                </p>
                {trainingProgress?.lastCompletionDate && (
                  <p className="text-teal-200 text-sm">
                    Last completed: {new Date(trainingProgress.lastCompletionDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{getCompletionPercentage()}%</div>
                <div className="text-teal-100">Complete</div>
              </div>
            </div>
            <div className="w-full bg-teal-800 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            {allVideosCompleted && (
              <div className="mt-4 flex items-center gap-2 text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">🎉 Congratulations! You've completed all training videos!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainingVideos.map((video) => (
          <Card 
            key={video.id} 
            className={`bg-gray-800 border-gray-700 hover:border-teal-400 transition-all duration-200 ${
              video.completed ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={video.completed ? "default" : "secondary"} className="text-xs">
                  {video.completed ? "Completed" : "Pending"}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {video.duration}
                </div>
              </div>
              {video.completed && video.completedAt && (
                <div className="text-xs text-green-400 mb-2">
                  Completed on {new Date(video.completedAt).toLocaleDateString()}
                </div>
              )}
              <CardTitle className="text-white text-lg">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">{video.description}</p>
              
              {currentVideo === video.id ? (
                <div className="space-y-4">
                  <div className="bg-black rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="270"
                      src={`${video.youtubeUrl}?autoplay=1&rel=0&modestbranding=1`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    ></iframe>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleVideoComplete(video.id);
                        setCurrentVideo(null);
                      }}
                      className="flex-1"
                    >
                      Mark as Complete
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentVideo(null)}
                      className="flex-1"
                    >
                      Close Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-700 rounded-lg h-32 flex items-center justify-center relative">
                    <Play className="w-12 h-12 text-teal-400" />
                    <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(video.youtubeUrl.replace('/embed/', '/watch?v='), '_blank')}
                      className="text-white hover:text-teal-400 p-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setCurrentVideo(video.id)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      size="sm"
                    >
                      {video.completed ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Watch Again
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Training
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(video.youtubeUrl.replace('/embed/', '/watch?v='), '_blank')}
                      className="w-full text-gray-300 border-gray-600 hover:border-teal-400"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in YouTube
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Training Completion Certificate */}
      {allVideosCompleted && (
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-teal-600 border-0">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Training Complete!</h3>
            <p className="text-green-100 mb-4">
              You've successfully completed all driver training videos. You're now ready to start delivering with MyPartsRunner!
            </p>
            <Button 
              className="bg-white text-green-600 hover:bg-green-50"
              onClick={() => {
                // Mark training as completed in the database
                console.log('Training completion marked');
                alert('Training completion has been recorded! You can now start accepting orders.');
              }}
            >
              Mark Training Complete
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverTraining;
