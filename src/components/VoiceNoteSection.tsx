/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  setVoiceRecording,
  setVoiceRecordingTime,
  setVoiceConsent,
  setVoiceTranscribing,
  populateFormFromAI,
  addChatMessage,
  setTyping
} from "../store";
import { Mic, X, AlertTriangle, Play, ShieldCheck, RefreshCw } from "lucide-react";

interface VoiceNoteSectionProps {
  onClose: () => void;
}

export default function VoiceNoteSection({ onClose }: VoiceNoteSectionProps) {
  const dispatch = useDispatch();
  const voiceState = useSelector((state: RootState) => state.crm.voiceRecorder);
  const [selectedSample, setSelectedSample] = useState<number | null>(null);

  const mockSamples = [
    {
      id: 1,
      title: "Dr. Amanda Smith Detailing",
      preview: "Spoke with Dr. Amanda Smith during a lunch meeting...",
      fullText: "Spoke with Dr. Amanda Smith during a lunch meeting. She was very positive about the Prodo-X clinical efficacy results in cardiac rehabilitation, though she asked some questions regarding pediatric contraindications. Sarah Jenkins, our Medical Affairs Liaison, was also present. I shared Prodo-X Brochures and scheduled a follow-up pediatric reprint delivery.",
      duration: "18s"
    },
    {
      id: 2,
      title: "Dr. Rajesh Patel Sample Request",
      preview: "Dr. Rajesh Patel phoned in a positive review...",
      fullText: "Dr. Rajesh Patel gave me a quick phone call today. He's seeing fantastic patient adherence with the initial Prodo-X starters and reports good patient satisfaction. He is out of stock and urgently requested another batch of Sample Pack v2. He wants me to deliver them during next Tuesday's field visits.",
      duration: "12s"
    },
    {
      id: 3,
      title: "Web Consultation with Dr. Chen",
      preview: "Had a Zoom consultation with Dr. Chen about pediatric trials...",
      fullText: "I had an interactive web conference detailing session with Dr. Chen. He has a mixed sentiment and was quite hesitant until he reviews the peer-reviewed pediatric data, especially concerning cardiovascular risks. He requested clinical reprints of our Phase III pediatric studies. I agreed to email those clinical reprints by tomorrow.",
      duration: "24s"
    }
  ];

  // Tick recording time
  useEffect(() => {
    let interval: any;
    if (voiceState.isRecording) {
      interval = setInterval(() => {
        dispatch(setVoiceRecordingTime(voiceState.recordingTime + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [voiceState.isRecording, voiceState.recordingTime, dispatch]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStartSimulate = (sampleId: number) => {
    if (!voiceState.hasConsent) {
      alert("You must obtain and confirm HCP consent prior to recording discussions under pharmaceutical compliance standards.");
      return;
    }
    setSelectedSample(sampleId);
    dispatch(setVoiceRecording(true));
    dispatch(setVoiceRecordingTime(0));
  };

  const handleStopAndTranscribe = async () => {
    if (selectedSample === null) return;
    
    dispatch(setVoiceRecording(false));
    dispatch(setVoiceTranscribing(true));

    const sample = mockSamples.find((s) => s.id === selectedSample);
    if (!sample) return;

    // Send mock/transcribed text to our backend parsing engine!
    try {
      dispatch(setTyping(true));
      
      const response = await fetch("/api/parse-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sample.fullText }),
      });
      const result = await response.json();

      if (result.status === "success" || result.status === "fallback") {
        const parsed = result.data;
        
        // Dispatch form field updates
        dispatch(populateFormFromAI({
          hcpName: parsed.hcpName,
          interactionType: parsed.interactionType,
          date: parsed.date,
          time: parsed.time,
          topicsDiscussed: parsed.topicsDiscussed,
          sentiment: parsed.sentiment,
          materialsShared: parsed.materialsShared,
          samplesDistributed: parsed.samplesDistributed || [],
          outcomes: parsed.outcomes || "",
          suggestedFollowUp: parsed.suggestedFollowUp,
          attendees: parsed.attendees
        }));

        // Append message to AI assistant logs
        dispatch(addChatMessage({
          sender: "user",
          text: `🎙️ *Voice Note Summary:* "${sample.fullText}"`
        }));

        dispatch(addChatMessage({
          sender: "assistant",
          text: parsed.chatResponse,
          isStructuredData: true,
          extractedDetails: parsed
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(setVoiceTranscribing(false));
      dispatch(setTyping(false));
      onClose();
    }
  };

  return (
    <div id="voice-note-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Mic className="text-red-500 animate-pulse" size={18} />
            <h3 className="font-bold text-slate-800 text-base">HCP Voice Note Transcriber</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Compliance Consent Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold block mb-0.5">PhRMA & HIPAA Recording Consent Notice:</span>
              Medical field representatives are strictly required to disclose recording and obtain explicit verbal consent from the Healthcare Professional (HCP) before activating voice logging.
              <label className="flex items-center gap-2 mt-2 font-semibold text-amber-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={voiceState.hasConsent}
                  onChange={(e) => dispatch(setVoiceConsent(e.target.checked))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                I confirm that I have obtained explicit HCP consent to summarize this conversation.
              </label>
            </div>
          </div>

          {/* Recorder Simulation Panel */}
          {voiceState.isRecording ? (
            <div className="bg-slate-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping" />
                <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                  <Mic size={18} />
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-red-500">RECORDING SIMULATION</span>
              <span className="text-2xl font-bold font-mono mt-1 text-slate-800">{formatTime(voiceState.recordingTime)}</span>
              
              {/* Fake waveform animation */}
              <div className="flex items-center justify-center gap-1.5 h-10 my-4">
                {[...Array(12)].map((_, i) => {
                  const height = voiceState.isRecording ? Math.random() * 24 + 4 : 4;
                  return (
                    <div
                      key={i}
                      style={{ height: `${height}px` }}
                      className="w-1 bg-red-500 rounded-full transition-all duration-150"
                    />
                  );
                })}
              </div>

              <button
                onClick={handleStopAndTranscribe}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                Stop & Transcribe with Gemini AI
              </button>
            </div>
          ) : voiceState.transcribing ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <RefreshCw className="text-blue-500 animate-spin mb-4" size={28} />
              <span className="text-sm font-semibold text-slate-700">Gemini AI Model Parsing...</span>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Extracting entities (HCP Name, attendees, clinical products, sentiment, shared brochures) into structured telemetry fields...
              </p>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Select Pre-Recorded Field Summary to Simulate:
              </span>
              <div className="space-y-3">
                {mockSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between hover:border-slate-300 transition"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{sample.title}</span>
                        <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {sample.duration}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">{sample.preview}</p>
                    </div>
                    <button
                      onClick={() => handleStartSimulate(sample.id)}
                      disabled={!voiceState.hasConsent}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs text-white font-medium rounded flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Play size={12} />
                      Simulate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck size={12} />
            Compliant Pipeline (AES-256)
          </span>
          <span>PhRMA Code Detailing Guidelines v4.1</span>
        </div>
      </div>
    </div>
  );
}
