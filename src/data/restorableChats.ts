import { ChatMessage } from '../types/chat';

export interface ChatSession {
  id: string;
  countryId: string;
  countryName: string;
  flag: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export const DEFAULT_RESTORED_CHATS: Record<string, ChatMessage[]> = {
  JPN: [
    {
      id: 'jp-1',
      role: 'assistant',
      text: "Hello! I'm your **Gemini AI Travel Guide** for **Japan** 🌟\n\nI can help you design custom itineraries in **Tokyo**, recommend authentic local foods, explain cultural customs, or suggest what to pack.",
      timestamp: '10:00 AM',
      countryName: 'Japan'
    },
    {
      id: 'jp-2',
      role: 'user',
      text: 'What are the top authentic dishes I must eat in Japan, and how much do they cost?',
      timestamp: '10:01 AM',
      countryName: 'Japan'
    },
    {
      id: 'jp-3',
      role: 'assistant',
      text: `### 🍜 Must-Try Authentic Foods in Japan

1. **Ramen (拉麺)**
   * *What it is:* Rich tonkotsu (pork bone) or shoyu broth with hand-pulled noodles and chashu pork.
   * *Typical cost:* **¥800 – ¥1,200 JPY** (~$5–$8 USD).
   * *Where to find:* Ichiran, Afuri, or local neighborhood ramen counters in Shinjuku.

2. **Sushi & Sashimi (寿司)**
   * *What it is:* Fresh nigiri and seasonal fish from coastal markets.
   * *Typical cost:* **¥1,500 – ¥4,000 JPY** for quality sets.
   * *Top tip:* Visit Tsukiji Outer Market or Toyosu for breakfast sashimi bowls!

3. **Okonomiyaki (お好み焼き)**
   * *What it is:* Savory cabbage pancake griddled with pork belly, seafood, and bonito flakes.
   * *Typical cost:* **¥900 – ¥1,500 JPY**.

4. **Wagyu Beef & Yakiniku**
   * *What it is:* Melt-in-your-mouth marbled A5 beef grilled table-side.
   * *Typical cost:* **¥3,500 – ¥9,000 JPY** for an evening set.

*Tip: Tipping is strictly not customary in Japan—simply say **"Gochisousama deshita"** (thank you for the meal) when leaving!*`,
      timestamp: '10:01 AM',
      countryName: 'Japan'
    },
    {
      id: 'jp-4',
      role: 'user',
      text: 'Can you plan a 3-day itinerary starting in Tokyo?',
      timestamp: '10:03 AM',
      countryName: 'Japan'
    },
    {
      id: 'jp-5',
      role: 'assistant',
      text: `### 🗺️ 3-Day Highlights Itinerary: Tokyo & Beyond

* **Day 1: Historic Tokyo & Old World Charm (Asakusa & Ueno)**
  * *Morning:* Visit **Senso-ji Temple** in Asakusa; stroll Nakamise-dori shopping street for freshly made matcha snacks.
  * *Afternoon:* Walk through **Ueno Park** and the Tokyo National Museum.
  * *Evening:* Take the water bus to **Odaiba** for panoramic sunset views over Tokyo Bay and the Rainbow Bridge.

* **Day 2: Modern Culture, Shibuya Crossing & Shinjuku Neon**
  * *Morning:* Peaceful stroll through the towering cedar forests of **Meiji Jingu Shrine** and Harajuku’s Takeshita Street.
  * *Afternoon:* Experience the world-famous scramble at **Shibuya Crossing** and Shibuya Sky observation deck.
  * *Evening:* Izakaya hopping in Shinjuku's **Omoide Yokocho** (Memory Lane) with skewers and local drinks.

* **Day 3: Day Trip to Mt. Fuji (Kawaguchiko) or Kamakura**
  * *Option A (Scenic):* Lake Kawaguchiko for postcard-perfect Fuji views and Chureito Pagoda.
  * *Option B (Coastal Heritage):* Kamakura to see the Great Bronze Buddha and coastal temples.
  * *Evening:* Return to Tokyo for a celebratory farewell ramen bowl!`,
      timestamp: '10:04 AM',
      countryName: 'Japan'
    }
  ],
  FRA: [
    {
      id: 'fr-1',
      role: 'assistant',
      text: "Bonjour! I'm your **Gemini AI Travel Guide** for **France** 🇫🇷\n\nI can help you design custom itineraries in **Paris**, recommend bistros, or guide you through French etiquette and regions.",
      timestamp: '11:15 AM',
      countryName: 'France'
    },
    {
      id: 'fr-2',
      role: 'user',
      text: 'What is the most important cultural etiquette in Paris?',
      timestamp: '11:16 AM',
      countryName: 'France'
    },
    {
      id: 'fr-3',
      role: 'assistant',
      text: `### 🥖 Key Cultural Etiquette in France

* **Always say "Bonjour" first:** The golden rule of France! When entering any boutique, bakery, café, or taxi, always say *"Bonjour Madame/Monsieur"*. Starting a request without greeting is considered impolite.
* **Ordering at Cafés:** You don't need to rush; outdoor café terraces are meant for relaxed people-watching. Ask for *"L'addition, s'il vous plaît"* when you are ready to pay.
* **Quiet Voices in Public Transit:** Keep conversations and phone calls hushed on the Paris Metro.
* **Tipping:** Service is already included by law (*service compris*). Leaving €1 to €2 in coins for good service is appreciated but never mandatory.`,
      timestamp: '11:17 AM',
      countryName: 'France'
    }
  ],
  BRA: [
    {
      id: 'br-1',
      role: 'assistant',
      text: "Olá! I'm your **Gemini AI Travel Guide** for **Brazil** 🇧🇷\n\nReady to help with Rio de Janeiro beach culture, Amazon rainforest explorations, safety tips, and Brazilian cuisine!",
      timestamp: '11:30 AM',
      countryName: 'Brazil'
    },
    {
      id: 'br-2',
      role: 'user',
      text: 'What are the top safety and packing tips for traveling in Brazil?',
      timestamp: '11:31 AM',
      countryName: 'Brazil'
    },
    {
      id: 'br-3',
      role: 'assistant',
      text: `### 🌴 Essential Travel & Safety Tips for Brazil

* **Beach Culture (Praia):** Carry only what you need for the day (swimwear, flip-flops, light towel, and small cash in **Brazilian Reais R$**). Leave jewelry and expensive electronics in your hotel safe.
* **Ride-sharing:** Use Uber or registered taxi apps rather than hailing cabs off the street late at night.
* **Power & Outlets:** Brazil uses Type N (three round pins) and Type C. Bring a universal travel adapter.
* **Hydration & Street Food:** Drink fresh chilled coconut water (*água de coco*) directly from green coconuts on the beach, and try warm *pão de queijo* (cheese bread) for breakfast!`,
      timestamp: '11:32 AM',
      countryName: 'Brazil'
    }
  ]
};

const STORAGE_KEY_PREFIX = 'travel_explorer_chat_';
const ALL_SESSIONS_KEY = 'travel_explorer_all_sessions';

/**
 * Load chat messages for a specific country from localStorage or fallback defaults
 */
export function loadSavedChat(countryId: string, countryName: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${countryId.toUpperCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read chat from localStorage', e);
  }

  // Check built-in restored default
  const defaultList = DEFAULT_RESTORED_CHATS[countryId.toUpperCase()];
  if (defaultList) {
    return defaultList;
  }

  // Create welcome greeting
  return [
    {
      id: `init-${countryId}-${Date.now()}`,
      role: 'assistant',
      text: `Hello! I'm your **Gemini AI Travel Guide** for **${countryName}** 🌟\n\nI can help you design custom itineraries, recommend authentic local foods, explain cultural customs, or suggest what to pack. What would you like to explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      countryName
    }
  ];
}

/**
 * Save chat messages for a country to localStorage
 */
export function saveChatToStorage(countryId: string, countryName: string, messages: ChatMessage[]): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${countryId.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(messages));

    // Update global sessions index
    const sessionsRaw = localStorage.getItem(ALL_SESSIONS_KEY);
    let sessions: Record<string, { id: string; countryName: string; count: number; date: string }> = {};
    if (sessionsRaw) {
      sessions = JSON.parse(sessionsRaw);
    }
    sessions[countryId.toUpperCase()] = {
      id: countryId.toUpperCase(),
      countryName,
      count: messages.length,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    localStorage.setItem(ALL_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Could not save chat to localStorage', e);
  }
}

/**
 * Restore all chats across all default countries into localStorage
 */
export function restoreAllDefaultChats(): void {
  try {
    Object.entries(DEFAULT_RESTORED_CHATS).forEach(([cId, msgs]) => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${cId}`, JSON.stringify(msgs));
    });
  } catch (e) {
    console.warn('Failed restoring all chats', e);
  }
}
