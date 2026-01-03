'use client';

import Link from 'next/link';
import Script from 'next/script';
import { createElement } from 'react';

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
      {createElement('elevenlabs-convai', { 'agent-id': 'agent_9601ke1qhdwpfzmbqyh917w0ez58' })}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            The "Dormero Viktoria" Project
          </h1>
          <p className="text-lg text-slate-600">
            AI Voice Assistant for Hotel Information
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="space-y-4">
            <p className="text-slate-700 text-center">
              Speak to the AI voice assistant to ask questions about Dormero hotels. 
              Get general information about Dormero or detailed information about hotels in Vienna and Stuttgart.
            </p>
            
            <div className="text-center pt-2 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">
                View the knowledge base at{' '}
                <a 
                  href="https://www.dormero.de/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 font-medium underline"
                >
                  dormero.de
                </a>
              </p>
              <p className="text-sm text-slate-600">
                Monitor call logs and agent performance in the Control Center.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Link
            href="/control-center"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <span>Go to Control Center</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
