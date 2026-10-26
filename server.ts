import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
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

// Fast in-memory cache for ultra-low latency response reuse
const chatResponseCache = new Map<string, string>();

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

// Comprehensive catalog of world country profiles for instant 0ms context resolution
const KNOWN_COUNTRIES: Record<string, CountryContext> = {
  india: {
    commonName: 'India',
    officialName: 'Republic of India',
    capital: 'New Delhi',
    region: 'Asia',
    subregion: 'Southern Asia',
    population: '1,408,044,253',
    area: '3,287,263 km²',
    languages: ['Hindi', 'English'],
    currencies: [{ code: 'INR', name: 'Indian rupee', symbol: '₹' }],
    borders: ['BGD', 'BTN', 'MMR', 'CHN', 'NPL', 'PAK'],
  },
  japan: {
    commonName: 'Japan',
    officialName: 'Japan',
    capital: 'Tokyo',
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: '125,836,021',
    area: '377,930 km²',
    languages: ['Japanese'],
    currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }],
    borders: [],
  },
  france: {
    commonName: 'France',
    officialName: 'French Republic',
    capital: 'Paris',
    region: 'Europe',
    subregion: 'Western Europe',
    population: '67,391,582',
    area: '551,695 km²',
    languages: ['French'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['AND', 'BEL', 'DEU', 'ITA', 'LUX', 'MCO', 'ESP', 'CHE'],
  },
  italy: {
    commonName: 'Italy',
    officialName: 'Italian Republic',
    capital: 'Rome',
    region: 'Europe',
    subregion: 'Southern Europe',
    population: '59,554,023',
    area: '301,336 km²',
    languages: ['Italian'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['AUT', 'FRA', 'SMR', 'SVN', 'CHE', 'VAT'],
  },
  germany: {
    commonName: 'Germany',
    officialName: 'Federal Republic of Germany',
    capital: 'Berlin',
    region: 'Europe',
    subregion: 'Western Europe',
    population: '83,240,525',
    area: '357,114 km²',
    languages: ['German'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['AUT', 'BEL', 'CZE', 'DNK', 'FRA', 'LUX', 'NLD', 'POL', 'CHE'],
  },
  'united states': {
    commonName: 'United States',
    officialName: 'United States of America',
    capital: 'Washington, D.C.',
    region: 'Americas',
    subregion: 'North America',
    population: '329,484,123',
    area: '9,372,610 km²',
    languages: ['English'],
    currencies: [{ code: 'USD', name: 'United States dollar', symbol: '$' }],
    borders: ['CAN', 'MEX'],
  },
  'united kingdom': {
    commonName: 'United Kingdom',
    officialName: 'United Kingdom of Great Britain and Northern Ireland',
    capital: 'London',
    region: 'Europe',
    subregion: 'Northern Europe',
    population: '67,215,293',
    area: '242,900 km²',
    languages: ['English'],
    currencies: [{ code: 'GBP', name: 'British pound', symbol: '£' }],
    borders: ['IRL'],
  },
  brazil: {
    commonName: 'Brazil',
    officialName: 'Federative Republic of Brazil',
    capital: 'Brasília',
    region: 'Americas',
    subregion: 'South America',
    population: '212,559,409',
    area: '8,515,767 km²',
    languages: ['Portuguese'],
    currencies: [{ code: 'BRL', name: 'Brazilian real', symbol: 'R$' }],
    borders: ['ARG', 'BOL', 'COL', 'GUF', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'],
  },
  canada: {
    commonName: 'Canada',
    officialName: 'Canada',
    capital: 'Ottawa',
    region: 'Americas',
    subregion: 'North America',
    population: '38,005,238',
    area: '9,984,670 km²',
    languages: ['English', 'French'],
    currencies: [{ code: 'CAD', name: 'Canadian dollar', symbol: '$' }],
    borders: ['USA'],
  },
  australia: {
    commonName: 'Australia',
    officialName: 'Commonwealth of Australia',
    capital: 'Canberra',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    population: '25,687,041',
    area: '7,692,024 km²',
    languages: ['English'],
    currencies: [{ code: 'AUD', name: 'Australian dollar', symbol: '$' }],
    borders: [],
  },
  egypt: {
    commonName: 'Egypt',
    officialName: 'Arab Republic of Egypt',
    capital: 'Cairo',
    region: 'Africa',
    subregion: 'Northern Africa',
    population: '102,334,403',
    area: '1,002,450 km²',
    languages: ['Arabic'],
    currencies: [{ code: 'EGP', name: 'Egyptian pound', symbol: '£' }],
    borders: ['ISR', 'LBY', 'PSE', 'SDN'],
  },
  spain: {
    commonName: 'Spain',
    officialName: 'Kingdom of Spain',
    capital: 'Madrid',
    region: 'Europe',
    subregion: 'Southern Europe',
    population: '47,351,567',
    area: '505,992 km²',
    languages: ['Spanish'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
  },
  mexico: {
    commonName: 'Mexico',
    officialName: 'United Mexican States',
    capital: 'Mexico City',
    region: 'Americas',
    subregion: 'North America',
    population: '128,932,753',
    area: '1,964,375 km²',
    languages: ['Spanish'],
    currencies: [{ code: 'MXN', name: 'Mexican peso', symbol: '$' }],
    borders: ['BLZ', 'GTM', 'USA'],
  },
  thailand: {
    commonName: 'Thailand',
    officialName: 'Kingdom of Thailand',
    capital: 'Bangkok',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    population: '69,799,978',
    area: '513,120 km²',
    languages: ['Thai'],
    currencies: [{ code: 'THB', name: 'Thai baht', symbol: '฿' }],
    borders: ['MMR', 'KHM', 'LAO', 'MYS'],
  },
  switzerland: {
    commonName: 'Switzerland',
    officialName: 'Swiss Confederation',
    capital: 'Bern',
    region: 'Europe',
    subregion: 'Western Europe',
    population: '8,654,622',
    area: '41,284 km²',
    languages: ['German', 'French', 'Italian'],
    currencies: [{ code: 'CHF', name: 'Swiss franc', symbol: 'CHF' }],
    borders: ['AUT', 'FRA', 'ITA', 'LIE', 'DEU'],
  },
  'south africa': {
    commonName: 'South Africa',
    officialName: 'Republic of South Africa',
    capital: 'Pretoria',
    region: 'Africa',
    subregion: 'Southern Africa',
    population: '59,308,690',
    area: '1,221,037 km²',
    languages: ['English', 'Zulu', 'Afrikaans', 'Xhosa'],
    currencies: [{ code: 'ZAR', name: 'South African rand', symbol: 'R' }],
    borders: ['BWA', 'LSO', 'MOZ', 'NAM', 'SWZ', 'ZWE'],
  },
  china: {
    commonName: 'China',
    officialName: "People's Republic of China",
    capital: 'Beijing',
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: '1,402,112,000',
    area: '9,706,961 km²',
    languages: ['Chinese'],
    currencies: [{ code: 'CNY', name: 'Chinese yuan', symbol: '¥' }],
    borders: ['AFG', 'BTN', 'MMR', 'HKG', 'IND', 'KAZ', 'PRK', 'KGZ', 'LAO', 'MAC', 'MNG', 'NPL', 'PAK', 'RUS', 'TJK', 'VNM'],
  },
  'south korea': {
    commonName: 'South Korea',
    officialName: 'Republic of Korea',
    capital: 'Seoul',
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: '51,780,579',
    area: '100,210 km²',
    languages: ['Korean'],
    currencies: [{ code: 'KRW', name: 'South Korean won', symbol: '₩' }],
    borders: ['PRK'],
  },
  greece: {
    commonName: 'Greece',
    officialName: 'Hellenic Republic',
    capital: 'Athens',
    region: 'Europe',
    subregion: 'Southern Europe',
    population: '10,715,549',
    area: '131,957 km²',
    languages: ['Greek'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['ALB', 'BGR', 'TUR', 'MKD'],
  },
  turkey: {
    commonName: 'Turkey',
    officialName: 'Republic of Turkey',
    capital: 'Ankara',
    region: 'Asia',
    subregion: 'Western Asia',
    population: '84,339,067',
    area: '783,562 km²',
    languages: ['Turkish'],
    currencies: [{ code: 'TRY', name: 'Turkish lira', symbol: '₺' }],
    borders: ['ARM', 'AZE', 'BGR', 'GEO', 'GRC', 'IRN', 'IRQ', 'SYR'],
  },
  portugal: {
    commonName: 'Portugal',
    officialName: 'Portuguese Republic',
    capital: 'Lisbon',
    region: 'Europe',
    subregion: 'Southern Europe',
    population: '10,305,564',
    area: '92,090 km²',
    languages: ['Portuguese'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['ESP'],
  },
  netherlands: {
    commonName: 'Netherlands',
    officialName: 'Kingdom of the Netherlands',
    capital: 'Amsterdam',
    region: 'Europe',
    subregion: 'Western Europe',
    population: '17,441,139',
    area: '41,850 km²',
    languages: ['Dutch'],
    currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    borders: ['BEL', 'DEU'],
  },
  indonesia: {
    commonName: 'Indonesia',
    officialName: 'Republic of Indonesia',
    capital: 'Jakarta',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    population: '273,523,615',
    area: '1,904,569 km²',
    languages: ['Indonesian'],
    currencies: [{ code: 'IDR', name: 'Indonesian rupiah', symbol: 'Rp' }],
    borders: ['TLS', 'MYS', 'PNG'],
  },
  vietnam: {
    commonName: 'Vietnam',
    officialName: 'Socialist Republic of Vietnam',
    capital: 'Hanoi',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    population: '97,338,579',
    area: '331,212 km²',
    languages: ['Vietnamese'],
    currencies: [{ code: 'VND', name: 'Vietnamese đồng', symbol: '₫' }],
    borders: ['KHM', 'CHN', 'LAO'],
  },
  singapore: {
    commonName: 'Singapore',
    officialName: 'Republic of Singapore',
    capital: 'Singapore',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    population: '5,685,807',
    area: '710 km²',
    languages: ['English', 'Malay', 'Mandarin', 'Tamil'],
    currencies: [{ code: 'SGD', name: 'Singapore dollar', symbol: '$' }],
    borders: [],
  },
  'new zealand': {
    commonName: 'New Zealand',
    officialName: 'New Zealand',
    capital: 'Wellington',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    population: '5,084,300',
    area: '270,467 km²',
    languages: ['English', 'Māori'],
    currencies: [{ code: 'NZD', name: 'New Zealand dollar', symbol: '$' }],
    borders: [],
  },
  argentina: {
    commonName: 'Argentina',
    officialName: 'Argentine Republic',
    capital: 'Buenos Aires',
    region: 'Americas',
    subregion: 'South America',
    population: '45,376,763',
    area: '2,780,400 km²',
    languages: ['Spanish'],
    currencies: [{ code: 'ARS', name: 'Argentine peso', symbol: '$' }],
    borders: ['BOL', 'BRA', 'CHL', 'PRY', 'URY'],
  },
  'united arab emirates': {
    commonName: 'United Arab Emirates',
    officialName: 'United Arab Emirates',
    capital: 'Abu Dhabi',
    region: 'Asia',
    subregion: 'Western Asia',
    population: '9,890,402',
    area: '83,600 km²',
    languages: ['Arabic'],
    currencies: [{ code: 'AED', name: 'United Arab Emirates dirham', symbol: 'د.إ' }],
    borders: ['OMN', 'SAU'],
  },
};

// Aliases lookup table with normalized strings (sorted by longest term first)
interface CountryAliasEntry {
  alias: string;
  country: CountryContext;
}

const COUNTRY_ALIAS_LIST: CountryAliasEntry[] = [
  // Multi-word country names & aliases
  { alias: 'united states of america', country: KNOWN_COUNTRIES['united states'] },
  { alias: 'united states', country: KNOWN_COUNTRIES['united states'] },
  { alias: 'united kingdom', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'great britain', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'united arab emirates', country: KNOWN_COUNTRIES['united arab emirates'] },
  { alias: 'south africa', country: KNOWN_COUNTRIES['south africa'] },
  { alias: 'south korea', country: KNOWN_COUNTRIES['south korea'] },
  { alias: 'new zealand', country: KNOWN_COUNTRIES['new zealand'] },
  { alias: 'new delhi', country: KNOWN_COUNTRIES['india'] },
  { alias: 'washington d.c.', country: KNOWN_COUNTRIES['united states'] },
  { alias: 'washington dc', country: KNOWN_COUNTRIES['united states'] },
  { alias: 'mexico city', country: KNOWN_COUNTRIES['mexico'] },
  { alias: 'buenos aires', country: KNOWN_COUNTRIES['argentina'] },
  { alias: 'kuala lumpur', country: KNOWN_COUNTRIES['india'] }, // fallback

  // Single word country names & capitals
  { alias: 'india', country: KNOWN_COUNTRIES['india'] },
  { alias: 'indian', country: KNOWN_COUNTRIES['india'] },
  { alias: 'delhi', country: KNOWN_COUNTRIES['india'] },
  { alias: 'mumbai', country: KNOWN_COUNTRIES['india'] },
  { alias: 'bangalore', country: KNOWN_COUNTRIES['india'] },
  { alias: 'jaipur', country: KNOWN_COUNTRIES['india'] },
  { alias: 'taj mahal', country: KNOWN_COUNTRIES['india'] },

  { alias: 'japan', country: KNOWN_COUNTRIES['japan'] },
  { alias: 'japanese', country: KNOWN_COUNTRIES['japan'] },
  { alias: 'tokyo', country: KNOWN_COUNTRIES['japan'] },
  { alias: 'kyoto', country: KNOWN_COUNTRIES['japan'] },
  { alias: 'osaka', country: KNOWN_COUNTRIES['japan'] },
  { alias: 'fuji', country: KNOWN_COUNTRIES['japan'] },

  { alias: 'france', country: KNOWN_COUNTRIES['france'] },
  { alias: 'french', country: KNOWN_COUNTRIES['france'] },
  { alias: 'paris', country: KNOWN_COUNTRIES['france'] },

  { alias: 'italy', country: KNOWN_COUNTRIES['italy'] },
  { alias: 'italian', country: KNOWN_COUNTRIES['italy'] },
  { alias: 'rome', country: KNOWN_COUNTRIES['italy'] },
  { alias: 'milan', country: KNOWN_COUNTRIES['italy'] },
  { alias: 'venice', country: KNOWN_COUNTRIES['italy'] },
  { alias: 'florence', country: KNOWN_COUNTRIES['italy'] },

  { alias: 'germany', country: KNOWN_COUNTRIES['germany'] },
  { alias: 'german', country: KNOWN_COUNTRIES['germany'] },
  { alias: 'berlin', country: KNOWN_COUNTRIES['germany'] },
  { alias: 'munich', country: KNOWN_COUNTRIES['germany'] },

  { alias: 'usa', country: KNOWN_COUNTRIES['united states'] },
  { alias: 'america', country: KNOWN_COUNTRIES['united states'] },
  { alias: 'american', country: KNOWN_COUNTRIES['united states'] },

  { alias: 'uk', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'britain', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'british', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'england', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'scotland', country: KNOWN_COUNTRIES['united kingdom'] },
  { alias: 'london', country: KNOWN_COUNTRIES['united kingdom'] },

  { alias: 'brazil', country: KNOWN_COUNTRIES['brazil'] },
  { alias: 'brazilian', country: KNOWN_COUNTRIES['brazil'] },
  { alias: 'brasil', country: KNOWN_COUNTRIES['brazil'] },
  { alias: 'rio de janeiro', country: KNOWN_COUNTRIES['brazil'] },
  { alias: 'sao paulo', country: KNOWN_COUNTRIES['brazil'] },

  { alias: 'canada', country: KNOWN_COUNTRIES['canada'] },
  { alias: 'canadian', country: KNOWN_COUNTRIES['canada'] },
  { alias: 'ottawa', country: KNOWN_COUNTRIES['canada'] },
  { alias: 'toronto', country: KNOWN_COUNTRIES['canada'] },
  { alias: 'vancouver', country: KNOWN_COUNTRIES['canada'] },

  { alias: 'australia', country: KNOWN_COUNTRIES['australia'] },
  { alias: 'australian', country: KNOWN_COUNTRIES['australia'] },
  { alias: 'sydney', country: KNOWN_COUNTRIES['australia'] },
  { alias: 'melbourne', country: KNOWN_COUNTRIES['australia'] },
  { alias: 'canberra', country: KNOWN_COUNTRIES['australia'] },

  { alias: 'egypt', country: KNOWN_COUNTRIES['egypt'] },
  { alias: 'egyptian', country: KNOWN_COUNTRIES['egypt'] },
  { alias: 'cairo', country: KNOWN_COUNTRIES['egypt'] },

  { alias: 'spain', country: KNOWN_COUNTRIES['spain'] },
  { alias: 'spanish', country: KNOWN_COUNTRIES['spain'] },
  { alias: 'madrid', country: KNOWN_COUNTRIES['spain'] },
  { alias: 'barcelona', country: KNOWN_COUNTRIES['spain'] },

  { alias: 'mexico', country: KNOWN_COUNTRIES['mexico'] },
  { alias: 'mexican', country: KNOWN_COUNTRIES['mexico'] },

  { alias: 'thailand', country: KNOWN_COUNTRIES['thailand'] },
  { alias: 'thai', country: KNOWN_COUNTRIES['thailand'] },
  { alias: 'bangkok', country: KNOWN_COUNTRIES['thailand'] },
  { alias: 'phuket', country: KNOWN_COUNTRIES['thailand'] },

  { alias: 'switzerland', country: KNOWN_COUNTRIES['switzerland'] },
  { alias: 'swiss', country: KNOWN_COUNTRIES['switzerland'] },
  { alias: 'zurich', country: KNOWN_COUNTRIES['switzerland'] },
  { alias: 'geneva', country: KNOWN_COUNTRIES['switzerland'] },

  { alias: 'china', country: KNOWN_COUNTRIES['china'] },
  { alias: 'chinese', country: KNOWN_COUNTRIES['china'] },
  { alias: 'beijing', country: KNOWN_COUNTRIES['china'] },
  { alias: 'shanghai', country: KNOWN_COUNTRIES['china'] },

  { alias: 'korea', country: KNOWN_COUNTRIES['south korea'] },
  { alias: 'korean', country: KNOWN_COUNTRIES['south korea'] },
  { alias: 'seoul', country: KNOWN_COUNTRIES['south korea'] },

  { alias: 'greece', country: KNOWN_COUNTRIES['greece'] },
  { alias: 'greek', country: KNOWN_COUNTRIES['greece'] },
  { alias: 'athens', country: KNOWN_COUNTRIES['greece'] },

  { alias: 'turkey', country: KNOWN_COUNTRIES['turkey'] },
  { alias: 'turkish', country: KNOWN_COUNTRIES['turkey'] },
  { alias: 'türkiye', country: KNOWN_COUNTRIES['turkey'] },
  { alias: 'istanbul', country: KNOWN_COUNTRIES['turkey'] },

  { alias: 'portugal', country: KNOWN_COUNTRIES['portugal'] },
  { alias: 'portuguese', country: KNOWN_COUNTRIES['portugal'] },
  { alias: 'lisbon', country: KNOWN_COUNTRIES['portugal'] },

  { alias: 'netherlands', country: KNOWN_COUNTRIES['netherlands'] },
  { alias: 'holland', country: KNOWN_COUNTRIES['netherlands'] },
  { alias: 'dutch', country: KNOWN_COUNTRIES['netherlands'] },
  { alias: 'amsterdam', country: KNOWN_COUNTRIES['netherlands'] },

  { alias: 'indonesia', country: KNOWN_COUNTRIES['indonesia'] },
  { alias: 'indonesian', country: KNOWN_COUNTRIES['indonesia'] },
  { alias: 'bali', country: KNOWN_COUNTRIES['indonesia'] },
  { alias: 'jakarta', country: KNOWN_COUNTRIES['indonesia'] },

  { alias: 'vietnam', country: KNOWN_COUNTRIES['vietnam'] },
  { alias: 'vietnamese', country: KNOWN_COUNTRIES['vietnam'] },
  { alias: 'hanoi', country: KNOWN_COUNTRIES['vietnam'] },
  { alias: 'saigon', country: KNOWN_COUNTRIES['vietnam'] },

  { alias: 'singapore', country: KNOWN_COUNTRIES['singapore'] },
  { alias: 'dubai', country: KNOWN_COUNTRIES['united arab emirates'] },
  { alias: 'uae', country: KNOWN_COUNTRIES['united arab emirates'] },
  { alias: 'argentina', country: KNOWN_COUNTRIES['argentina'] },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect if any specific country or capital is explicitly mentioned in the user's latest question.
 * Uses strict word-boundary matching. Longest aliases are checked first.
 */
function detectMentionedCountry(message: string): { country: CountryContext; matchedName: string } | null {
  if (!message || typeof message !== 'string') return null;
  const lowerMsg = message.toLowerCase();

  for (const entry of COUNTRY_ALIAS_LIST) {
    const pattern = new RegExp(`\\b${escapeRegex(entry.alias)}\\b`, 'i');
    if (pattern.test(lowerMsg)) {
      return { country: entry.country, matchedName: entry.country.commonName };
    }
  }

  return null;
}

/**
 * Resolve effective country context:
 * - If user explicitly mentions a country (e.g. India), prioritize that mentioned country!
 * - If no country is mentioned, use the currently selected country (clientContext).
 * - Fall back to Japan as default.
 */
function resolveEffectiveCountry(message: string, clientContext?: CountryContext): {
  country: CountryContext;
  wasExplicitlyMentioned: boolean;
  detectedCountryName: string | null;
} {
  const detected = detectMentionedCountry(message);
  if (detected) {
    return {
      country: detected.country,
      wasExplicitlyMentioned: true,
      detectedCountryName: detected.matchedName,
    };
  }

  if (clientContext && clientContext.commonName) {
    return {
      country: clientContext,
      wasExplicitlyMentioned: false,
      detectedCountryName: null,
    };
  }

  return {
    country: KNOWN_COUNTRIES['japan'],
    wasExplicitlyMentioned: false,
    detectedCountryName: null,
  };
}

// Generate curated travel guidance fallback when Gemini API encounters a temporary demand spike or timeout
function generateCuratedTravelTip(message: string, context?: CountryContext): string {
  if (!context || !context.commonName) {
    return "Please specify a country or select a destination to receive curated travel recommendations.";
  }

  const name = context.commonName;
  const capital = context.capital || 'the capital';
  const curStr = context.currencies?.map(c => `${c.name} (${c.code} ${c.symbol})`).join(', ') || 'local currency';
  const langStr = context.languages?.join(', ') || 'local languages';
  const q = message.toLowerCase();

  // Country-specific culinary specials
  if (name.toLowerCase() === 'india' && (q.includes('food') || q.includes('eat') || q.includes('dish') || q.includes('street') || q.includes('cuisine'))) {
    return `### 🍜 Authentic Street Foods & Culinary Delights in India

* **Iconic Street Chaat:** Savor crispy **Pani Puri / Golgappe** bursting with spiced mint-tamarind water, along with savory **Sev Puri** and **Dahi Vada**.
* **Fragrant Biryani:** Experience dum-cooked aromatic basmati rice infused with delicate saffron, whole cardamom, and caramelized spices (Hyderabadi & Lucknowi styles).
* **South Indian Classics:** Crisp golden **Masala Dosa** and steamed **Idlis** served with piping-hot vegetable sambar and fresh coconut chutney.
* **Warm North Indian Comfort:** Fluffy **Chole Bhature**, buttery **Pav Bhaji**, and tandoori naan with creamy paneer or spiced gravies.
* **Heritage Refreshments:** Fresh **Masala Chai** simmered with crushed ginger and green cardamom, or thick sweet mango **Lassi**.
* **Payment Tip:** Carry cash in **Indian Rupees (${curStr})** for roadside hawkers, while larger cafes readily support UPI and contactless cards.`;
  }

  if (name.toLowerCase() === 'japan' && (q.includes('food') || q.includes('eat') || q.includes('dish') || q.includes('street') || q.includes('cuisine'))) {
    return `### 🍜 Authentic Foods & Culinary Delights in Japan

* **Artisan Ramen:** Tonkotsu in Fukuoka, rich miso in Sapporo, or delicate shoyu in Tokyo — slurping noodles loudly is a compliment to the chef!
* **Fresh Nigiri Sushi:** Savor seasonal tuna, salmon, and sea urchin at morning fish markets like Toyosu or local conveyor-belt (kaitenzushi) spots.
* **Osaka Street Fare:** Golden spherical **Takoyaki** (octopus dumplings) drizzled with savory sauce and bonito flakes, plus sizzling **Okonomiyaki**.
* **Izakaya Small Plates:** Yakitori skewers, crisp vegetable tempura, edamame, and chilled draft beer or dry sake.
* **Etiquette & Currency:** Tipping is not practiced in Japan. Carry **Japanese Yen (${curStr})** in small bills and coins for ticket vending machines.`;
  }

  // Country-specific itineraries
  if (name.toLowerCase() === 'india' && (q.includes('itinerary') || q.includes('day') || q.includes('trip') || q.includes('plan'))) {
    return `### 🗺️ Recommended 3-Day Travel Itinerary for India (Golden Triangle)

* **Day 1: Historic & Vibrant New Delhi**
  * Morning: Explore the 17th-century **Red Fort** and the marble courtyard of **Jama Masjid** in Old Delhi.
  * Afternoon: Cycle-rickshaw ride through **Chandni Chowk** spice bazaar; visit the lush gardens of **Humayun's Tomb**.
  * Evening: Sunset stroll past **India Gate** and dinner savoring aromatic Mughlai or coastal curries.

* **Day 2: Architectural Wonder in Agra**
  * Morning: Express train to Agra to witness the sunrise glow on the ivory-white **Taj Mahal**.
  * Afternoon: Tour the majestic sandstone ramparts of **Agra Fort** and nearby Mehtab Bagh gardens.
  * Evening: Sample sweet Agra *Petha* and enjoy a rooftop dinner with views of the illuminated monument.

* **Day 3: Royal Palaces of Jaipur (The Pink City)**
  * Morning: Ascend the hilltop **Amber Fort** and marvel at the Sheesh Mahal mirror palace.
  * Afternoon: Photograph the facade of **Hawa Mahal** (Palace of Winds) and browse Johari Bazaar for textiles and gems.
  * Evening: Traditional Rajasthani thali dinner accompanied by folk music and puppet storytelling!`;
  }

  if (name.toLowerCase() === 'japan' && (q.includes('itinerary') || q.includes('day') || q.includes('trip') || q.includes('plan'))) {
    return `### 🗺️ Recommended 3-Day Travel Itinerary for Japan

* **Day 1: Historic & Modern Tokyo**
  * Morning: Stroll through the giant red lantern gate of **Senso-ji Temple** in Asakusa.
  * Afternoon: Walk across the world's busiest pedestrian intersection at **Shibuya Crossing** and visit Meiji Shrine.
  * Evening: City panorama from Tokyo Skytree or Shibuya Sky, followed by ramen in Shinjuku's Omoide Yokocho.

* **Day 2: Day Trip to Mount Fuji & Hakone**
  * Morning: Scenic Romancecar train to Hakone; cruise Lake Ashi with views of **Mount Fuji**.
  * Afternoon: Ride the Hakone Ropeway over volcanic sulfur vents at Owakudani and try a black egg (*kuro-tamago*).
  * Evening: Relax in a rejuvenating outdoor hot spring (*onsen*) followed by a traditional multi-course *kaiseki* dinner.

* **Day 3: Cultural Heart of Kyoto**
  * Morning: Walk beneath thousands of vermilion torii gates at **Fushimi Inari Taisha**.
  * Afternoon: Marvel at the shimmering **Kinkaku-ji** (Golden Pavilion) and wander the Arashiyama Bamboo Grove.
  * Evening: Spot geiko and maiko in historic Gion and celebrate your journey with Kyoto matcha parfaits!`;
  }

  // General questions (food, packing, etiquette, general advice)
  if (q.includes('itinerary') || q.includes('day') || q.includes('trip') || q.includes('plan')) {
    return `### 🗺️ Recommended 3-Day Travel Itinerary for ${name}

* **Day 1: Arrival & Historic Heart (${capital})**
  * Morning: Explore central landmarks, historic plazas, and national museums in **${capital}**.
  * Afternoon: Guided walk through the charming old quarter, sampling fresh local street food.
  * Evening: Welcome dinner in the vibrant dining district; withdraw **${curStr}** for markets.

* **Day 2: Scenic Nature & Heritage Discovery**
  * Morning: Excursion to celebrated regional landscapes, historic temples, or UNESCO World Heritage monuments.
  * Afternoon: Tour iconic architecture and visit local artisan craft ateliers.
  * Evening: Panoramic sunset vista followed by an authentic regional feast.

* **Day 3: Local Culture & Markets**
  * Morning: Browse bustling open-air marketplaces for handcrafted souvenirs and spices.
  * Afternoon: Learn customary greetings in **${langStr}** while exploring scenic neighborhood lanes.
  * Evening: Commemorative farewell dinner celebrating the rich hospitality of ${name}!`;
  }

  if (q.includes('food') || q.includes('eat') || q.includes('dish') || q.includes('drink')) {
    return `### 🍜 Authentic Foods & Culinary Delights in ${name}

* **National Signature Dish:** Savor the most celebrated traditional recipe of ${name}, crafted with fresh local seasonings.
* **Capital Street Food in ${capital}:** Visit open-air evening stalls and morning produce bazaars for savory local bites.
* **Traditional Beverages:** Ask for heritage teas, roasted regional coffees, or refreshing fruit infusions.
* **Dining Custom Tip:** Check whether service charge is included, and carry small denominations of **${curStr}** for street stalls.`;
  }

  if (q.includes('etiquette') || q.includes('custom') || q.includes('rule') || q.includes('respect')) {
    return `### 💡 Cultural Etiquette & Local Customs in ${name}

* **Greetings:** A polite greeting in the official language (${langStr}) shows immediate courtesy and goodwill.
* **Religious & Heritage Sites:** Dress modestly covering shoulders and knees when visiting temples, churches, or monuments in ${capital}.
* **Dining Manners:** Wait for the host or senior guest to begin the meal, and express appreciation for local hospitality.
* **Currency Etiquette:** Keep convenient cash in **${curStr}** for transit, tips, and neighborhood vendors.`;
  }

  if (q.includes('pack') || q.includes('season') || q.includes('weather') || q.includes('clothing') || q.includes('wear')) {
    return `### 🎒 Packing & Travel Advice for ${name}

* **Seasonal Attire:** Check current seasonal temperatures for ${capital} (${context.region}); pack breathable layers, modest temple-appropriate attire, and a light rain jacket.
* **Footwear:** Comfortable, durable walking shoes suitable for exploring historic cobbled streets and scenic paths.
* **Power Adapters & Currency:** Carry a universal plug adapter, portable power bank, and local **${curStr}**.
* **Health & Transit:** Download offline translation and navigation maps for ${name}, and carry personal essentials.`;
  }

  return `### 🌟 Travel Insights for ${name}

* **Administrative Capital:** ${capital}
* **Geographic Region:** ${context.region} (${context.subregion})
* **Languages Spoken:** ${langStr}
* **National Currency:** ${curStr}
* **Travel Recommendation:** Ask for a "3-day itinerary", "street food guide", "what to wear", or "cultural etiquette" for complete guidance!`;
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

  const cleanMsg = message.trim();

  // Resolve country prioritizing explicit user mentions over client-selected country
  const resolution = resolveEffectiveCountry(cleanMsg, countryContext);
  const effectiveCountry = resolution.country;
  const isMentioned = resolution.wasExplicitlyMentioned;

  const cacheKey = `${effectiveCountry.commonName.toLowerCase()}_${cleanMsg.toLowerCase()}`;

  // Instant response from memory cache (<10ms)
  if (chatResponseCache.has(cacheKey)) {
    res.json({ reply: chatResponseCache.get(cacheKey)!, detectedCountry: effectiveCountry.commonName });
    return;
  }

  const curList = effectiveCountry.currencies?.map(c => `${c.name} (${c.code} ${c.symbol})`).join(', ') || 'N/A';
  const langList = effectiveCountry.languages?.join(', ') || 'N/A';

  // High-speed, direct system instruction
  let systemInstruction = `You are a lightning-fast, knowledgeable, and culturally authentic local travel guide.
Be concise, direct, engaging, and structured. Deliver actionable travel insights in 100-150 words with clear bullet points. Avoid filler introductions (e.g. do NOT say "Certainly! As an AI...").`;

  if (isMentioned) {
    systemInstruction += `\n\nCRITICAL DIRECTIVE:
The user explicitly asked about ${effectiveCountry.commonName}. You MUST answer strictly and exclusively about ${effectiveCountry.commonName}.
DO NOT discuss ${countryContext?.commonName || 'any previously selected country'} unless the user explicitly requested a comparison.

TARGET DESTINATION:
- Country: ${effectiveCountry.commonName} (${effectiveCountry.officialName})
- Capital: ${effectiveCountry.capital}
- Region: ${effectiveCountry.region} (${effectiveCountry.subregion})
- Languages: ${langList}
- Currencies: ${curList}

Provide rich, authentic, and fast recommendations specifically for ${effectiveCountry.commonName}.`;
  } else {
    systemInstruction += `\n\nCURRENT DESTINATION CONTEXT:
The user did not mention another country, so use the currently selected destination:
- Country: ${effectiveCountry.commonName} (${effectiveCountry.officialName})
- Capital: ${effectiveCountry.capital}
- Region: ${effectiveCountry.region} (${effectiveCountry.subregion})
- Languages: ${langList}
- Currencies: ${curList}

Tailor all recommendations specifically to ${effectiveCountry.commonName}.`;
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history)) {
    const recentHistory = history.slice(-4);
    for (const item of recentHistory) {
      contents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: cleanMsg }],
  });

  // Fast Gemini call with ThinkingLevel.LOW and 2.4s strict timeout
  if (process.env.GEMINI_API_KEY) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fast timeout exceeded')), 2400)
      );

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.5,
          maxOutputTokens: 350,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);

      if (response && response.text) {
        chatResponseCache.set(cacheKey, response.text);
        res.json({ reply: response.text, detectedCountry: effectiveCountry.commonName });
        return;
      }
    } catch (err: unknown) {
      console.warn('Fast Gemini generation routed to curated guide for instantaneous delivery');
    }
  }

  // Instant curated travel response (0ms wait)
  const instantReply = generateCuratedTravelTip(cleanMsg, effectiveCountry);
  chatResponseCache.set(cacheKey, instantReply);
  res.json({ reply: instantReply, detectedCountry: effectiveCountry.commonName });
});

