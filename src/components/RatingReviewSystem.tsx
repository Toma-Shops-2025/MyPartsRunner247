import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, User } from 'lucide-react';

interface RatingReviewSystemProps {
  orderId: string;
  driverId?: string;
  customerId?: string;
  onComplete: (rating: number, review: string) => void;
}

interface Review {
  id: string;
  rating: number;
  review: string;
  reviewerName: string;
  reviewerType: 'customer' | 'driver';
  timestamp: string;
  helpful: number;
}

const RatingReviewSystem: React.FC<RatingReviewSystemProps> = ({ 
  orderId, 
  driverId, 
  customerId, 
  onComplete 
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock reviews data - replace with actual API call
  const mockReviews: Review[] = [
    {
      id: '1',
      rating: 5,
      review: 'Excellent service! Driver was punctual and very professional.',
      reviewerName: 'Sarah M.',
      reviewerType: 'customer',
      timestamp: '2024-01-15T14:30:00Z',
      helpful: 3
    },
    {
      id: '2',
      rating: 4,
      review: 'Good delivery, arrived on time. Would use again.',
      reviewerName: 'Mike D.',
      reviewerType: 'customer',
      timestamp: '2024-01-14T09:15:00Z',
      helpful: 1
    },
    {
      id: '3',
      rating: 5,
      review: 'Great customer! Clear instructions and easy pickup location.',
      reviewerName: 'John S.',
      reviewerType: 'driver',
      timestamp: '2024-01-13T16:45:00Z',
      helpful: 2
    }
  ];

  React.useEffect(() => {
    setReviews(mockReviews);
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      // Submit rating and review
      onComplete(rating, review);
      
      // Reset form
      setRating(0);
      setReview('');
      
      // Show success message
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      )
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getRatingText = (rating: number) => {
    const ratingTexts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || '';
  };

  return (
    <div className="space-y-6">
      {/* Rating Form */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Your Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">How would you rate this delivery?</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {getRatingText(rating)}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="review">Write a review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Tell us about your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.reviewerName}</p>
                        <p className="text-xs text-gray-500">
                          {review.reviewerType === 'customer' ? 'Customer' : 'Driver'} • {formatTimestamp(review.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{review.review}</p>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Helpful ({review.helpful})
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                      <MessageCircle className="w-3 h-3" />
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : '0.0'
                }
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (reviews.length > 0 
                        ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
                        : 0
                      )
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter(r => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-8">{star}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingReviewSystem;
