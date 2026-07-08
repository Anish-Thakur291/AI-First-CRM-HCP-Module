/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CRMState, FormFields, ChatMessage, HCPInteraction } from "./types";

const initialFormState: FormFields = {
  hcpName: "",
  interactionType: "Meeting",
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  attendeesInput: "",
  attendeesList: [],
  topicsDiscussed: "",
  sentiment: "Neutral",
  materialsShared: [],
  samplesDistributed: [],
  outcomes: "",
  suggestedFollowUp: ""
};

const initialChatMessages: ChatMessage[] = [
  {
    id: "welcome",
    sender: "assistant",
    text: "🤖 **HCP CRM Companion Active**\n\nLog your interaction details here dynamically (e.g., *'Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure'*) or ask for compliance assistance. I will parse it and auto-populate your form fields in real-time!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const initialState: CRMState = {
  form: initialFormState,
  chat: {
    messages: initialChatMessages,
    isTyping: false,
    userInput: ""
  },
  interactionsList: [],
  isLoading: false,
  error: null,
  voiceRecorder: {
    isRecording: false,
    recordingTime: 0,
    hasConsent: false,
    transcribing: false
  },
  currentTab: "crm"
};

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    // Form Reducers
    updateFormField: (
      state,
      action: PayloadAction<{ field: keyof FormFields; value: any }>
    ) => {
      const { field, value } = action.payload;
      (state.form as any)[field] = value;
    },
    addAttendee: (state) => {
      const name = state.form.attendeesInput.trim();
      if (name && !state.form.attendeesList.includes(name)) {
        state.form.attendeesList.push(name);
        state.form.attendeesInput = "";
      }
    },
    removeAttendee: (state, action: PayloadAction<string>) => {
      state.form.attendeesList = state.form.attendeesList.filter(
        (name) => name !== action.payload
      );
    },
    toggleMaterialShared: (state, action: PayloadAction<string>) => {
      const material = action.payload;
      if (state.form.materialsShared.includes(material)) {
        state.form.materialsShared = state.form.materialsShared.filter(
          (m) => m !== material
        );
      } else {
        state.form.materialsShared.push(material);
      }
    },
    toggleSampleDistributed: (state, action: PayloadAction<string>) => {
      const sample = action.payload;
      if (state.form.samplesDistributed.includes(sample)) {
        state.form.samplesDistributed = state.form.samplesDistributed.filter(
          (s) => s !== sample
        );
      } else {
        state.form.samplesDistributed.push(sample);
      }
    },
    resetForm: (state) => {
      state.form = {
        ...initialFormState,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    },
    populateFormFromAI: (state, action: PayloadAction<Partial<FormFields & { attendees: string[], samplesDistributed?: string[] }>>) => {
      const data = action.payload;
      if (data.hcpName !== undefined) state.form.hcpName = data.hcpName;
      if (data.interactionType !== undefined) state.form.interactionType = data.interactionType;
      if (data.date !== undefined) state.form.date = data.date;
      if (data.time !== undefined) state.form.time = data.time;
      if (data.topicsDiscussed !== undefined) state.form.topicsDiscussed = data.topicsDiscussed;
      if (data.sentiment !== undefined) state.form.sentiment = data.sentiment;
      if (data.suggestedFollowUp !== undefined) state.form.suggestedFollowUp = data.suggestedFollowUp;
      if (data.outcomes !== undefined) state.form.outcomes = data.outcomes;
      if (data.attendees !== undefined) {
        state.form.attendeesList = data.attendees;
      }
      if (data.materialsShared !== undefined) {
        state.form.materialsShared = data.materialsShared;
      }
      if (data.samplesDistributed !== undefined) {
        state.form.samplesDistributed = data.samplesDistributed;
      }
    },

    // Chat Reducers
    setUserInput: (state, action: PayloadAction<string>) => {
      state.chat.userInput = action.payload;
    },
    addChatMessage: (state, action: PayloadAction<Omit<ChatMessage, "id" | "timestamp">>) => {
      state.chat.messages.push({
        ...action.payload,
        id: String(Date.now() + Math.random()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.chat.isTyping = action.payload;
    },
    clearChat: (state) => {
      state.chat.messages = [
        {
          id: "welcome",
          sender: "assistant",
          text: "🤖 **HCP CRM Companion Active**\n\nLog your interaction details here dynamically (e.g., *'Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure'*) or ask for compliance assistance. I will parse it and auto-populate your form fields in real-time!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    },

    // Interactions DB list
    setInteractionsList: (state, action: PayloadAction<HCPInteraction[]>) => {
      state.interactionsList = action.payload;
    },
    addLoggedInteraction: (state, action: PayloadAction<HCPInteraction>) => {
      state.interactionsList.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Voice Recorder
    setVoiceRecording: (state, action: PayloadAction<boolean>) => {
      state.voiceRecorder.isRecording = action.payload;
      if (!action.payload) {
        state.voiceRecorder.recordingTime = 0;
      }
    },
    setVoiceRecordingTime: (state, action: PayloadAction<number>) => {
      state.voiceRecorder.recordingTime = action.payload;
    },
    setVoiceConsent: (state, action: PayloadAction<boolean>) => {
      state.voiceRecorder.hasConsent = action.payload;
    },
    setVoiceTranscribing: (state, action: PayloadAction<boolean>) => {
      state.voiceRecorder.transcribing = action.payload;
    },

    // Navigation Tab
    setTab: (state, action: PayloadAction<"crm" | "architecture" | "compliance">) => {
      state.currentTab = action.payload;
    }
  }
});

export const {
  updateFormField,
  addAttendee,
  removeAttendee,
  toggleMaterialShared,
  toggleSampleDistributed,
  resetForm,
  populateFormFromAI,
  setUserInput,
  addChatMessage,
  setTyping,
  clearChat,
  setInteractionsList,
  addLoggedInteraction,
  setLoading,
  setError,
  setVoiceRecording,
  setVoiceRecordingTime,
  setVoiceConsent,
  setVoiceTranscribing,
  setTab
} = crmSlice.actions;

export const store = configureStore({
  reducer: {
    crm: crmSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
