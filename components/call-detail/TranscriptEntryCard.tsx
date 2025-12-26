import type { ExtendedTranscriptEntry } from './types';
import { formatTimeInCall, formatJSON } from './utils';

interface TranscriptEntryCardProps {
  entry: ExtendedTranscriptEntry;
  index: number;
  previousEntry: ExtendedTranscriptEntry | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isGrouped?: boolean; // Whether this message is part of a consecutive group
}

export default function TranscriptEntryCard({
  entry,
  index,
  previousEntry,
  isExpanded,
  onToggleExpanded,
  isGrouped = false,
}: TranscriptEntryCardProps) {
  const isAgent = entry.role === 'agent';
  const hasToolCalls = entry.tool_calls && entry.tool_calls.length > 0;
  const hasToolResults = entry.tool_results && entry.tool_results.length > 0;
  const hasLLMUsage = entry.llm_usage?.model_usage && Object.keys(entry.llm_usage.model_usage).length > 0;
  const hasMetrics = entry.conversation_turn_metrics?.metrics && Object.keys(entry.conversation_turn_metrics.metrics).length > 0;
  const hasTechnicalDetails = hasToolCalls || hasToolResults || hasLLMUsage || hasMetrics;
  const hasMessage = entry.message && entry.message.trim() !== '';
  const isToolOnly = !hasMessage && (hasToolCalls || hasToolResults);

  // Tool-only entries: center-aligned system message
  if (isToolOnly) {
    return (
      <div className="flex justify-center my-4">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 justify-center">
              {hasToolCalls && (
                <>
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">
                    Calling {entry.tool_calls!.length} tool{entry.tool_calls!.length > 1 ? 's' : ''}...
                  </span>
                </>
              )}
              {hasToolResults && !hasToolCalls && (
                <>
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">
                    Received {entry.tool_results!.length} result{entry.tool_results!.length > 1 ? 's' : ''}
                  </span>
                </>
              )}
              {hasTechnicalDetails && (
                <button
                  onClick={onToggleExpanded}
                  className="ml-2 text-amber-600 hover:text-amber-800 transition-colors"
                  title={isExpanded ? 'Hide details' : 'Show details'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {/* Technical details panel for tool-only entries */}
          {isExpanded && hasTechnicalDetails && (
            <div className="mt-2">
              <TechnicalDetailsPanel entry={entry} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular message bubbles
  return (
    <>
      <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-1 ${isGrouped ? 'mb-0.5' : 'mb-3'}`}>
        <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
          {/* Avatar */}
          {!isGrouped && (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isAgent ? 'bg-slate-300' : 'bg-indigo-500'
              }`}
            >
              {isAgent ? (
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
          {isGrouped && <div className="w-8 flex-shrink-0" />}

          {/* Message bubble */}
          <div className="flex flex-col">
            <div
              className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
                isAgent
                  ? 'bg-slate-100 text-slate-900 rounded-tl-sm'
                  : 'bg-indigo-600 text-white rounded-tr-sm'
              } ${entry.interrupted === true ? 'ring-2 ring-amber-400 ring-opacity-50' : ''}`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{entry.message}</p>
              
              {/* Technical details indicator */}
              {hasTechnicalDetails && (
                <button
                  onClick={onToggleExpanded}
                  className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                    isAgent ? 'text-slate-600 hover:text-slate-800' : 'text-indigo-100 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>
              )}
            </div>

            {/* Metadata footer */}
            {!isGrouped && (
              <div className={`flex items-center gap-2 mt-1 text-xs text-slate-500 ${isAgent ? 'justify-start' : 'justify-end'}`}>
                <span>{formatTimeInCall(entry.time_in_call_secs)}</span>
                {entry.source_medium && <span>• via {entry.source_medium}</span>}
                {entry.interrupted === true && (
                  <span className="text-amber-600">• Interrupted</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technical details panel */}
      {isExpanded && hasTechnicalDetails && (
        <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-3`}>
          <div className={`max-w-[85%] sm:max-w-[75%] ${isAgent ? 'pl-10' : 'pr-10'}`}>
            <TechnicalDetailsPanel entry={entry} />
          </div>
        </div>
      )}
    </>
  );
}

function TechnicalDetailsPanel({ entry }: { entry: ExtendedTranscriptEntry }) {
  const hasToolCalls = entry.tool_calls && entry.tool_calls.length > 0;
  const hasToolResults = entry.tool_results && entry.tool_results.length > 0;
  const hasLLMUsage = entry.llm_usage?.model_usage && Object.keys(entry.llm_usage.model_usage).length > 0;
  const hasMetrics = entry.conversation_turn_metrics?.metrics && Object.keys(entry.conversation_turn_metrics.metrics).length > 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      {/* Tool Calls */}
      {hasToolCalls && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tool Calls ({entry.tool_calls!.length})
          </h5>
          <div className="space-y-3">
            {entry.tool_calls!.map((toolCall, toolIdx) => (
              <div key={toolIdx} className="bg-white rounded border border-amber-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-800">
                    {toolCall.tool_name || 'Unknown Tool'}
                  </span>
                  {toolCall.request_id && (
                    <span className="text-xs font-mono text-slate-500">
                      ID: {toolCall.request_id.substring(0, 8)}...
                    </span>
                  )}
                </div>
                {toolCall.params_as_json && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-slate-600 mb-1">Parameters:</div>
                    <pre className="text-xs bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto font-mono text-slate-700">
                      {formatJSON(toolCall.params_as_json)}
                    </pre>
                  </div>
                )}
                {toolCall.tool_details?.url && (
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">URL:</span>{' '}
                    <span className="font-mono">{toolCall.tool_details.url}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool Results */}
      {hasToolResults && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tool Results ({entry.tool_results!.length})
          </h5>
          <div className="space-y-3">
            {entry.tool_results!.map((toolResult, resultIdx) => (
              <div
                key={resultIdx}
                className={`rounded border p-3 ${
                  toolResult.is_error ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-800">
                      {toolResult.tool_name || 'Unknown Tool'}
                    </span>
                    {toolResult.is_error && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Error
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {toolResult.tool_latency_secs !== undefined && (
                      <span className="text-xs text-slate-600">
                        {toolResult.tool_latency_secs.toFixed(3)}s
                      </span>
                    )}
                    {toolResult.request_id && (
                      <span className="text-xs font-mono text-slate-500">
                        {toolResult.request_id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
                {toolResult.result_value && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-slate-600 mb-1">Result:</div>
                    <pre className="text-xs bg-white p-2 rounded border border-slate-200 overflow-x-auto font-mono text-slate-700 max-h-48 overflow-y-auto">
                      {formatJSON(toolResult.result_value)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM Usage */}
      {hasLLMUsage && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            LLM Usage
          </h5>
          <div className="space-y-3">
            {Object.entries(entry.llm_usage!.model_usage!).map(([model, usage]) => {
              const inputTokens = usage.input?.tokens || 0;
              const outputTokens = usage.output_total?.tokens || 0;
              const inputPrice = usage.input?.price || 0;
              const outputPrice = usage.output_total?.price || 0;
              const totalPrice = inputPrice + outputPrice;
              const cacheReadTokens = usage.input_cache_read?.tokens || 0;
              const cacheWriteTokens = usage.input_cache_write?.tokens || 0;

              return (
                <div key={model} className="bg-white rounded border border-indigo-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-800 font-mono">{model}</span>
                    <span className="text-xs font-medium text-slate-900">${totalPrice.toFixed(6)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600">Input:</span>{' '}
                      <span className="font-mono font-medium">{inputTokens.toLocaleString()}</span>
                      {cacheReadTokens > 0 && (
                        <span className="text-slate-500"> (+{cacheReadTokens.toLocaleString()} cache)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-600">Output:</span>{' '}
                      <span className="font-mono font-medium">{outputTokens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Input Cost:</span>{' '}
                      <span className="font-mono">${inputPrice.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Output Cost:</span>{' '}
                      <span className="font-mono">${outputPrice.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation Turn Metrics */}
      {hasMetrics && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Performance Metrics
          </h5>
          <div className="bg-white rounded border border-slate-200 p-3">
            <div className="space-y-1.5">
              {Object.entries(entry.conversation_turn_metrics!.metrics!).map(([metric, data]) => (
                <div key={metric} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-mono">{metric}:</span>
                  <span className="font-medium text-slate-900">{data.elapsed_time?.toFixed(3)}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent Metadata */}
      {entry.agent_metadata && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Agent Metadata
          </h5>
          <div className="bg-white rounded border border-slate-200 p-3">
            <div className="space-y-1.5 text-xs">
              {entry.agent_metadata.agent_id && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Agent ID:</span>
                  <span className="font-mono text-slate-900">{entry.agent_metadata.agent_id}</span>
                </div>
              )}
              {entry.agent_metadata.branch_id && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Branch ID:</span>
                  <span className="font-mono text-slate-900">{entry.agent_metadata.branch_id}</span>
                </div>
              )}
              {entry.agent_metadata.workflow_node_id && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Node ID:</span>
                  <span className="font-mono text-slate-900">{entry.agent_metadata.workflow_node_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
