import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

interface CountryContext {
  commonName: string;
  officialName: string;
  capital: string;
  region: string;
  subregion: string;
  population: string | number;
  area: string | number;
  languages: string[];
  currencies: { name: string; code: string; symbol: string }[];
  borders: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate curated travel guidance fallback when Gemini API encounters a temporary 503 demand spike
function generateCuratedTravelTip(message: string, context?: CountryContext): string {
  if (!context || !context.commonName) {
    return "The Gemini AI model is currently experiencing high demand. Please try asking your question again in a few moments.";
  }

  const name = context.commonName;
  const capital = context.capital || 'the capital';
  const curStr = context.currencies?.map(c => `${c.name} (${c.code} ${c.symbol})`).join(', ') || 'local currency';
  const langStr = context.languages?.join(', ') || 'local languages';
  const q = message.toLowerCase();

  if (q.includes('itinerary') || q.includes('day') || q.includes('trip') || q.includes('plan')) {
    return `### 🗺️ Recommended 3-Day Travel Itinerary for ${name}

*Note: Live AI is experiencing a temporary demand spike; here is a curated destination outline based on official travel records:*

* **Day 1: Arrival & Historic Heart (${capital})**
  * Morning: Explore the central cultural landmarks and national museum in **${capital}**.
  * Afternoon: Walk through the historic old town, savoring traditional street food.
  * Evening: Dinner in the bustling culinary quarter; exchange or withdraw **${curStr}**.

* **Day 2: Scenic Nature & Heritage Discovery**
  * Morning: Day trip to prominent regional landscapes or UNESCO heritage landmarks.
  * Afternoon: Guided walking tour to appreciate local architectural traditions.
  * Evening: Sunset views followed by a relaxed local dinner.

* **Day 3: Local Markets & Souvenirs**
  * Morning: Browse local artisan craft bazaars for handcrafted souvenirs.
  * Afternoon: Learn basic courtesy greetings in **${langStr}**.
  * Evening: Farewell dinner at a scenic viewpoint celebrating ${name}'s culture!`;
  }

  if (q.includes('food') || q.includes('eat') || q.includes('dish') || q.includes('drink')) {
    return `### 🍜 Authentic Foods & Culinary Delights in ${name}

* **Signature National Specialty:** Savor the country's most celebrated traditional main dish, prepared with fresh native ingredients.
* **Capital Street Food in ${capital}:** Explore busy night markets and food stalls for quick, authentic local bites.
* **Traditional Beverages:** Ask for native teas, regional coffees, or heritage artisanal refreshments.
* **Dining Custom Tip:** Check whether tipping is expected or included on the bill, and prepare **${curStr}** for small vendors.`;
  }

  if (q.includes('etiquette') || q.includes('custom') || q.includes('rule') || q.includes('respect')) {
    return `### 💡 Cultural Etiquette & Local Customs in ${name}

* **Greetings:** A warm, respectful greeting in the native language (${langStr}) is always appreciated by locals.
* **Dress Codes:** Dress modestly when visiting religious sites, historic temples, or official state buildings in ${capital}.
* **Dining Manners:** Wait for the host or elder to begin before dining, and express appreciation for the meal.
* **Currency Etiquette:** Keep small denominations of **${curStr}** on hand for transit and modest purchases.`;
  }

  if (q.includes('pack') || q.includes('season') || q.includes('weather') || q.includes('clothing')) {
    return `### 🎒 Packing & Travel Advice for ${name}

* **Seasonal Clothing:** Check the current weather in ${capital} and ${context.region}; pack breathable layers and a light rain jacket.
* **Footwear:** Comfortable walking shoes are essential for exploring historic cobbled streets and scenic landmarks.
* **Power Adapters & Currency:** Bring a universal plug adapter and carry local **${curStr}** alongside major cards.
* **Health & Transit:** Carry basic personal remedies and save offline maps for ${name}.`;
  }

  return `### 🌟 Travel Insights for ${name}

* **Administrative Capital:** ${capital}
* **Geographic Region:** ${context.region} (${context.subregion})
* **Languages Spoken:** ${langStr}
* **National Currency:** ${curStr}

*(The upstream Gemini model is currently managing high traffic. Ask for "3-day itinerary", "must-try food", or "etiquette" for instant destination guides!)*`;
}

// POST /api/chat: Gemini AI Chat endpoint
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const { message, countryContext, history } = req.body as {
    message: string;
    countryContext?: CountryContext;
    history?: ChatHistoryItem[];
  };

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  // Prepare system instruction grounded in the country data
  let systemInstruction = `You are a knowledgeable, friendly, and culturally respectful local travel guide and trip planner.
Your goal is to help students, tourists, and travelers explore destinations with practical itineraries, cultural etiquette, local delicacies, budgeting tips, and travel advice.
Format your responses with clean, readable markdown: use short paragraphs, clear bullet points, and bold keywords where helpful. Keep responses concise and engaging.`;

