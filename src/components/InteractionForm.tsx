/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  updateFormField,
  addAttendee,
  removeAttendee,
  toggleMaterialShared,
  toggleSampleDistributed,
  resetForm,
  addLoggedInteraction,
  setLoading,
  setError
} from "../store";
import {
  User,
  Calendar,
  Clock,
  Plus,
  X,
  FileText,
  Mic,
  Smile,
  BookOpen,
  Send,
  RefreshCw,
  Search,
  Package,
  Sparkles,
  HelpCircle
} from "lucide-react";

interface InteractionFormProps {
  onOpenVoiceNote: () => void;
  onRefreshHistory: () => void;
}

export default function InteractionForm({ onOpenVoiceNote, onRefreshHistory }: InteractionFormProps) {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.crm.form);
  const isLoading = useSelector((state: RootState) => state.crm.isLoading);

  // Popover selectors for materials and samples
  const [showMaterialsPopover, setShowMaterialsPopover] = useState(false);
  const [showSamplesPopover, setShowSamplesPopover] = useState(false);

  const handleFieldChange = (field: keyof typeof form, value: any) => {
    dispatch(updateFormField({ field, value }));
  };

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addAttendee());
  };

  const handleKeyPressAttendee = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dispatch(addAttendee());
    }
  };

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hcpName.trim()) {
      alert("HCP Name is required to log an interaction.");
      return;
    }

    dispatch(setLoading(true));
    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hcpName: form.hcpName,
          interactionType: form.interactionType,
          date: form.date,
          time: form.time,
          attendees: form.attendeesList,
          topicsDiscussed: form.topicsDiscussed,
          sentiment: form.sentiment,
          materialsShared: form.materialsShared,
          samplesDistributed: form.samplesDistributed,
          outcomes: form.outcomes,
          suggestedFollowUp: form.suggestedFollowUp
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        dispatch(addLoggedInteraction(result.data));
        dispatch(resetForm());
        onRefreshHistory();
      } else {
        dispatch(setError(result.error || "Failed to log interaction."));
      }
    } catch (err: any) {
      dispatch(setError(err.message || "Network error."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const availableMaterials = [
    "Prodo-X Brochure",
    "Clinical Reprint",
    "Safety Contraindications Sheet",
    "Co-pay Savings Card"
  ];

  const availableSamples = [
    "Sample Pack v2",
    "Starter Pack (5mg)",
    "Starter Pack (10mg)",
    "OncoBoost Phase III PDF"
  ];

  const suggestedFollowUpsList = [
    "Schedule follow-up meeting in 2 weeks",
    "Send OncoBoost Phase III PDF",
    "Add Dr. Sharma to advisory board invite list"
  ];

  const handleSuggestedClick = (text: string) => {
    const currentText = form.suggestedFollowUp.trim();
    if (currentText) {
      if (!currentText.includes(text)) {
        handleFieldChange("suggestedFollowUp", `${currentText}\n- ${text}`);
      }
    } else {
      handleFieldChange("suggestedFollowUp", `- ${text}`);
    }
  };

  return (
    <div id="log-interaction-panel" className="space-y-4">
      {/* Title block outside card as per screenshot */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          Log HCP Interaction
        </h2>
        <button
          onClick={() => dispatch(resetForm())}
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          title="Reset Form"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Main Form Card */}
      <form
        id="hcp-form"
        onSubmit={handleLogInteraction}
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5"
      >
        {/* Interaction Details header */}
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-700">
            Interaction Details
          </h3>
        </div>

        {/* Form Fields Grid */}
        <div className="space-y-4">
          {/* Row 1: HCP Name & Interaction Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hcp-name" className="block text-xs font-semibold text-slate-600 mb-1">
                HCP Name
              </label>
              <div className="relative">
                <input
                  id="hcp-name"
                  type="text"
                  placeholder="Search or select HCP..."
                  value={form.hcpName}
                  onChange={(e) => handleFieldChange("hcpName", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="interaction-type" className="block text-xs font-semibold text-slate-600 mb-1">
                Interaction Type
              </label>
              <select
                id="interaction-type"
                value={form.interactionType}
                onChange={(e) => handleFieldChange("interactionType", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                <option value="Meeting">Meeting</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Lunch & Learn">Lunch & Learn</option>
                <option value="Web Conference">Web Conference</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="interaction-date" className="block text-xs font-semibold text-slate-600 mb-1">
                Date
              </label>
              <div className="relative flex items-center">
                <input
                  id="interaction-date"
                  type="text"
                  placeholder="19-04-2025"
                  value={form.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <Calendar size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="interaction-time" className="block text-xs font-semibold text-slate-600 mb-1">
                Time
              </label>
              <div className="relative flex items-center">
                <input
                  id="interaction-time"
                  type="text"
                  placeholder="19:36"
                  value={form.time}
                  onChange={(e) => handleFieldChange("time", e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <Clock size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Attendees input */}
          <div>
            <label htmlFor="attendee-input" className="block text-xs font-semibold text-slate-600 mb-1">
              Attendees
            </label>
            <div className="flex gap-2">
              <input
                id="attendee-input"
                type="text"
                placeholder="Enter names or search..."
                value={form.attendeesInput}
                onChange={(e) => handleFieldChange("attendeesInput", e.target.value)}
                onKeyDown={handleKeyPressAttendee}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <button
                id="add-attendee-btn"
                type="button"
                onClick={handleAddAttendee}
                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center transition border border-slate-200 cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Attendees list rendering */}
            {form.attendeesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.attendeesList.map((attendee) => (
                  <span
                    key={attendee}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {attendee}
                    <button
                      type="button"
                      onClick={() => dispatch(removeAttendee(attendee))}
                      className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Topics Discussed Textarea */}
          <div>
            <label htmlFor="topics-discussed" className="block text-xs font-semibold text-slate-600 mb-1">
              Topics Discussed
            </label>
            <div className="relative">
              <textarea
                id="topics-discussed"
                rows={4}
                placeholder="Enter key discussion points..."
                value={form.topicsDiscussed}
                onChange={(e) => handleFieldChange("topicsDiscussed", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-y leading-relaxed pr-10"
              />
              {/* Mic Icon inside Topics Discussed bottom-right */}
              <button
                type="button"
                onClick={onOpenVoiceNote}
                className="absolute right-3 bottom-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Open Voice Summary Mode"
              >
                <Mic size={16} />
              </button>
            </div>
          </div>

          {/* Summarize from Voice Note Pill Button */}
          <div>
            <button
              id="voice-note-trigger"
              type="button"
              onClick={onOpenVoiceNote}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] hover:bg-slate-200/80 text-xs text-slate-600 font-semibold rounded-full border border-slate-200/80 transition cursor-pointer"
            >
              <Sparkles size={13} className="text-blue-500" />
              Summarize from Voice Note (Requires Consent)
            </button>
          </div>

          {/* Materials Shared & Samples Distributed Sub-boxes */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Materials Shared / Samples Distributed
            </h4>

            {/* Box 1: Materials Shared */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Materials Shared</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMaterialsPopover(!showMaterialsPopover);
                    setShowSamplesPopover(false);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition cursor-pointer"
                >
                  <Search size={12} />
                  Search/Add
                </button>
              </div>

              {/* Popover Selection Box */}
              {showMaterialsPopover && (
                <div className="absolute right-3 top-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 z-10 w-64 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">Select Materials</div>
                  {availableMaterials.map((m) => {
                    const isSelected = form.materialsShared.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => dispatch(toggleMaterialShared(m))}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between ${
                          isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span>{m}</span>
                        {isSelected && <X size={12} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Materials Selected Content */}
              <div className="text-xs text-slate-500">
                {form.materialsShared.length === 0 ? (
                  <span>No materials added.</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {form.materialsShared.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold flex items-center gap-1"
                      >
                        {item}
                        <button type="button" onClick={() => dispatch(toggleMaterialShared(item))} className="hover:text-blue-900">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Samples Distributed */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Samples Distributed</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSamplesPopover(!showSamplesPopover);
                    setShowMaterialsPopover(false);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition cursor-pointer"
                >
                  <Package size={12} />
                  Add Sample
                </button>
              </div>

              {/* Popover Selection Box */}
              {showSamplesPopover && (
                <div className="absolute right-3 top-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 z-10 w-64 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">Select Samples</div>
                  {availableSamples.map((s) => {
                    const isSelected = form.samplesDistributed.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => dispatch(toggleSampleDistributed(s))}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between ${
                          isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span>{s}</span>
                        {isSelected && <X size={12} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Samples Selected Content */}
              <div className="text-xs text-slate-500">
                {form.samplesDistributed.length === 0 ? (
                  <span>No samples added.</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {form.samplesDistributed.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold flex items-center gap-1"
                      >
                        {item}
                        <button type="button" onClick={() => dispatch(toggleSampleDistributed(item))} className="hover:text-indigo-900">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Observed/Inferred HCP Sentiment Radio Row */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Observed/Inferred HCP Sentiment
            </label>
            <div id="sentiment-selector" className="flex items-center gap-6">
              {["Positive", "Neutral", "Negative"].map((sent) => {
                const isSelected = form.sentiment === sent;
                return (
                  <label key={sent} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="sentiment"
                      checked={isSelected}
                      onChange={() => handleFieldChange("sentiment", sent)}
                      className="h-3.5 w-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span>{sent}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Outcomes Textarea */}
          <div>
            <label htmlFor="outcomes" className="block text-xs font-semibold text-slate-600 mb-1">
              Outcomes
            </label>
            <textarea
              id="outcomes"
              rows={2}
              placeholder="Key outcomes or agreements..."
              value={form.outcomes}
              onChange={(e) => handleFieldChange("outcomes", e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-y leading-relaxed"
            />
          </div>

          {/* Follow-up Actions Textarea (mapped to suggestedFollowUp) */}
          <div>
            <label htmlFor="follow-up-actions" className="block text-xs font-semibold text-slate-600 mb-1">
              Follow-up Actions
            </label>
            <textarea
              id="follow-up-actions"
              rows={2}
              placeholder="Enter next steps or tasks..."
              value={form.suggestedFollowUp}
              onChange={(e) => handleFieldChange("suggestedFollowUp", e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-y leading-relaxed"
            />
          </div>

          {/* AI Suggested Follow-ups text triggers as links */}
          <div className="pt-1">
            <span className="block text-[11px] font-bold text-slate-500 mb-1">
              AI Suggested Follow-ups:
            </span>
            <div className="space-y-1 flex flex-col items-start">
              {suggestedFollowUpsList.map((suggest) => (
                <button
                  key={suggest}
                  type="button"
                  onClick={() => handleSuggestedClick(suggest)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left transition font-medium cursor-pointer"
                >
                  + {suggest}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Log Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            id="log-interaction-submit"
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin" size={14} />
            ) : (
              <Send size={14} />
            )}
            Log HCP Record
          </button>
        </div>
      </form>
    </div>
  );
}
