import { useState } from 'react';
import type { CallDetail } from './types';
import type { ExtendedTranscriptEntry } from './types';
import { parseExtendedTranscript, getTimeGap } from './utils';
import TranscriptEntryCard from './TranscriptEntryCard';

type ViewFilter = 'all' | 'messages' | 'tools';

interface CallTranscriptionTabProps {
  call: CallDetail;
}

export default function CallTranscriptionTab({ call }: CallTranscriptionTabProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  const entries = parseExtendedTranscript(call.transcript);

  // Check if entry should be shown based on filter
  const shouldShowEntry = (entry: ExtendedTranscriptEntry): boolean => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'messages') {
      return entry.message !== null && entry.message.trim() !== '';
    }
    if (viewFilter === 'tools') {
      return !!(entry.tool_calls && entry.tool_calls.length > 0) || !!(entry.tool_results && entry.tool_results.length > 0);
    }
    return true;
  };

  const toggleExpanded = (index: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Check if entry is part of a consecutive group (same role, within 5 seconds)
  const isGrouped = (entry: ExtendedTranscriptEntry, previousEntry: ExtendedTranscriptEntry | null): boolean => {
    if (!previousEntry) return false;
    if (entry.role !== previousEntry.role) return false;
    const hasMessage = entry.message && entry.message.trim() !== '';
    const prevHasMessage = previousEntry.message && previousEntry.message.trim() !== '';
    if (!hasMessage || !prevHasMessage) return false; // Only group messages with text
    const timeGap = getTimeGap(entry.time_in_call_secs, previousEntry.time_in_call_secs);
    return timeGap !== null && timeGap < 5;
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">No transcript available</p>
      </div>
    );
  }

  const filteredEntries = entries.filter(shouldShowEntry);
  if (filteredEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">No entries match the current filter</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Controls */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Filter:</span>
          <button
            onClick={() => setViewFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewFilter('messages')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewFilter === 'messages'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setViewFilter('tools')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewFilter === 'tools'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tool Operations
          </button>
        </div>
      </div>

      {/* Messenger-style transcript */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-1">
          {filteredEntries.map((entry, filteredIndex) => {
            const actualIndex = entries.indexOf(entry);
            const previousFilteredIndex = filteredIndex > 0 ? filteredIndex - 1 : -1;
            const previousFilteredEntry = previousFilteredIndex >= 0 ? filteredEntries[previousFilteredIndex] : null;
            
            // Find the actual previous entry in the full entries array for time gap calculation
            const actualPreviousIndex = actualIndex > 0 ? actualIndex - 1 : -1;
            const actualPreviousEntry = actualPreviousIndex >= 0 ? entries[actualPreviousIndex] : null;
            
            const isExpanded = expandedEntries.has(actualIndex);
            const grouped = isGrouped(entry, previousFilteredEntry);
            
            // Calculate time gap for divider
            const timeGap = actualPreviousEntry ? getTimeGap(entry.time_in_call_secs, actualPreviousEntry.time_in_call_secs) : null;
            const shouldShowTimeDivider = timeGap !== null && timeGap > 5 && actualPreviousEntry !== null;

            return (
              <div key={actualIndex}>
                {/* Time gap divider */}
                {shouldShowTimeDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                      <span className="text-xs text-slate-500">
                        {timeGap >= 60 ? `${Math.floor(timeGap / 60)}m ${timeGap % 60}s` : `${timeGap}s`} later
                      </span>
                    </div>
                  </div>
                )}
                
                <TranscriptEntryCard
                  entry={entry}
                  index={actualIndex}
                  previousEntry={actualPreviousEntry}
                  isExpanded={isExpanded}
                  onToggleExpanded={() => toggleExpanded(actualIndex)}
                  isGrouped={grouped}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

