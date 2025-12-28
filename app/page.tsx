'use client';

import { useState, useEffect, useCallback } from 'react';
import CallDetailPanel from '../components/CallDetailPanel';
import KPICards from '../components/control-center/KPICards';
import DateFilters from '../components/control-center/DateFilters';
import CallsTable from '../components/control-center/CallsTable';
import { Call, Pagination, KPIResponse, DatePreset } from '../components/control-center/types';
import { getDateRange } from '../components/control-center/utils';
import { api } from '../lib/api-client';

export default function ControlCenterPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // KPI state
  const [kpis, setKpis] = useState<KPIResponse | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  
  // Filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customUntilDate, setCustomUntilDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  // Side panel state
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Calculate date ranges
  const calculateDateRange = useCallback((): { fromDate: string | null; untilDate: string | null } => {
    return getDateRange(datePreset, customFromDate, customUntilDate);
  }, [datePreset, customFromDate, customUntilDate]);

  // Fetch KPIs from API
  const fetchKPIs = useCallback(async () => {
    const { fromDate, untilDate } = calculateDateRange();
    
    // Only fetch KPIs if we have both dates
    if (!fromDate || !untilDate) {
      setKpis(null);
      return;
    }
    
    setKpisLoading(true);
    try {
      const data = await api.getKPIs(fromDate, untilDate);
      setKpis(data);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
      setKpis(null);
    } finally {
      setKpisLoading(false);
    }
  }, [calculateDateRange]);

  // Fetch calls from API
  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { fromDate, untilDate } = calculateDateRange();
      const data = await api.getCalls(
        { fromDate, untilDate },
        { page: currentPage, pageSize }
      );
      
      setCalls(data.calls);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCalls([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [calculateDateRange, currentPage, pageSize]);

  // Fetch calls and KPIs when filters or page change
  useEffect(() => {
    fetchCalls();
    fetchKPIs();
  }, [fetchCalls, fetchKPIs]);

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 transition-all duration-500 ease-out">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Control Center</h1>
          <p className="mt-3 text-base text-slate-700 font-medium">
            View and manage your call logs
          </p>
        </div>

        {/* KPIs */}
        {kpis && (
          <div className="mb-6 transition-all duration-500 ease-out">
            <KPICards kpis={kpis} />
          </div>
        )}

        {/* Loading KPIs indicator */}
        {kpisLoading && !kpis && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-700">Loading KPIs...</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 transition-all duration-500 ease-out">
          <DateFilters
            datePreset={datePreset}
            customFromDate={customFromDate}
            customUntilDate={customUntilDate}
            onPresetChange={handlePresetChange}
            onCustomDateChange={handleCustomDateChange}
            onClearFilters={() => {
              setDatePreset('last30days');
              setCustomFromDate('');
              setCustomUntilDate('');
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Table */}
        <div className="transition-all duration-500 ease-out">
          <CallsTable
            calls={calls}
            pagination={pagination}
            loading={loading}
            error={error}
            onRowClick={handleRowClick}
            onRetry={fetchCalls}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
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
