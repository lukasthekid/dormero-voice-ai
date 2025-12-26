import { useState, useEffect } from 'react';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreviousRatings, setShowPreviousRatings] = useState(false);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const avgRating = calculateAverageRating(call.feedback);
  const feedbackCount = call.feedback?.length || 0;
  const hasFeedback = feedbackCount > 0;

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmitRating = async () => {
    if (!callId || rating === 0) {
      setRatingError('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);
    setShowSuccess(false);

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

      // Show success feedback
      setShowSuccess(true);

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

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this rating?')) {
      return;
    }

    setDeletingFeedbackId(feedbackId);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/feedback/action/${feedbackId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete rating');
      }

      // Refresh call details to get updated feedback
      onRatingSubmitted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  // Get rating distribution for stats
  const getRatingDistribution = () => {
    if (!call.feedback || call.feedback.length === 0) return null;
    
    const distribution = {
      excellent: 0, // 5 stars
      good: 0,      // 4 stars
      average: 0,   // 3 stars
      poor: 0,      // 2 stars
      veryPoor: 0,  // 1 star
    };

    call.feedback.forEach((f) => {
      if (f.rating === 5) distribution.excellent++;
      else if (f.rating === 4) distribution.good++;
      else if (f.rating === 3) distribution.average++;
      else if (f.rating === 2) distribution.poor++;
      else if (f.rating === 1) distribution.veryPoor++;
    });

    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Hero Section - Rate This Call (PRIMARY ACTION) */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border-2 border-indigo-100 p-8 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Rate This Call</h3>
            <p className="text-sm text-slate-600">
              Help improve the AI system by sharing your feedback
            </p>
          </div>

          {/* Star Rating Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              How would you rate this call?
            </label>
            <div className="flex items-center gap-1">
              <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
              {rating > 0 && (
                <span className="ml-3 text-sm font-medium text-slate-700">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
              Comment <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all placeholder:text-slate-400"
              placeholder="What went well? What could be improved?"
              maxLength={500}
            />
            <div className="mt-1 text-xs text-slate-500 text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-emerald-800">
                Rating submitted successfully!
              </span>
            </div>
          )}

          {/* Error Message */}
          {ratingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-red-800">{ratingError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitRating}
            disabled={submittingRating || rating === 0}
            className="w-full px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none flex items-center justify-center gap-2"
          >
            {submittingRating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </div>

      {/* Rating Stats (SECONDARY) */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
        <h4 className="text-sm font-semibold text-slate-900 mb-4">Rating Statistics</h4>
        {avgRating !== null ? (
          <div className="space-y-4">
            {/* Average Rating Display */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <StarRating rating={avgRating} size="lg" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{avgRating.toFixed(1)}</div>
                  <div className="text-xs text-slate-600">
                    Average from {feedbackCount} {feedbackCount === 1 ? 'rating' : 'ratings'}
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {distribution && feedbackCount > 1 && (
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-700 mb-2">Distribution</div>
                <div className="space-y-1.5">
                  {distribution.excellent > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-slate-600">Excellent:</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(distribution.excellent / feedbackCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-slate-700 font-medium">{distribution.excellent}</span>
                    </div>
                  )}
                  {distribution.good > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-slate-600">Good:</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(distribution.good / feedbackCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-slate-700 font-medium">{distribution.good}</span>
                    </div>
                  )}
                  {distribution.average > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-slate-600">Average:</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(distribution.average / feedbackCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-slate-700 font-medium">{distribution.average}</span>
                    </div>
                  )}
                  {(distribution.poor > 0 || distribution.veryPoor > 0) && (
                    <>
                      {distribution.poor > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-slate-600">Poor:</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${(distribution.poor / feedbackCount) * 100}%` }}
                            />
                          </div>
                          <span className="w-8 text-slate-700 font-medium">{distribution.poor}</span>
                        </div>
                      )}
                      {distribution.veryPoor > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-slate-600">Very Poor:</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${(distribution.veryPoor / feedbackCount) * 100}%` }}
                            />
                          </div>
                          <span className="w-8 text-slate-700 font-medium">{distribution.veryPoor}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No ratings yet</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to rate this call!</p>
          </div>
        )}
      </div>

      {/* Previous Ratings (TERTIARY - Collapsible) */}
      {hasFeedback && (
        <div className="bg-white rounded-lg border border-slate-200">
          <button
            onClick={() => setShowPreviousRatings(!showPreviousRatings)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg"
          >
            <h4 className="text-sm font-semibold text-slate-900">
              Previous Ratings <span className="text-slate-500 font-normal">({feedbackCount})</span>
            </h4>
            <svg
              className={`w-5 h-5 text-slate-500 transition-transform ${
                showPreviousRatings ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPreviousRatings && (
            <div className="px-5 pb-5 space-y-3 border-t border-slate-200 pt-4">
              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-red-800">{deleteError}</span>
                </div>
              )}
              {call.feedback
                ?.slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((feedback) => (
                  <div
                    key={feedback.id}
                    className="bg-slate-50 rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors relative group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating rating={feedback.rating} size="sm" />
                        <span className="text-sm font-medium text-slate-900">{feedback.rating}/5</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => handleDeleteFeedback(feedback.id)}
                          disabled={deletingFeedbackId === feedback.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete rating"
                        >
                          {deletingFeedbackId === feedback.id ? (
                            <svg
                              className="w-4 h-4 animate-spin"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {feedback.comment}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State for Previous Ratings */}
      {!hasFeedback && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
          <svg
            className="w-12 h-12 text-slate-400 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-700 mb-1">No ratings yet</p>
          <p className="text-xs text-slate-500">Be the first to rate this call!</p>
        </div>
      )}
    </div>
  );
}

