'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CallDetail, ApiResponse } from './call-detail/types';
import CallOverviewTab from './call-detail/CallOverviewTab';
import CallTranscriptionTab from './call-detail/CallTranscriptionTab';
import CallRatingsTab from './call-detail/CallRatingsTab';
import CallMetadataSidebar from './call-detail/CallMetadataSidebar';

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
    } else if (!isOpen) {
      // Reset state when panel closes
      setCall(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, callId, fetchCallDetails]);

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
        className={`fixed right-0 top-0 h-full w-2/3 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
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
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">Error loading call details</p>
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
                  {activeTab === 'overview' && <CallOverviewTab call={call} />}
                  {activeTab === 'transcription' && <CallTranscriptionTab call={call} />}
                  {activeTab === 'ratings' && (
                    <CallRatingsTab call={call} callId={callId!} onRatingSubmitted={fetchCallDetails} />
                  )}
                </div>
              ) : null}
            </div>

            {/* Right Sidebar Metadata */}
            {call && <CallMetadataSidebar call={call} />}
          </div>
        </div>
      </div>
    </>
  );
}
