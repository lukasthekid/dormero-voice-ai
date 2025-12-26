import { useState } from 'react';
import type { CallDetail, Feedback } from './types';
import { calculateAverageRating } from './utils';
import StarRating from './StarRating';

interface CallRatingsTabProps {
  call: CallDetail;
  callId: string;
  onRatingSubmitted: () => void;
}

export default function CallRatingsTab({ call, callId, onRatingSubmitted }: CallRatingsTabProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const avgRating = calculateAverageRating(call.feedback);

  const handleSubmitRating = async () => {
    if (!callId || rating === 0) {
      setRatingError('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);

    try {
      const response = await fetch(`/api/feedback/${callId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Refresh call details to get updated feedback
      onRatingSubmitted();

      // Reset form
      setRating(0);
      setComment('');
      setRatingError(null);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Average Rating Display */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Average Rating</h4>
            {avgRating !== null ? (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="lg" />
                <span className="text-lg font-semibold text-slate-900">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-600">
                  ({call.feedback?.length || 0} {call.feedback?.length === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No ratings yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Rating Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-4">Rate This Call</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
            <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Share your thoughts about this call..."
            />
          </div>
          {ratingError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {ratingError}
            </div>
          )}
          <button
            onClick={handleSubmitRating}
            disabled={submittingRating || rating === 0}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>

      {/* Existing Ratings */}
      {call.feedback && call.feedback.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-4">All Ratings</h4>
          <div className="space-y-4">
            {call.feedback.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={feedback.rating} size="sm" />
                    <span className="text-sm font-medium text-slate-900">{feedback.rating}/5</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {feedback.comment && <p className="text-sm text-slate-600 mt-2">{feedback.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

