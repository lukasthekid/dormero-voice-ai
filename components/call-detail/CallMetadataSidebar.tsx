import type { CallDetail } from './types';
import { formatDate, formatDuration, formatCurrency, calculateAverageRating } from './utils';
import StarRating from './StarRating';

interface CallMetadataSidebarProps {
  call: CallDetail;
}

export default function CallMetadataSidebar({ call }: CallMetadataSidebarProps) {
  const avgRating = calculateAverageRating(call.feedback);

  return (
    <div className="w-full lg:w-64 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-6">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Metadata</h4>
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        {avgRating !== null && (
          <div>
            <dt className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Average Rating
            </dt>
            <dd className="text-sm text-slate-900">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{avgRating.toFixed(1)}</span>
                <StarRating rating={avgRating} size="sm" />
              </div>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

