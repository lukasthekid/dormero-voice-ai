import { Call, Pagination } from './types';
import { formatDuration, formatDateTime } from './utils';
import StatusBadge from '../StatusBadge';
import { CallSuccessful } from '@/generated/prisma/enums';

interface CallsTableProps {
  calls: Call[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  onRowClick: (callId: string) => void;
  onRetry: () => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function CallsTable({
  calls,
  pagination,
  loading,
  error,
  onRowClick,
  onRetry,
  currentPage,
  onPageChange,
}: CallsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-900">Loading calls...</p>
              <p className="text-xs text-slate-500 mt-1">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-900 mb-2">Error loading calls</p>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <button
              onClick={onRetry}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-900 mb-2">No calls found</p>
            <p className="text-sm text-slate-600">Try adjusting your date filters to see more results</p>
          </div>
        </div>
      </div>
    );
  }

  const getBorderColor = (status: CallSuccessful | null) => {
    if (status === CallSuccessful.success) return 'border-l-emerald-500';
    if (status === CallSuccessful.failure) return 'border-l-rose-500';
    return 'border-l-slate-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Call Start Time
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Agent Name
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Duration
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Messages
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {calls.map((call, index) => (
              <tr
                key={call.id}
                onClick={() => onRowClick(call.id)}
                className={`relative border-l-4 ${getBorderColor(call.callSuccessful)} ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                } hover:bg-indigo-50/50 cursor-pointer transition-all duration-200 active:bg-indigo-100/50`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {formatDateTime(call.startTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {call.agentName || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {formatDuration(call.callDurationSecs)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {call.messages}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={call.callSuccessful} />
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
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrevious}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  pagination.hasPrevious
                    ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
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
                      onClick={() => onPageChange(pageNum)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                        pageNum === pagination.page
                          ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onPageChange(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNext}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  pagination.hasNext
                    ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

