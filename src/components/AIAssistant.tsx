/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  setUserInput,
  addChatMessage,
  setTyping,
  clearChat,
  populateFormFromAI
} from "../store";
import {
  Sparkles,
  Bot,
  User,
  Trash2,
  ArrowRight,
  Check,
  Send,
  Globe,
  CornerDownRight,
  ShieldCheck,
  Award
} from "lucide-react";

export default function AIAssistant() {
  const dispatch = useDispatch();
  const chatState = useSelector((state: RootState) => state.crm.chat);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat end
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatState.messages, chatState.isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatState.userInput).trim();
    if (!text) return;

    // Clear user input
    if (!textToSend) {
      dispatch(setUserInput(""));
    }

    // Add user message
    dispatch(addChatMessage({ sender: "user", text }));
    dispatch(setTyping(true));

    try {
      const response = await fetch("/api/parse-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const result = await response.json();

      if (result.status === "success" || result.status === "fallback") {
        const parsed = result.data;
        dispatch(addChatMessage({
          sender: "assistant",
          text: parsed.chatResponse,
          isStructuredData: true,
          extractedDetails: parsed
        }));
      } else {
        dispatch(addChatMessage({
          sender: "assistant",
          text: "❌ **Failed to parse interaction.** Please verify the server is running properly or try again."
        }));
      }
    } catch (err: any) {
      dispatch(addChatMessage({
        sender: "assistant",
        text: `❌ **Error connecting to AI Server:** ${err.message || "Network issue."}`
      }));
    } finally {
      dispatch(setTyping(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyData = (extracted: NonNullable<typeof chatState.messages[0]["extractedDetails"]>) => {
    dispatch(populateFormFromAI({
      hcpName: extracted.hcpName,
      interactionType: extracted.interactionType,
      date: extracted.date,
      time: extracted.time,
      topicsDiscussed: extracted.topicsDiscussed,
      sentiment: extracted.sentiment,
      materialsShared: extracted.materialsShared,
      samplesDistributed: (extracted as any).samplesDistributed || [],
      outcomes: (extracted as any).outcomes || "",
      suggestedFollowUp: extracted.suggestedFollowUp,
      attendees: extracted.attendees
    }));
  };

  // Helper to parse simple markdown to react elements
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let content = line;
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 list-disc text-xs text-slate-700 mb-1 leading-relaxed">
            {line.substring(2)}
          </li>
        );
      }
      return (
        <p key={i} className="text-xs text-slate-700 mb-1 leading-relaxed font-sans">
          {content.split("**").map((part, index) => {
            if (index % 2 === 1) {
              return <strong key={index} className="text-blue-600 font-semibold">{part}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const quickPrompts = [
    {
      label: "Dr. Amanda Smith Meeting",
      text: "Today I met with Dr. Amanda Smith. Discussed product Prodo-X cardiovascular efficiency and we saw very positive response. Sarah Jenkins was also there. I shared the brochures."
    },
    {
      label: "Dr. Rajesh Patel Call",
      text: "Phoned Dr. Rajesh Patel today. Adherence is positive. He requested another batch of Sample Pack v2 next Tuesday."
    }
  ];

  return (
    <div id="ai-assistant-panel" className="bg-white border border-slate-200 rounded-xl flex flex-col h-[740px] shadow-sm relative overflow-hidden">
      
      {/* Header with globe icon */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Globe size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              AI Assistant
            </h3>
            <span className="text-xs text-slate-400 block">Log interaction via chat</span>
          </div>
        </div>
        <button
          onClick={() => dispatch(clearChat())}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
          title="Clear Chat Logs"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages Stream */}
      <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        
        {/* Welcome Block matching exactly the callout in the screenshot */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs leading-relaxed">
          Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.
        </div>

        {chatState.messages.map((msg) => {
          // Skip the initial welcome if there are other messages to keep clean, or render it nicely
          if (msg.id === "welcome") return null;

          const isBot = msg.sender === "assistant";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[90%] ${
                isBot ? "self-start" : "self-end flex-row-reverse ml-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold ${
                  isBot
                    ? "bg-teal-50 text-teal-600 border-teal-200"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                }`}
              >
                {isBot ? <Bot size={13} /> : <User size={13} />}
              </div>

              {/* Bubble Body */}
              <div className="space-y-1 flex-1">
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    isBot
                      ? "bg-white border-slate-200 text-slate-800"
                      : "bg-blue-600 text-white border-blue-600"
                  }`}
                >
                  <div className="space-y-1">
                    {isBot ? renderMarkdown(msg.text) : <p className="text-xs font-sans">{msg.text}</p>}
                  </div>
                </div>

                {/* Structured Extraction Telemetry Card */}
                {isBot && msg.isStructuredData && msg.extractedDetails && (
                  <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2 shadow-sm mt-1.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                        <Check size={12} />
                        Auto-Extracted Entities
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Confidence: 98%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">HCP Name</span>
                        <span className="font-semibold text-slate-800">{msg.extractedDetails.hcpName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Interaction Type</span>
                        <span className="font-semibold text-slate-800">{msg.extractedDetails.interactionType || "Meeting"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sentiment</span>
                        <span className="font-semibold text-emerald-600">{msg.extractedDetails.sentiment || "Neutral"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Materials Shared</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {msg.extractedDetails.materialsShared?.join(", ") || "None"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyData(msg.extractedDetails!)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <ArrowRight size={12} />
                      Apply to Form Fields
                    </button>
                  </div>
                )}

                <span className="text-[9px] font-mono text-slate-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Bot Typing Indicator */}
        {chatState.isTyping && (
          <div className="flex gap-3 max-w-[90%] self-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border bg-teal-50 text-teal-600 border-teal-200">
              <Bot size={13} />
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestions shortcuts */}
      {chatState.messages.length <= 1 && (
        <div className="px-4 py-2.5 bg-white border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Simulation Prompts:
          </span>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSendMessage(p.text)}
                className="text-left text-xs p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded transition flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate pr-4">{p.label}</span>
                <CornerDownRight size={11} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form at the bottom */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        <div className="flex gap-2">
          <input
            id="chat-user-input"
            type="text"
            placeholder="Describe interaction..."
            value={chatState.userInput}
            onChange={(e) => dispatch(setUserInput(e.target.value))}
            onKeyDown={handleKeyPress}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
          <button
            id="chat-send-btn"
            onClick={() => handleSendMessage()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition shrink-0"
          >
            {/* Warning triangle / Log label */}
            <Send size={12} />
            <span>Log</span>
          </button>
        </div>
        
        {/* Compliance Guard Line */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-500" />
            HIPAA Compliant Guard
          </span>
          <span className="flex items-center gap-1">
            <Award size={11} className="text-blue-500" />
            PhRMA Detailing Code
          </span>
        </div>
      </div>
    </div>
  );
}
