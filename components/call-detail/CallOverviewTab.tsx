import type { CallDetail } from './types';
import { calculateAverageRating } from './utils';
import StatusBadge from './StatusBadge';
import StarRating from './StarRating';

interface CallOverviewTabProps {
  call: CallDetail;
}

export default function CallOverviewTab({ call }: CallOverviewTabProps) {
  const avgRating = calculateAverageRating(call.feedback);

  return (
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
            <dd>
              <StatusBadge status={call.callSuccessful} />
            </dd>
          </div>
          {avgRating !== null && (
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Average Rating
              </dt>
              <dd>
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size="sm" />
                  <span className="text-sm font-medium text-slate-900">
                    {avgRating.toFixed(1)} ({call.feedback?.length || 0})
                  </span>
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

