# HCP CRM Companion

An AI-First Customer Relationship Management (CRM) application for Life Sciences field representatives to seamlessly log and structure Healthcare Professional (HCP) interactions. Powered by a high-productivity full-stack architecture featuring a React/Redux/Tailwind frontend, an Express proxy server, and Gemini AI-powered natural language detailing extraction.

---

## 🎨 Design & Theme

- **Modern Clean Theme:** Designed in a high-contrast light slate theme, swapping dark mode layouts for beautiful slate, cobalt, and emerald gradients with clean typography and plenty of whitespace.
- **Responsive Layout:** Responsive two-column view. The left-hand panel holds the interactive structured input logging forms and records history datastore. The right-hand column features a sticky, interactive real-time AI Assistant conversational pane.

---

## 🛠 Core Features

### 1. Log HCP Interaction Form
- **Form Fields:** Track HCP Name, Interaction Type (Meeting, Call, Email, Lunch & Learn, Web Conference, etc.), Date, Time, Attendees list, and Detailing Topics.
- **Materials Shared & Samples Distributed:** Embedded custom popovers allowing multiple selection of PhRMA compliant brochures (e.g., *Prodo-X Brochure*, *Clinical Reprint*, *Savings Card*) and physical starters/starter-packs.
- **Observed HCP Sentiment:** Fast radio triggers to instantly document perceived physician response (Positive, Neutral, Negative).
- **Outcomes & Follow-up Actions:** Dedicated feedback textareas to write next actionable steps or agreements.
- **AI Suggested Follow-up Quick-Pills:** Single-click hyperlinks to inject standard next-action proposals like *"Schedule follow-up meeting in 2 weeks"*, *"Send OncoBoost Phase III PDF"*, etc.

### 2. Live AI Assistant Chat Pane
- **Natural Language Parsing:** Input unstructured field narratives (e.g., *"Today I met with Dr. Amanda Smith. Discussed product Prodo-X cardiovascular efficiency and we saw very positive response. Sarah Jenkins was also there. I shared the brochures."*) and tap **Log**.
- **Gemini Structured Extraction:** The system proxies the text server-side to the Gemini API, automatically extracting key entities into a structured payload (HCP Name, Date, Attendees, Sentiment, Materials Shared, and Outcomes).
- **One-Click Apply:** Directly review parsed entities on an interactive telemetry card and click **Apply to Form Fields** to pre-fill the entire log form instantly.

### 3. Voice Note Transcriber Modal
- **Regulatory Consent Guard:** Under PhRMA and HIPAA compliant standards, representatives must confirm obtaining explicit verbal consent from the practitioner before activating the voice summary simulation.
- **Simulation Stream:** Experience interactive voice note recording simulations. Play pre-recorded pharmaceutical field summaries and watch them transcribe and parse dynamically via Gemini AI.

### 4. HCP Logged Interactions Database
- **Local Persistence Store:** Submitting interactions dynamically appends records to the bottom history list, instantly synchronising Redux states with server-side persistent memories.
- **Sentiment & Type Badges:** Color-coded status badges for quick scannability.
- **Reset Datastore:** A quick button to restore seed templates for testing.

---

## 🏗 Full-Stack Architecture

```
 [Field Representative]  --->  [React UI & Redux State Store] 
      (Voice/Chat Text)                (Triggers State Actions)
                                                 |
                                                 v  HTTP POST (JSON)
                                       [Express Proxy Server] 
                                        (Pydantic Validation)
                                                 |
                                                 v  Invokes Graph
                                      [Gemini AI Model Pipeline]
                                                 |
                               +-----------------+-----------------+
                               |                                   |
                               v (Step 1)                          v (Step 2)
                     [Compliance Audit Check]            [Entity Extraction]
                     - Rejects bribes                    - Queries Gemini Pro
                     - Checks FDA guidelines             - Formats into schema
                               |                                   |
                               +-----------------+-----------------+
                                                 |
                                                 v (Step 3)
                                       [React Form Prefills]
                                       (Rep confirms and clicks SAVE)
                                                 |
                                                 v  HTTP POST
                                        [In-Memory Datastore]
                                      (Writes indexed rows & audits)
```

### Frontend (`/src`)
- **React 18 & Vite:** For fast single-page app builds.
- **Redux Toolkit (`@reduxjs/toolkit`):** Drives the central application state machine. Changes in the chatbot feed instantly populate state properties inside form fields, and updating inputs syncs state changes seamlessly.
- **Tailwind CSS:** Modern utility-first CSS styling for highly bespoke, pristine component boundaries.
- **Lucide React:** Beautiful, consistent lightweight iconography.

### Backend (`/server.ts`)
- **Express Server:** Runs on Port 3000 to serve static files and expose server-side endpoints.
- **Server-Side API Proxying:** All Gemini API key calls are made securely server-side to hide keys from client browser DevTools.
- **Fallback Rule-Based Classifier:** Graceful parsing safety net if the Gemini API key is missing or invalid, ensuring the app remains fully functional with mocked fallback summaries.
