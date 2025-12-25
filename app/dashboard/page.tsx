'use client';

import { useState, useEffect, useCallback } from 'react';
import CallDetailPanel from '../../components/CallDetailPanel';

// Type definitions
interface Call {
  id: string;
  conversationId: string;
  agentId: string;
  agentName: string | null;
  startTime: string;
  acceptedTime: string | null;
  endTime: string;
  callDurationSecs: number;
  callSummaryTitle: string | null;
  callSuccessful: string | null;
  messages: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ApiResponse {
  success: boolean;
  calls: Call[];
  pagination: Pagination;
  error?: string;
}

type DatePreset = 'today' | 'last7days' | 'last30days' | 'last90days' | 'custom';

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customUntilDate, setCustomUntilDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Side panel state
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Calculate date ranges
  const getDateRange = useCallback((preset: DatePreset): { fromDate: string | null; untilDate: string | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return {
          fromDate: today.toISOString(),
          untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'last7days':
        return {
          fromDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'last30days':
        return {
          fromDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
          untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'last90days':
        return {
          fromDate: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000).toISOString(),
          untilDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case 'custom':
        return {
          fromDate: customFromDate ? new Date(customFromDate + 'T00:00:00').toISOString() : null,
          untilDate: customUntilDate ? new Date(customUntilDate + 'T23:59:59').toISOString() : null,
        };
      default:
        return { fromDate: null, untilDate: null };
    }
  }, [customFromDate, customUntilDate]);

  // Fetch calls from API
  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { fromDate, untilDate } = getDateRange(datePreset);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (fromDate) {
        params.append('fromDate', fromDate);
      }
      if (untilDate) {
        params.append('untilDate', untilDate);
      }
      
      const response = await fetch(`/api/calls?${params.toString()}`);
      const data: ApiResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch calls');
      }
      
      setCalls(data.calls);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCalls([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [datePreset, customFromDate, customUntilDate, currentPage, pageSize, getDateRange]);

  // Fetch calls when filters or page change
  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Handle preset change
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle custom date changes
  const handleCustomDateChange = (type: 'from' | 'until', value: string) => {
    if (type === 'from') {
      setCustomFromDate(value);
    } else {
      setCustomUntilDate(value);
    }
    setDatePreset('custom');
  };

  // Handle row click
  const handleRowClick = (callId: string) => {
    setSelectedCallId(callId);
    setIsPanelOpen(true);
  };

  // Handle panel close
  const handlePanelClose = () => {
    setIsPanelOpen(false);
    // Keep selectedCallId for smooth transition, clear it after animation
    setTimeout(() => {
      setSelectedCallId(null);
    }, 300);
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  // Format date/time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Call History</h1>
          <p className="mt-2 text-sm text-slate-600">
            View and manage your call logs
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Date Range:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePresetChange('today')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    datePreset === 'today'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handlePresetChange('last7days')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    datePreset === 'last7days'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => handlePresetChange('last30days')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    datePreset === 'last30days'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => handlePresetChange('last90days')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    datePreset === 'last90days'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Last 90 days
                </button>
                <button
                  onClick={() => handlePresetChange('custom')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    datePreset === 'custom'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {datePreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">From:</label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">To:</label>
                  <input
                    type="date"
                    value={customUntilDate}
                    onChange={(e) => handleCustomDateChange('until', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setDatePreset('last30days');
                setCustomFromDate('');
                setCustomUntilDate('');
                setCurrentPage(1);
              }}
              className="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-600">Loading calls...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-600 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">Error loading calls</p>
                <p className="text-sm text-slate-600">{error}</p>
                <button
                  onClick={fetchCalls}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : calls.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-slate-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">No calls found</p>
                <p className="text-sm text-slate-600">Try adjusting your date filters</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Call Start Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Agent Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Messages
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {calls.map((call) => (
                      <tr
                        key={call.id}
                        onClick={() => handleRowClick(call.id)}
                        className="hover:bg-indigo-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatDateTime(call.startTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {call.agentName || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {formatDuration(call.callDurationSecs)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(call.callSuccessful)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {call.messages}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span>
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.totalItems}</span> calls
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={!pagination.hasPrevious}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          pagination.hasPrevious
                            ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                pageNum === pagination.page
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={!pagination.hasNext}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          pagination.hasNext
                            ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Call Detail Side Panel */}
      <CallDetailPanel
        callId={selectedCallId}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
      />
    </div>
  );
}

