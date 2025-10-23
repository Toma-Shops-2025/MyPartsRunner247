import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userInitials: string;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  userInitials,
  onAvatarUpdate,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);

      // Convert file to base64 for simple storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string;
          
          // Update profile in database with base64 data
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: base64String })
            .eq('id', (await supabase.auth.getUser()).data.user?.id);

          if (updateError) {
            throw updateError;
          }

          onAvatarUpdate(base64String);
          setPreviewUrl(null);

          toast({
            title: "Profile picture updated!",
            description: "Your new avatar has been saved successfully.",
          });

        } catch (error) {
          console.error('Error uploading avatar:', error);
          toast({
            title: "Upload failed",
            description: "There was an error uploading your profile picture. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setIsUploading(true);

      // Remove from database
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }

      onAvatarUpdate(null);
      setPreviewUrl(null);

      toast({
        title: "Profile picture removed",
        description: "Your avatar has been reset to initials.",
      });

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Remove failed",
        description: "There was an error removing your profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt="Profile" />
          <AvatarFallback className="text-2xl font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {previewUrl && (
          <div className="flex space-x-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Save Picture'}
            </Button>
            <Button
              onClick={() => {
                setPreviewUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {!previewUrl && (
          <div className="flex space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Change Picture
            </Button>
            
            {currentAvatarUrl && (
              <Button
                onClick={removeAvatar}
                disabled={isUploading}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Click the camera icon or "Change Picture" to upload a new avatar.<br/>
        Max size: 5MB. Supported formats: JPG, PNG, GIF
      </p>
    </div>
  );
};

export default AvatarUpload;
