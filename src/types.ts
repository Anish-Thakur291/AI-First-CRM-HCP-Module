/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  isStructuredData?: boolean;
  extractedDetails?: {
    hcpName?: string;
    interactionType?: string;
    date?: string;
    time?: string;
    attendees?: string[];
    topicsDiscussed?: string;
    sentiment?: string;
    materialsShared?: string[];
    suggestedFollowUp?: string;
  };
}

export interface FormFields {
  hcpName: string;
  interactionType: string;
  date: string;
  time: string;
  attendeesInput: string;
  attendeesList: string[];
  topicsDiscussed: string;
  sentiment: string;
  materialsShared: string[];
  samplesDistributed: string[];
  outcomes: string;
  suggestedFollowUp: string;
}

export interface HCPInteraction {
  id: string;
  hcpName: string;
  interactionType: string;
  date: string;
  time: string;
  attendees: string[];
  topicsDiscussed: string;
  sentiment: string;
  materialsShared: string[];
  samplesDistributed?: string[];
  outcomes?: string;
  suggestedFollowUp?: string;
  loggedAt: string;
}

export interface CRMState {
  form: FormFields;
  chat: {
    messages: ChatMessage[];
    isTyping: boolean;
    userInput: string;
  };
  interactionsList: HCPInteraction[];
  isLoading: boolean;
  error: string | null;
  voiceRecorder: {
    isRecording: boolean;
    recordingTime: number;
    hasConsent: boolean;
    transcribing: boolean;
  };
  currentTab: "crm" | "architecture" | "compliance";
}