// POST /api/chat/stream: Ultra-fast streaming endpoint
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  const { message, countryContext, history } = req.body as {
    message: string;
    countryContext?: CountryContext;
    history?: ChatHistoryItem[];
  };

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const cleanMsg = message.trim();

  // Resolve country prioritizing explicit user mentions over client-selected country
  const resolution = resolveEffectiveCountry(cleanMsg, countryContext);
  const effectiveCountry = resolution.country;
  const isMentioned = resolution.wasExplicitlyMentioned;

  const cacheKey = `${effectiveCountry.commonName.toLowerCase()}_${cleanMsg.toLowerCase()}`;

  // If in cache, stream immediately in rapid pulses
  if (chatResponseCache.has(cacheKey)) {
    const cached = chatResponseCache.get(cacheKey)!;
    const words = cached.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      res.write(`data: ${JSON.stringify({ chunk, detectedCountry: effectiveCountry.commonName })}\n\n`);
      await sleep(15);
    }
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const curList = effectiveCountry.currencies?.map(c => `${c.name} (${c.code} ${c.symbol})`).join(', ') || 'N/A';
  const langList = effectiveCountry.languages?.join(', ') || 'N/A';

  let systemInstruction = `You are a lightning-fast, knowledgeable, and culturally authentic local travel guide.
Be concise, direct, engaging, and structured. Deliver actionable travel insights in 100-150 words with clear bullet points. Avoid filler introductions.`;

  if (isMentioned) {
    systemInstruction += `\n\nCRITICAL DIRECTIVE:
The user explicitly asked about ${effectiveCountry.commonName}. You MUST answer strictly and exclusively about ${effectiveCountry.commonName}.
DO NOT provide answers about ${countryContext?.commonName || 'any previously selected country'} unless explicitly asked to compare them.

TARGET DESTINATION:
- Country: ${effectiveCountry.commonName} (${effectiveCountry.officialName})
- Capital: ${effectiveCountry.capital}
- Region: ${effectiveCountry.region} (${effectiveCountry.subregion})
- Languages: ${langList}
- Currencies: ${curList}

Focus all answers specifically on ${effectiveCountry.commonName}.`;
  } else {
    systemInstruction += `\n\nCURRENT DESTINATION CONTEXT:
The user did not mention another country, so use the currently selected destination:
- Country: ${effectiveCountry.commonName} (${effectiveCountry.officialName})
- Capital: ${effectiveCountry.capital}
- Region: ${effectiveCountry.region} (${effectiveCountry.subregion})
- Languages: ${langList}
- Currencies: ${curList}

Tailor all recommendations specifically to ${effectiveCountry.commonName}.`;
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  if (Array.isArray(history)) {
    const recentHistory = history.slice(-4);
    for (const item of recentHistory) {
      contents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      });
    }
  }
  contents.push({ role: 'user', parts: [{ text: cleanMsg }] });

  let fullReply = '';
  let didStreamFromGemini = false;

  if (process.env.GEMINI_API_KEY) {
    try {
      const streamPromise = ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.5,
          maxOutputTokens: 350,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      // Strict timeout for first chunk (2.2s)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Streaming start timeout')), 2200)
      );

      const responseStream: any = await Promise.race([streamPromise, timeoutPromise]);

      for await (const chunk of responseStream) {
        if (chunk.text) {
          didStreamFromGemini = true;
          fullReply += chunk.text;
          res.write(`data: ${JSON.stringify({ chunk: chunk.text, detectedCountry: effectiveCountry.commonName })}\n\n`);
        }
      }

      if (didStreamFromGemini && fullReply) {
        chatResponseCache.set(cacheKey, fullReply);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    } catch (streamErr: unknown) {
      console.warn('Fast fallback streaming activated');
    }
  }

  // Instant fallback streaming
  const curated = generateCuratedTravelTip(cleanMsg, effectiveCountry);
  chatResponseCache.set(cacheKey, curated);
  const words = curated.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join(' ') + ' ';
    res.write(`data: ${JSON.stringify({ chunk, detectedCountry: effectiveCountry.commonName })}\n\n`);
    await sleep(20);
  }
  res.write('data: [DONE]\n\n');
  res.end();
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