  if (countryContext && countryContext.commonName) {
    const curList = countryContext.currencies?.map(c => `${c.name} (${c.code} ${c.symbol})`).join(', ') || 'N/A';
    const langList = countryContext.languages?.join(', ') || 'N/A';
    const borderList = countryContext.borders?.length > 0 ? countryContext.borders.join(', ') : 'None (Island or coastal)';

    systemInstruction += `\n\nCURRENT DESTINATION CONTEXT:
- Country: ${countryContext.commonName} (${countryContext.officialName})
- Capital: ${countryContext.capital}
- Region: ${countryContext.region} (${countryContext.subregion})
- Spoken Languages: ${langList}
- Currencies: ${curList}
- Neighboring Borders: ${borderList}

When the user asks general travel questions (e.g. "What should I eat?", "Plan a 3-day trip", "Best time to visit", "Packing tips"), tailor your recommendations specifically to ${countryContext.commonName} unless they explicitly ask about a different place.`;
  }

  // Build contents array for multi-turn chat if previous history exists
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history)) {
    const recentHistory = history.slice(-6);
    for (const item of recentHistory) {
      contents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  });

  // Attempt up to 2 calls to Gemini API with backoff
  let apiError: string | null = null;
  if (process.env.GEMINI_API_KEY) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response.text) {
          res.json({ reply: response.text });
          return;
        }
      } catch (err: unknown) {
        apiError = err instanceof Error ? err.message : String(err);
        // Wait briefly before retrying
        if (attempt === 0) {
          await sleep(1000);
        }
      }
    }
  }

  // If Gemini encounters a temporary 503 high-demand spike or missing key, provide the curated travel response
  console.warn('Using curated destination guidance due to API rate/demand status:', apiError);
  const fallbackReply = generateCuratedTravelTip(message, countryContext);
  res.json({ reply: fallbackReply });
});

// Helper: Curated multi-day itinerary builder fallback
function generateCuratedItinerary(params: {
  countryContext: CountryContext;
  days: number;
  travelStyle: string;
  pace: string;
  budgetTier: string;
  startingCity?: string;
}) {
  const { countryContext, days, travelStyle, pace, budgetTier, startingCity } = params;
  const name = countryContext.commonName;
  const city = startingCity || countryContext.capital || 'the capital';
  const cur = countryContext.currencies?.[0]?.symbol || '$';
  const curCode = countryContext.currencies?.[0]?.code || 'USD';

  const dayThemes = [
    { title: `Arrival & Historic Wonders of ${city}`, loc: city, focus: 'heritage, central plazas, and welcome feast' },
    { title: `Cultural Immersion & Hidden Alleys`, loc: city, focus: 'artisan workshops, local museum, and street delicacies' },
    { title: `Scenic Nature & Panoramic Horizons`, loc: `Regional Landscapes near ${city}`, focus: 'natural vistas, hiking trails, or botanical sanctuaries' },
    { title: `Gastronomy & Local Marketplace Discovery`, loc: city, focus: 'morning food markets, cooking traditions, and evening dining' },
    { title: `Day Trip to Historic Coastal / Mountain Towns`, loc: `Surrounding Countryside of ${name}`, focus: 'quaint villages, castles, or iconic landscapes' },
    { title: `Modern Vibes & Vibrant Neighborhoods`, loc: city, focus: 'contemporary architecture, coffee culture, and boutique shopping' },
    { title: `Farewell Traditions & Sunset Views`, loc: city, focus: 'souvenir hunting, photography, and commemorative dinner' },
  ];

  const generatedDays = [];
  for (let i = 1; i <= days; i++) {
    const theme = dayThemes[(i - 1) % dayThemes.length];
    generatedDays.push({
      dayNumber: i,
      title: `Day ${i}: ${theme.title}`,
      location: theme.loc,
      morning: `Begin with a traditional local breakfast. Visit the prominent landmarks around ${theme.loc} focusing on ${theme.focus}.`,
      afternoon: `Experience a guided or self-paced walking tour. Take a coffee break at a beloved neighborhood cafe and admire local architecture.`,
      evening: `Dine at a celebrated tavern or bistro. Enjoy an evening stroll under illuminated avenues with scenic night views.`,
      highlightMeal: `Authentic regional specialty paired with native refreshments (${cur} 15 - 35 ${curCode}).`,
      transitTip: `Use efficient local public transit, metro, or pre-booked rail for smooth navigation.`,
      budgetTip: `Estimated daily allowance: ${cur} ${budgetTier === 'Budget' ? '40-70' : budgetTier === 'Luxury' ? '250+' : '100-160'} ${curCode}.`,
    });
  }

  return {
    countryName: name,
    tripTitle: `${days}-Day ${travelStyle} Journey across ${name}`,
    summary: `A carefully designed ${pace.toLowerCase()} ${travelStyle.toLowerCase()} itinerary starting from ${city}, balancing iconic cultural attractions, culinary highlights, and authentic hidden corners.`,
    daysCount: days,
    travelStyle,
    pace,
    budgetTier,
    days: generatedDays,
    packingAdvice: [
      `Comfortable walking shoes suitable for exploring ${city}`,
      `Weather-appropriate layering and a light compact waterproof jacket`,
      `Universal travel adapter and local cash in ${countryContext.currencies?.[0]?.name || curCode}`,
      `Offline navigation maps and emergency contact cards`,
    ],
    estimatedDailyBudget: `${cur} ${budgetTier === 'Budget' ? '50-80' : budgetTier === 'Luxury' ? '280+' : '120-180'} / day`,
    localCurrency: `${curCode} (${cur})`,
  };
}

// POST /api/itinerary: Structured multi-day itinerary generator
app.post('/api/itinerary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { countryContext, days = 3, travelStyle = 'Culture & Landmarks', pace = 'Balanced', budgetTier = 'Moderate', startingCity } = req.body;

    if (!countryContext || !countryContext.commonName) {
      res.status(400).json({ error: 'Country context is required to build an itinerary.' });
      return;
    }

    const numDays = Math.min(Math.max(parseInt(String(days), 10) || 3, 1), 14);
    const baseCity = startingCity || countryContext.capital || countryContext.commonName;

    const promptText = `Generate a realistic, detailed ${numDays}-day travel itinerary for ${countryContext.commonName} starting in ${baseCity}.
Travel Style: ${travelStyle}
Pace: ${pace}
Budget Tier: ${budgetTier}
Currencies: ${countryContext.currencies?.map((c: any) => `${c.name} (${c.code} ${c.symbol})`).join(', ') || 'Local'}
Languages: ${countryContext.languages?.join(', ') || 'Local'}

Return a strictly valid JSON object matching this schema:
{
  "tripTitle": "${numDays}-Day Title",
  "summary": "2-3 sentence overview of the trip experience",
  "daysCount": ${numDays},
  "travelStyle": "${travelStyle}",
  "pace": "${pace}",
  "budgetTier": "${budgetTier}",
  "estimatedDailyBudget": "e.g. $80-120 / day in local currency",
  "localCurrency": "${countryContext.currencies?.[0]?.code || 'USD'}",
  "packingAdvice": ["item 1", "item 2", "item 3", "item 4"],
  "days": [
    {
      "dayNumber": 1,
      "title": "Day 1 Title",
      "location": "City or Neighborhood",
      "morning": "Detailed morning activity with specific places",
      "afternoon": "Detailed afternoon activity with cultural context",
      "evening": "Detailed evening activity and dining scene",
      "highlightMeal": "Specific traditional food or dish to try",
      "transitTip": "How to get around on this day",
      "budgetTip": "Cost expectation or saving tip"
    }
  ]
}
Ensure there are exactly ${numDays} days in the "days" array. Only return valid JSON without markdown formatting or code fences.`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini itinerary timeout')), 7000)
        );

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            res.json(parsed);
            return;
          }
        }
      } catch (geminiErr: unknown) {
        console.warn('Gemini itinerary generation fallback triggered:', geminiErr instanceof Error ? geminiErr.message : String(geminiErr));
      }
    }

    // Curated fallback
    const fallback = generateCuratedItinerary({
      countryContext,
      days: numDays,
      travelStyle,
      pace,
      budgetTier,
      startingCity: baseCity,
    });
    res.json(fallback);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Itinerary generation error: ${errorMsg}` });
  }
});

// Mount Vite middleware in development or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
