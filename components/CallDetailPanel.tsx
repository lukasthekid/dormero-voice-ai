'use client';

import { useState, useEffect, useCallback } from 'react';

// Type definitions
interface TranscriptMessage {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs: number;
}

interface Feedback {
  id: string;
  callId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CallDetail {
  id: string;
  conversationId: string;
  agentId: string;
  agentName: string | null;
  userId: string | null;
  status: string;
  terminationReason: string | null;
  startTime: string;
  acceptedTime: string | null;
  endTime: string;
  callDurationSecs: number;
  transcript: TranscriptMessage[] | any; // Can be JSON array
  transcriptSummary: string | null;
  callSummary: string | null;
  callSummaryTitle: string | null;
  callSuccessful: string | null;
  messages: number;
  callCharge: number | null;
  llmPrice: number | null;
  createdAt: string;
  updatedAt: string;
  feedback?: Feedback[];
}

interface ApiResponse {
  success: boolean;
  call: CallDetail;
  error?: string;
}

interface CallDetailPanelProps {
  callId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CallDetailPanel({ callId, isOpen, onClose }: CallDetailPanelProps) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcription' | 'ratings'>('overview');
  
  // Rating form state
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Fetch call details
  const fetchCallDetails = useCallback(async () => {
    if (!callId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/call/${callId}`);
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch call details');
      }

      setCall(data.call);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCall(null);
    } finally {
      setLoading(false);
    }
  }, [callId]);

  // Fetch when panel opens with a call ID
  useEffect(() => {
    if (isOpen && callId) {
      fetchCallDetails();
      setActiveTab('overview'); // Reset to overview tab when opening
      // Reset rating form
      setRating(0);
      setComment('');
      setRatingError(null);
    } else if (!isOpen) {
      // Reset state when panel closes
      setCall(null);
      setError(null);
      setLoading(false);
      setRating(0);
      setComment('');
      setRatingError(null);
    }
  }, [isOpen, callId, fetchCallDetails]);

  // Calculate average rating
  const calculateAverageRating = (feedback: Feedback[] | undefined): number | null => {
    if (!feedback || feedback.length === 0) return null;
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    return sum / feedback.length;
  };

  // Handle rating submission
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
      await fetchCallDetails();
      
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

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  // Format time in call (MM:SS)
  const formatTimeInCall = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(value);
  };

  // Get status badge
  const getStatusBadge = (status: string | null) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Success
        </span>
      );
    } else if (status === 'failure') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          Failed
        </span>
      );
    } else if (status === 'partial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
        Unknown
      </span>
    );
  };

  // Parse transcript (handle both array and JSON string)
  const parseTranscript = (transcript: any): TranscriptMessage[] => {
    if (!transcript) return [];
    if (Array.isArray(transcript)) return transcript;
    try {
      const parsed = typeof transcript === 'string' ? JSON.parse(transcript) : transcript;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {loading
                  ? 'Loading...'
                  : call
                  ? `Conversation with ${call.agentName || 'Unknown Agent'}`
                  : 'Call Details'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close panel"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-slate-200">
            <div className="flex px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('transcription')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transcription'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Transcription
              </button>
              <button
                onClick={() => setActiveTab('ratings')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'ratings'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Ratings
                {call?.feedback && call.feedback.length > 0 && (
                  <span className="ml-1.5 text-xs">({call.feedback.length})</span>
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto min-w-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-600">Loading call details...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full px-6">
                  <div className="text-center">
                    <div className="text-red-600 mb-2">
                      <svg
                        className="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Error loading call details
                    </p>
                    <p className="text-sm text-slate-600 mb-4">{error}</p>
                    <button
                      onClick={fetchCallDetails}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : call ? (
                <div className="p-6">
                  {activeTab === 'overview' ? (
                    <div className="space-y-6">
                      {/* Summary Section */}
                      {(call.callSummaryTitle || call.transcriptSummary || call.callSummary) && (
                        <div>
                          {call.callSummaryTitle && (
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                              {call.callSummaryTitle}
                            </h3>
                          )}
                          {(call.transcriptSummary || call.callSummary) && (
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {call.transcriptSummary || call.callSummary}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Call Details */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Call Details
                        </h4>
                        <dl className="grid grid-cols-1 gap-4">
                          {call.terminationReason && (
                            <div>
                              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                Call Ended
                              </dt>
                              <dd className="text-sm text-slate-900">{call.terminationReason}</dd>
                            </div>
                          )}
                          {call.userId && (
                            <div>
                              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                User ID
                              </dt>
                              <dd className="text-sm text-slate-900 font-mono">{call.userId}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Call Status
                            </dt>
                            <dd>{getStatusBadge(call.callSuccessful)}</dd>
                          </div>
                          {(() => {
                            const avgRating = calculateAverageRating(call.feedback);
                            if (avgRating !== null) {
                              return (
                                <div>
                                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                    Average Rating
                                  </dt>
                                  <dd>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <svg
                                            key={star}
                                            className={`w-4 h-4 ${
                                              star <= Math.round(avgRating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-slate-300'
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium text-slate-900">
                                        {avgRating.toFixed(1)} ({call.feedback?.length || 0})
                                      </span>
                                    </div>
                                  </dd>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </dl>
                      </div>
                    </div>
                  ) : activeTab === 'transcription' ? (
                    <div className="space-y-4">
                      {/* Transcription Messages */}
                      {(() => {
                        const messages = parseTranscript(call.transcript);
                        if (messages.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <p className="text-sm text-slate-500">No transcript available</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {messages.map((msg, index) => {
                              const isAgent = msg.role === 'agent';
                              return (
                                <div
                                  key={index}
                                  className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                                      isAgent
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'bg-indigo-600 text-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                      <span
                                        className={`text-xs font-medium ${
                                          isAgent ? 'text-slate-600' : 'text-indigo-100'
                                        }`}
                                      >
                                        {isAgent ? 'Agent' : 'User'}
                                      </span>
                                      <span
                                        className={`text-xs ${
                                          isAgent ? 'text-slate-500' : 'text-indigo-200'
                                        }`}
                                      >
                                        {formatTimeInCall(msg.time_in_call_secs)}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-sm leading-relaxed ${
                                        isAgent ? 'text-slate-900' : 'text-white'
                                      }`}
                                    >
                                      {msg.message}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Average Rating Display */}
                      {(() => {
                        const avgRating = calculateAverageRating(call.feedback);
                        return (
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                                  Average Rating
                                </h4>
                                {avgRating !== null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                          key={star}
                                          className={`w-5 h-5 ${
                                            star <= Math.round(avgRating)
                                              ? 'text-yellow-400 fill-yellow-400'
                                              : 'text-slate-300'
                                          }`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                    <span className="text-lg font-semibold text-slate-900">
                                      {avgRating.toFixed(1)}
                                    </span>
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
                        );
                      })()}

                      {/* Rating Form */}
                      <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h4 className="text-sm font-semibold text-slate-900 mb-4">
                          Rate This Call
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Rating
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <svg
                                    className={`w-8 h-8 ${
                                      star <= rating
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-slate-300 hover:text-yellow-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="comment"
                              className="block text-sm font-medium text-slate-700 mb-2"
                            >
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
                          <h4 className="text-sm font-semibold text-slate-900 mb-4">
                            All Ratings
                          </h4>
                          <div className="space-y-4">
                            {call.feedback.map((feedback) => (
                              <div
                                key={feedback.id}
                                className="bg-white rounded-lg border border-slate-200 p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= feedback.rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-slate-300'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                    <span className="text-sm font-medium text-slate-900">
                                      {feedback.rating}/5
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                                {feedback.comment && (
                                  <p className="text-sm text-slate-600 mt-2">{feedback.comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right Sidebar Metadata */}
            {call && (
              <div className="w-full lg:w-64 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Metadata
                </h4>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Date
                    </dt>
                    <dd className="text-sm text-slate-900">{formatDate(call.startTime)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Duration
                    </dt>
                    <dd className="text-sm text-slate-900">{formatDuration(call.callDurationSecs)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      LLM Cost
                    </dt>
                    <dd className="text-sm text-slate-900">{formatCurrency(call.llmPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Call Charge
                    </dt>
                    <dd className="text-sm text-slate-900">
                      {call.callCharge !== null ? `${call.callCharge} credits` : 'N/A'}
                    </dd>
                  </div>
                  {(() => {
                    const avgRating = calculateAverageRating(call.feedback);
                    if (avgRating !== null) {
                      return (
                        <div>
                          <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Average Rating
                          </dt>
                          <dd className="text-sm text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{avgRating.toFixed(1)}</span>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= Math.round(avgRating)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-slate-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </dd>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

