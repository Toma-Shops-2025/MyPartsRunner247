import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

interface DriverRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  orderId: string;
  customerId: string;
  driverName?: string;
}

const DriverRatingModal: React.FC<DriverRatingModalProps> = ({
  isOpen,
  onClose,
  driverId,
  orderId,
  customerId,
  driverName
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-driver-rating', {
        body: {
          driverId,
          customerId,
          orderId,
          rating,
          comment: comment.trim() || null
        }
      });

      if (error) throw error;

      // Close modal and reset form
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setRating(0);
    setComment('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="rating-modal-description"
      >
        <DialogHeader>
          <DialogTitle>Rate Your Driver</DialogTitle>
          <div id="rating-modal-description" className="sr-only">
            Rate your driver experience and provide optional feedback
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {driverName && (
            <p className="text-gray-600">
              How was your experience with {driverName}?
            </p>
          )}

          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-colors"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Comments (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriverRatingModal;