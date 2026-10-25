# Gemini AI Travel Guide & Trip Planner Chatbox

An interactive, country-aware AI chatbox powered by **Gemini 3.8 Flash** embedded side-by-side with destination profiles to provide instant personalized travel itineraries, local customs, packing advice, and cultural tips.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following choices were confirmed in the Phase 1 questionnaire and will guide the build:

- **Confirmed Role:** Interactive Travel Guide & Trip Planner (tailored travel tips, must-try foods, 3-day itineraries, cultural etiquette, and useful local phrases).
- **Confirmed Placement:** Embedded side-by-side panel alongside the country details in the Live Explorer view (with responsive collapse/drawer on smaller screens to preserve mobile readability).
- **Confirmed Context Awareness:** The chatbox automatically injects the currently selected country's live demographic data (name, capital, currencies, languages, region, neighbors) into the system prompt context so users can ask contextual questions like *"What should I pack?"* or *"Plan a 3-day itinerary here"* without repeating the country name.

---

## 1. Overview & Core Concept

- **What It Does:** Enhances the Travel Destination Explorer with an AI-powered conversational travel companion. Users can chat with Gemini to explore attractions, cultural norms, dining tips, budgeting advice, and customized trip itineraries directly grounded in the active destination card.
- **Target Audience:** Students, travelers, and geography enthusiasts wanting personalized, contextual insights beyond raw statistics.
- **Key Value:** Transforms static country data into an actionable, tailored trip planning experience with sub-second streaming answers.

---

## 2. User Experience & Visual Design

- **Layout & Composition:**
  - On desktop screens (`lg:` and up), the Live Explorer presents a balanced two-column workspace:
    - **Left / Center Column (7 cols):** The rich atlas Country Card (flags, capitals, area, languages, borders, maps).
    - **Right Column (5 cols):** The dedicated **Gemini AI Travel Guide** card with persistent message thread, quick-action chips, and prompt input.
  - On tablet/mobile screens, the chat panel stacks cleanly below the country card, with a floating toggle button to quickly jump or collapse the chat.
- **Aesthetic Direction & Styling:**
  - Modern Oceanic Slate theme matching the existing design system.
  - Chat bubbles: User messages in crisp sky blue (`bg-sky-600 text-white`); Gemini assistant replies in soft slate card bubbles (`bg-white border border-slate-200 text-slate-800`).
  - Active destination pill at the top of the chat panel displaying current country context (e.g. `📍 Grounded in Japan (Tokyo)`).
- **Quick-Prompt Suggestion Chips:**
  - Contextual one-click prompt buttons to start conversations instantly:
    - 🗺️ *"3-Day Trip Itinerary"*
    - 🍜 *"Must-Try Traditional Foods"*
    - 💡 *"Local Etiquette & Customs"*
    - 🎒 *"Packing & Weather Advice"*
    - 🗣️ *"Essential Local Phrases"*
- **Interactive Feedback & States:**
  - Animated typing/pulsing indicator while Gemini generates responses.
  - Markdown formatting support for bulleted itineraries, bold highlights, and headers.
  - Clear conversation button (`Reset Chat`) when switching countries or starting fresh.
  - Resilient error banner with retry option if an API timeout or connectivity issue occurs.

---

## 3. Key Product Decisions & Trade-Offs

- **Server-Side API Architecture vs. Client-Side SDK:**
  - *Chosen Approach:* Express server (`server.ts`) with `@google/genai` using `gemini-3.8-flash`, proxying requests via `/api/chat`.
  - *Why:* Strict compliance with AI Studio security standards: `GEMINI_API_KEY` stays on the server side (`process.env.GEMINI_API_KEY`) and is never leaked to the browser bundle.
  - *Alternatives Considered:* Client-side SDK calls were rejected because browser API key exposure is insecure and prohibited.
- **Model Selection:**
  - *Chosen Approach:* `gemini-3.8-flash`.
  - *Why:* Recommended model for text/chat tasks; provides near-instant response latency and rich travel knowledge without requiring paid quota gates.
- **Context Injection Strategy:**
  - *Chosen Approach:* Server-side system instruction dynamic template:
    `"You are an expert local travel guide and trip planner for {commonName} (Capital: {capital}, Region: {region}, Currencies: {currencies}, Languages: {languages}). Provide concise, engaging, culturally respectful recommendations."`
  - *Why:* Guarantees high accuracy, prevents hallucination regarding basic geographic facts, and allows terse user questions like *"What's the best season to visit?"* to be answered accurately.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
+─────────────────────────────────────────────────────────────────────────────+
│                           BROWSER (Client Tier)                             │
│                                                                             │
│  [ CountrySearch ] ───> [ CountryCard ] ─── (Active Country Context) ──┐    │
│                                                                        ▼    │
│  [ Gemini Chat Panel ] ◄───────────────────────────────────────────────┘    │
│     ├── Message History State ([user, assistant])                           │
│     ├── Quick Suggestion Chips (Itinerary, Food, Customs)                   │
│     └── Text Input & Send Button                                            │
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │ POST /api/chat
                                       │ { message, countryContext, history }
                                       ▼
+─────────────────────────────────────────────────────────────────────────────+
│                       EXPRESS BACKEND (server.ts)                           │
│                                                                             │
│  POST /api/chat Endpoint                                                    │
│     ├── Validates user input & country context                              │
│     ├── Injects systemInstruction with country geography & culture          │
│     └── Calls GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })           │
│            └── ai.models.generateContent({ model: 'gemini-3.8-flash' })     │
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │ HTTPS with 'aistudio-build' header
                                       ▼
+─────────────────────────────────────────────────────────────────────────────+
│                        GEMINI API (gemini-3.8-flash)                        │
+─────────────────────────────────────────────────────────────────────────────+
```

### Component & File Strategy

1. **`server.ts`**: Full-stack Express entry point:
   - Configures `GoogleGenAI` with `apiKey: process.env.GEMINI_API_KEY` and `httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }`.
   - Exposes `POST /api/chat` with structured prompt injection and error handling.
   - Integrates Vite dev middleware in development mode and static file serving in production.
2. **`package.json`**: Update `"dev": "tsx server.ts"` and `"start": "node server.ts"` to support full-stack server operations.
3. **`src/types/chat.ts`**: TypeScript definitions for `ChatMessage`, `ChatRequest`, and `ChatResponse`.
4. **`src/services/geminiChatApi.ts`**: Client service calling `/api/chat` with timeout protection and friendly fallback error messaging.
5. **`src/components/GeminiChatbox.tsx`**: High-polish embedded chat component with message list, markdown rendering, quick chips, typing indicator, and context banner.
6. **`src/App.tsx`**: Update Live Explorer layout to embed `GeminiChatbox` alongside `CountryCard`, automatically passing `selectedCountry`.
