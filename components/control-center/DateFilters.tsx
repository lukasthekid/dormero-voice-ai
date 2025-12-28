import { DatePreset } from './types';
import { CallSuccessful } from '@/generated/prisma/enums';

interface DateFiltersProps {
  datePreset: DatePreset;
  customFromDate: string;
  customUntilDate: string;
  callSuccessful: CallSuccessful | null;
  onPresetChange: (preset: DatePreset) => void;
  onCustomDateChange: (type: 'from' | 'until', value: string) => void;
  onCallSuccessfulChange: (value: CallSuccessful | null) => void;
  onClearFilters: () => void;
}

export default function DateFilters({
  datePreset,
  customFromDate,
  customUntilDate,
  callSuccessful,
  onPresetChange,
  onCustomDateChange,
  onCallSuccessfulChange,
  onClearFilters,
}: DateFiltersProps) {
  return (
    <div className="bg-slate-50/50 rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-slate-900">Date Range:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onPresetChange('today')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  datePreset === 'today'
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => onPresetChange('last7days')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  datePreset === 'last7days'
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => onPresetChange('last30days')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  datePreset === 'last30days'
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
                }`}
              >
                Last 30 days
              </button>
              <button
                onClick={() => onPresetChange('last90days')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  datePreset === 'last90days'
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
                }`}
              >
                Last 90 days
              </button>
              <button
                onClick={() => onPresetChange('custom')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  datePreset === 'custom'
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-900">From:</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => onCustomDateChange('from', e.target.value)}
                  className="px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-slate-400 bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-900">To:</label>
                <input
                  type="date"
                  value={customUntilDate}
                  onChange={(e) => onCustomDateChange('until', e.target.value)}
                  className="px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-slate-400 bg-white"
                />
              </div>
            </div>
          )}

          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>

        {/* Call Status Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
          <label className="text-sm font-semibold text-slate-900">Call Status:</label>
          <select
            value={callSuccessful || ''}
            onChange={(e) => onCallSuccessfulChange(e.target.value === '' ? null : e.target.value as CallSuccessful)}
            className="px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-slate-400 bg-white"
          >
            <option value="">All</option>
            <option value={CallSuccessful.success}>Success</option>
            <option value={CallSuccessful.failure}>Failure</option>
            <option value={CallSuccessful.unknown}>Unknown</option>
          </select>
        </div>
      </div>
    </div>
  );
}

