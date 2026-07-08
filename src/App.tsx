/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState, setInteractionsList, setError } from "./store";
import Header from "./components/Header";
import InteractionForm from "./components/InteractionForm";
import AIAssistant from "./components/AIAssistant";
import InteractionHistory from "./components/InteractionHistory";
import VoiceNoteSection from "./components/VoiceNoteSection";
import { AlertCircle } from "lucide-react";

function AppContent() {
  const dispatch = useDispatch();
  const error = useSelector((state: RootState) => state.crm.error);
  const [isVoiceNoteOpen, setIsVoiceNoteOpen] = useState(false);

  // Load interactions list on mount
  const refreshHistory = async () => {
    try {
      const response = await fetch("/api/interactions");
      const result = await response.json();
      if (result.status === "success") {
        dispatch(setInteractionsList(result.data));
      } else {
        dispatch(setError("Could not retrieve logged interaction records."));
      }
    } catch (err: any) {
      dispatch(setError("Network error connecting to Express database server."));
    }
  };

  useEffect(() => {
    refreshHistory();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex flex-col font-sans">
      {/* App Header Bar */}
      <Header />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Error Alert Bar */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-rose-800">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-rose-800 flex-1">
              <span className="font-bold">System Error Alert:</span> {error}
            </div>
            <button
              onClick={() => dispatch(setError(null))}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form, History & AI Chat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & History (8 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <InteractionForm
              onOpenVoiceNote={() => setIsVoiceNoteOpen(true)}
              onRefreshHistory={refreshHistory}
            />
            
            <InteractionHistory
              onRefreshHistory={refreshHistory}
            />
          </div>

          {/* Right Column: AI Chat Companion (5 cols on lg, sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <AIAssistant />
          </div>
        </div>
      </main>

      {/* Voice Note Simulation Modal */}
      {isVoiceNoteOpen && (
        <VoiceNoteSection onClose={() => setIsVoiceNoteOpen(false)} />
      )}

      {/* Footer Branding info */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-mono mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 AI-First Life Sciences CRM Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
