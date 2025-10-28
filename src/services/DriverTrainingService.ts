import { supabase } from '@/lib/supabase';

export interface TrainingVideo {
  id: number;
  title: string;
  description: string;
  duration: string;
  youtubeUrl: string;
  completed: boolean;
  completedAt?: string;
}

export interface TrainingProgress {
  totalVideos: number;
  completedVideos: number;
  completionPercentage: number;
  isFullyCompleted: boolean;
  lastCompletionDate?: string;
}

export class DriverTrainingService {
  /**
   * Mark a training video as completed
   */
  static async markVideoCompleted(
    userId: string, 
    videoId: number, 
    videoTitle: string, 
    progressPercentage: number = 100
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('driver_training_completion')
        .upsert({
          user_id: userId,
          video_id: videoId,
          video_title: videoTitle,
          progress_percentage: progressPercentage,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        });

      if (error) {
        console.error('Error marking video as completed:', error);
        return false;
      }

      console.log(`Video ${videoId} marked as completed for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error in markVideoCompleted:', error);
      return false;
    }
  }

  /**
   * Get training progress for a driver
   */
  static async getTrainingProgress(userId: string): Promise<TrainingProgress | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_driver_training_status', { driver_user_id: userId });

      if (error) {
        console.error('Error getting training progress:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          totalVideos: 5,
          completedVideos: 0,
          completionPercentage: 0,
          isFullyCompleted: false
        };
      }

      const progress = data[0];
      return {
        totalVideos: progress.total_videos,
        completedVideos: progress.completed_videos,
        completionPercentage: progress.completion_percentage,
        isFullyCompleted: progress.is_fully_completed,
        lastCompletionDate: progress.last_completion_date
      };
    } catch (error) {
      console.error('Error in getTrainingProgress:', error);
      return null;
    }
  }

  /**
   * Get completed video IDs for a driver
   */
  static async getCompletedVideoIds(userId: string): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('driver_training_completion')
        .select('video_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting completed video IDs:', error);
        return [];
      }

      return data?.map(item => item.video_id) || [];
    } catch (error) {
      console.error('Error in getCompletedVideoIds:', error);
      return [];
    }
  }

  /**
   * Get all training videos with completion status
   */
  static async getTrainingVideosWithStatus(userId: string): Promise<TrainingVideo[]> {
    const trainingVideos: Omit<TrainingVideo, 'completed' | 'completedAt'>[] = [
      {
        id: 1,
        title: "Welcome to MyPartsRunner",
        description: "Welcome to the MyPartsRunner family! Learn about our platform, driver benefits, and how to get started on your journey to success.",
        duration: "1-2 minutes",
        youtubeUrl: "https://www.youtube.com/embed/zXXTd81HXg4"
      },
      {
        id: 2,
        title: "Driver Dashboard Overview",
        description: "Master the driver dashboard, learn how to go online/offline, accept orders, and navigate to pickup locations efficiently.",
        duration: "2-3 minutes",
        youtubeUrl: "https://www.youtube.com/embed/z6vBcxe4a1Y"
      },
      {
        id: 3,
        title: "Maximizing Your Earnings",
        description: "Discover peak hours, high-demand areas, order selection strategies, and tips to maximize your earnings as a MyPartsRunner driver.",
        duration: "3-4 minutes",
        youtubeUrl: "https://www.youtube.com/embed/7vOyfgpVHLU"
      },
      {
        id: 4,
        title: "Customer Service Excellence",
        description: "Learn professional communication, handling difficult situations, building customer relationships, and providing exceptional service.",
        duration: "2-3 minutes",
        youtubeUrl: "https://www.youtube.com/embed/wq0bbatXx7A"
      },
      {
        id: 5,
        title: "Safety First",
        description: "Understand personal safety protocols, vehicle safety checks, emergency procedures, and maintaining safety standards while driving.",
        duration: "2-3 minutes",
        youtubeUrl: "https://www.youtube.com/embed/YnN2n1Ek5z8"
      }
    ];

    try {
      const completedIds = await this.getCompletedVideoIds(userId);
      const completionData = await this.getCompletionData(userId);

      return trainingVideos.map(video => ({
        ...video,
        completed: completedIds.includes(video.id),
        completedAt: completionData[video.id]?.completed_at
      }));
    } catch (error) {
      console.error('Error in getTrainingVideosWithStatus:', error);
      return trainingVideos.map(video => ({
        ...video,
        completed: false
      }));
    }
  }

  /**
   * Get completion data with timestamps
   */
  private static async getCompletionData(userId: string): Promise<{ [key: number]: { completed_at: string } }> {
    try {
      const { data, error } = await supabase
        .from('driver_training_completion')
        .select('video_id, completed_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting completion data:', error);
        return {};
      }

      const result: { [key: number]: { completed_at: string } } = {};
      data?.forEach(item => {
        result[item.video_id] = { completed_at: item.completed_at };
      });

      return result;
    } catch (error) {
      console.error('Error in getCompletionData:', error);
      return {};
    }
  }

  /**
   * Sync localStorage with database (for existing users)
   */
  static async syncLocalStorageWithDatabase(userId: string): Promise<void> {
    try {
      const localCompleted = localStorage.getItem('driver_training_completed');
      if (!localCompleted) return;

      const completedIds: number[] = JSON.parse(localCompleted);
      
      for (const videoId of completedIds) {
        const videoTitle = this.getVideoTitleById(videoId);
        if (videoTitle) {
          await this.markVideoCompleted(userId, videoId, videoTitle);
        }
      }

      // Clear localStorage after sync
      localStorage.removeItem('driver_training_completed');
      console.log('Training completion synced from localStorage to database');
    } catch (error) {
      console.error('Error syncing localStorage with database:', error);
    }
  }

  /**
   * Get video title by ID
   */
  private static getVideoTitleById(videoId: number): string | null {
    const titles: { [key: number]: string } = {
      1: "Welcome to MyPartsRunner",
      2: "Driver Dashboard Overview", 
      3: "Maximizing Your Earnings",
      4: "Customer Service Excellence",
      5: "Safety First"
    };
    return titles[videoId] || null;
  }
}
