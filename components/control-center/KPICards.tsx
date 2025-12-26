import { KPIResponse } from './types';
import { formatAvgDuration } from './utils';

interface KPICardsProps {
  kpis: KPIResponse;
}

export default function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Calls</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {kpis.total_calls.toLocaleString()}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Avg Call Duration</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {formatAvgDuration(kpis.avg_call_duration)}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Avg Call Rating</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {kpis.avg_call_rating !== null 
                ? `${kpis.avg_call_rating.toFixed(1)} ⭐`
                : 'N/A'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

