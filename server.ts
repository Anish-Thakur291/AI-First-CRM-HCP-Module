import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory DB for simulated CRM data
interface HCPInteraction {
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

const interactionsDb: HCPInteraction[] = [
  {
    id: "1",
    hcpName: "Dr. Amanda Smith",
    interactionType: "Meeting",
    date: "2026-07-06",
    time: "10:30 AM",
    attendees: ["Sarah Jenkins (Medical Liaison)"],
    topicsDiscussed: "Discussed clinical efficacy data for Prodo-X in cardiovascular patients. She raised questions about pediatric contraindications. Expressed interest in receiving the new clinical reprints.",
    sentiment: "Positive",
    materialsShared: ["Clinical Reprint", "Prodo-X Brochure"],
    suggestedFollowUp: "Send pediatric safety brochure and coordinate a follow-up call with the Medical Liaison.",
    loggedAt: "2026-07-06T10:30:00.000Z"
  },
  {
    id: "2",
    hcpName: "Dr. Rajesh Patel",
    interactionType: "Call",
    date: "2026-07-07",
    time: "02:15 PM",
    attendees: [],
    topicsDiscussed: "Brief check-in call. Confirmed receipt of samples. He is currently prescribing Prodo-X to mild-to-moderate cases and reports favorable patient adherence. He requested another batch of samples.",
    sentiment: "Positive",
    materialsShared: ["Sample Pack v2"],
    suggestedFollowUp: "Deliver sample batch next week during field visits.",
    loggedAt: "2026-07-07T14:15:00.000Z"
  }
];

// Lazy initialize Gemini client
let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI interactions will fallback to simulated responses.");
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// API Endpoints
// 1. Get logged interactions
app.get("/api/interactions", (req, res) => {
  res.json({ status: "success", data: interactionsDb });
});

// 2. Log a new interaction
app.post("/api/interactions", (req, res) => {
  const { hcpName, interactionType, date, time, attendees, topicsDiscussed, sentiment, materialsShared, samplesDistributed, outcomes, suggestedFollowUp } = req.body;
  
  if (!hcpName) {
    return res.status(400).json({ error: "HCP Name is required." });
  }

  const newInteraction: HCPInteraction = {
    id: String(Date.now()),
    hcpName,
    interactionType: interactionType || "Meeting",
    date: date || new Date().toISOString().split('T')[0],
    time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    attendees: Array.isArray(attendees) ? attendees : [],
    topicsDiscussed: topicsDiscussed || "",
    sentiment: sentiment || "Neutral",
    materialsShared: Array.isArray(materialsShared) ? materialsShared : [],
    samplesDistributed: Array.isArray(samplesDistributed) ? samplesDistributed : [],
    outcomes: outcomes || "",
    suggestedFollowUp,
    loggedAt: new Date().toISOString()
  };

  interactionsDb.unshift(newInteraction);
  res.status(201).json({ status: "success", data: newInteraction });
});

// 3. Clear/Reset interactions to defaults
app.post("/api/interactions/reset", (req, res) => {
  interactionsDb.length = 0;
  interactionsDb.push(
    {
      id: "1",
      hcpName: "Dr. Amanda Smith",
      interactionType: "Meeting",
      date: "2026-07-06",
      time: "10:30 AM",
      attendees: ["Sarah Jenkins (Medical Liaison)"],
      topicsDiscussed: "Discussed clinical efficacy data for Prodo-X in cardiovascular patients. She raised questions about pediatric contraindications. Expressed interest in receiving the new clinical reprints.",
      sentiment: "Positive",
      materialsShared: ["Clinical Reprint", "Prodo-X Brochure"],
      suggestedFollowUp: "Send pediatric safety brochure and coordinate a follow-up call with the Medical Liaison.",
      loggedAt: "2026-07-06T10:30:00.000Z"
    },
    {
      id: "2",
      hcpName: "Dr. Rajesh Patel",
      interactionType: "Call",
      date: "2026-07-07",
      time: "02:15 PM",
      attendees: [],
      topicsDiscussed: "Brief check-in call. Confirmed receipt of samples. He is currently prescribing Prodo-X to mild-to-moderate cases and reports favorable patient adherence. He requested another batch of samples.",
      sentiment: "Positive",
      materialsShared: ["Sample Pack v2"],
      suggestedFollowUp: "Deliver sample batch next week during field visits.",
      loggedAt: "2026-07-07T14:15:00.000Z"
    }
  );
  res.json({ status: "success", data: interactionsDb });
});

// 4. Parse interaction via Gemini AI
app.post("/api/parse-interaction", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Input text is required." });
  }

  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY. Falling back to rule-based mock parsing.");
    return res.json(mockParsingEngine(text));
  }

  try {
    const ai = getGenAI();
    const prompt = `You are an expert AI Life Science assistant supporting pharmaceutical and medical field sales representatives. 
The representative has provided an unstructured interaction summary or a voice note transcription about a medical interaction with a Healthcare Professional (HCP).

Your task is to analyze the input text and extract structured information to populate a Customer Relationship Management (CRM) log form.

INPUT TEXT:
"${text}"

Extract the following:
- hcpName: Name of the physician (e.g., "Dr. Smith", "Dr. Rajesh Patel").
- interactionType: Categorize as: "Meeting", "Call", "Email", "Lunch & Learn", "Web Conference", or "Other".
- date: Identify the date. If not mentioned, return current date: "${new Date().toISOString().split('T')[0]}". Format as YYYY-MM-DD.
- time: Identify the time. If not mentioned, return current time formatted as e.g., "10:30 AM" or "02:15 PM".
- attendees: Extract other participants besides the doctor and the rep. Return as an array of strings.
- topicsDiscussed: Extract what was detailed or discussed (clinical data, safety, samples, feedback, dosing, etc.). Keep it descriptive.
- sentiment: Evaluate the HCP's sentiment. Choose exactly one: "Positive", "Neutral", "Negative", "Mixed".
- materialsShared: Extract physical or digital items distributed, e.g., ["Brochure", "Clinical Reprint", "Sample Pack", "Co-pay Card"].
- suggestedFollowUp: Provide a clinical or sales follow-up recommendation (e.g., "Email pediatric trial results", "Schedule meeting next month").
- chatResponse: Create a supportive, informative response to the sales rep summarizing what was auto-extracted and providing immediate field-rep advice or compliant follow-up hints (max 3 sentences). Use bold formatting for emphasis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hcpName: { type: Type.STRING, description: "Name of the HCP. If not found, return empty string." },
            interactionType: { type: Type.STRING, description: "One of: Meeting, Call, Email, Lunch & Learn, Web Conference, Other. Default 'Meeting'." },
            date: { type: Type.STRING, description: "YYYY-MM-DD date" },
            time: { type: Type.STRING, description: "Time of day (e.g. 10:30 AM)" },
            attendees: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of other attendees mentioned"
            },
            topicsDiscussed: { type: Type.STRING, description: "Core topics, products, or questions discussed" },
            sentiment: { type: Type.STRING, description: "Exactly one of: Positive, Neutral, Negative, Mixed" },
            materialsShared: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Items shared like brochures, clinical papers, safety guides, samples"
            },
            suggestedFollowUp: { type: Type.STRING, description: "Proposed next action for CRM follow-up" },
            chatResponse: { type: Type.STRING, description: "A friendly, professional sales assistant feedback response" }
          },
          required: ["hcpName", "interactionType", "date", "time", "attendees", "topicsDiscussed", "sentiment", "materialsShared", "suggestedFollowUp", "chatResponse"]
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({ status: "success", data: parsedData });

  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    // Graceful fallback to rule-based mock engine
    return res.json({
      status: "fallback",
      error: error.message,
      data: mockParsingEngine(text).data
    });
  }
});

// Simple regex and rule-based mock parsing engine for offline/fallback mode
function mockParsingEngine(text: string) {
  const lowercase = text.toLowerCase();
  
  let hcpName = "Dr. Smith";
  if (lowercase.includes("dr. patel") || lowercase.includes("patel")) hcpName = "Dr. Patel";
  else if (lowercase.includes("dr. amanda") || lowercase.includes("amanda smith")) hcpName = "Dr. Amanda Smith";
  else if (lowercase.includes("dr. chen")) hcpName = "Dr. Chen";
  else if (lowercase.includes("dr. davis")) hcpName = "Dr. Davis";
  else {
    const docMatch = text.match(/Dr\.\s+[A-Z][a-zA-Z]+/);
    if (docMatch) hcpName = docMatch[0];
  }

  let interactionType = "Meeting";
  if (lowercase.includes("call") || lowercase.includes("phoned") || lowercase.includes("telephoned")) interactionType = "Call";
  else if (lowercase.includes("email") || lowercase.includes("emailed") || lowercase.includes("sent a message")) interactionType = "Email";
  else if (lowercase.includes("lunch")) interactionType = "Lunch & Learn";
  else if (lowercase.includes("web") || lowercase.includes("zoom") || lowercase.includes("teams")) interactionType = "Web Conference";

  let sentiment = "Neutral";
  if (lowercase.includes("positive") || lowercase.includes("great") || lowercase.includes("love") || lowercase.includes("good") || lowercase.includes("happy") || lowercase.includes("efficacy")) {
    sentiment = "Positive";
  } else if (lowercase.includes("hesitant") || lowercase.includes("concerned") || lowercase.includes("skeptical") || lowercase.includes("negative") || lowercase.includes("doubt")) {
    sentiment = "Mixed";
  }

  const materialsShared: string[] = [];
  if (lowercase.includes("brochure") || lowercase.includes("brochures")) materialsShared.push("Prodo-X Brochure");
  if (lowercase.includes("reprint") || lowercase.includes("study") || lowercase.includes("paper")) materialsShared.push("Clinical Reprint");
  if (lowercase.includes("card") || lowercase.includes("co-pay")) materialsShared.push("Co-pay Savings Card");

  const samplesDistributed: string[] = [];
  if (lowercase.includes("sample") || lowercase.includes("samples")) {
    samplesDistributed.push("Sample Pack v2");
  }

  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    status: "success",
    data: {
      hcpName,
      interactionType,
      date,
      time,
      attendees: lowercase.includes("ms. jenkins") || lowercase.includes("sarah") ? ["Sarah Jenkins (Medical Liaison)"] : [],
      topicsDiscussed: text,
      sentiment,
      materialsShared,
      samplesDistributed,
      outcomes: "Discussed general efficacy and safety indications.",
      suggestedFollowUp: `Follow up with ${hcpName} regarding product information and schedule another touchpoint next month.`,
      chatResponse: `✅ **Interaction logged successfully!** I have extracted the details for **${hcpName}** with a **${sentiment}** sentiment. The form fields have been populated. Would you like me to schedule a follow-up action?`
    }
  };
}

// Vite and Static Assets Serving Setup
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProd) {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${isProd ? "production" : "development"} mode`);
  });
}

startServer();
