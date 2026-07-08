/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { setInteractionsList, setError, setLoading } from "../store";
import {
  Calendar,
  Clock,
  User,
  Users,
  MessageSquare,
  Bookmark,
  Share2,
  ThumbsUp,
  RotateCcw
} from "lucide-react";

interface InteractionHistoryProps {
  onRefreshHistory: () => void;
}

export default function InteractionHistory({ onRefreshHistory }: InteractionHistoryProps) {
  const dispatch = useDispatch();
  const interactions = useSelector((state: RootState) => state.crm.interactionsList);
  const isLoading = useSelector((state: RootState) => state.crm.isLoading);

  const handleResetDb = async () => {
    if (!window.confirm("Are you sure you want to reset the interaction records database to default seed data?")) {
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const response = await fetch("/api/interactions/reset", { method: "POST" });
      const result = await response.json();
      if (result.status === "success") {
        dispatch(setInteractionsList(result.data));
      } else {
        dispatch(setError("Failed to reset database."));
      }
    } catch (err: any) {
      dispatch(setError(err.message || "Network error."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Meeting":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Call":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Email":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "Lunch & Learn":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Web Conference":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getSentimentBadgeColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Neutral":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Mixed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Negative":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div id="interaction-history-container" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Bookmark className="text-blue-500" size={16} />
            HCP Logged Interactions Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulated CRM records. Form submissions and AI logs are appended dynamically to this datastore.
          </p>
        </div>
        <button
          onClick={handleResetDb}
          disabled={isLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200 transition cursor-pointer"
        >
          <RotateCcw size={12} />
          Reset Datastore to Seeds
        </button>
      </div>

      {/* History Grid */}
      {interactions.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
          <MessageSquare className="mx-auto text-slate-400 mb-2" size={24} />
          <p className="text-sm text-slate-600 font-medium">No logged interactions found.</p>
          <p className="text-xs text-slate-400 mt-0.5">Submit the form or use the AI Assistant on the right to log your first medical encounter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-1">
          {interactions.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition space-y-3 relative group"
            >
              {/* Card Title & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-100">
                    <User size={13} />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{item.hcpName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getTypeBadgeColor(item.interactionType)}`}>
                    {item.interactionType}
                  </span>
                </div>
                
                {/* Sentiment & Date info */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSentimentBadgeColor(item.sentiment)}`}>
                    Sentiment: {item.sentiment}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              {/* Topics block */}
              <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Detailing Summary Note:
                </span>
                {item.topicsDiscussed || <span className="italic text-slate-400">No summary note recorded.</span>}
              </div>

              {/* Collateral & Attendees list */}
              <div className="flex flex-col sm:flex-row gap-4 text-xs">
                {/* Attendees */}
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Users size={11} />
                    Other Attendees:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.attendees && item.attendees.length > 0 ? (
                      item.attendees.map((attendee) => (
                        <span key={attendee} className="px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 text-[10px]">
                          {attendee}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">None</span>
                    )}
                  </div>
                </div>

                {/* Collaterals & Samples */}
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Share2 size={11} />
                    Collaterals & Samples:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.materialsShared && item.materialsShared.map((mat) => (
                      <span key={mat} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px]">
                        {mat}
                      </span>
                    ))}
                    {(item as any).samplesDistributed && (item as any).samplesDistributed.map((sample: string) => (
                      <span key={sample} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px]">
                        {sample}
                      </span>
                    ))}
                    {(!item.materialsShared || item.materialsShared.length === 0) && (!(item as any).samplesDistributed || (item as any).samplesDistributed.length === 0) && (
                      <span className="text-slate-400 italic text-[10px]">None distributed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Outcomes block if exists */}
              {(item as any).outcomes && (
                <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Outcomes:
                  </span>
                  {(item as any).outcomes}
                </div>
              )}

              {/* Suggested Follow-up banner */}
              {item.suggestedFollowUp && (
                <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded flex items-start gap-2 text-xs">
                  <ThumbsUp className="text-blue-500 shrink-0 mt-0.5" size={13} />
                  <div>
                    <span className="font-semibold text-blue-700">Follow-up Action / Suggested CRM Target:</span>{" "}
                    <span className="text-slate-600">{item.suggestedFollowUp}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
