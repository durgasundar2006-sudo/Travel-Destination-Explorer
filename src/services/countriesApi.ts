import { CountryDetails, RestCountryRaw } from '../types/country';
import { INITIAL_COUNTRIES_CATALOG } from '../data/fallbackCountries';

const BASE_URL = 'https://restcountries.com/v3.1';

// In-memory cache for fast repeat searches and border resolution
const countryCache = new Map<string, CountryDetails>();
const borderNameCache = new Map<string, string>();

/**
 * Format raw REST Countries API object into our clean, typed CountryDetails model
 */
export function formatCountryData(raw: RestCountryRaw): CountryDetails {
  const currenciesList = raw.currencies
    ? Object.entries(raw.currencies).map(([code, cur]) => ({
        code,
        name: cur.name || code,
        symbol: cur.symbol || code
      }))
    : [{ code: 'N/A', name: 'None recorded', symbol: '-' }];

  const languagesList = raw.languages
    ? Object.values(raw.languages)
    : ['Not specified'];

  const areaSqMiles = Math.round(raw.area * 0.386102);

  return {
    id: raw.cca3 || raw.cca2 || raw.name.common,
    commonName: raw.name.common,
    officialName: raw.name.official,
    capital: raw.capital && raw.capital.length > 0 ? raw.capital.join(', ') : 'No official capital',
    region: raw.region || 'Unknown Region',
    subregion: raw.subregion || raw.region || 'N/A',
    population: raw.population || 0,
    populationFormatted: (raw.population || 0).toLocaleString(),
    areaKm2: raw.area || 0,
    areaSqMiles,
    areaFormatted: `${(raw.area || 0).toLocaleString()} km²`,
    flagUrl: raw.flags?.png || raw.flags?.svg || '',
    flagAlt: raw.flags?.alt || `National flag of ${raw.name.common}`,
    coatOfArmsUrl: raw.coatOfArms?.png || raw.coatOfArms?.svg,
    emojiFlag: raw.flag || '🏳️',
    languages: languagesList,
    currencies: currenciesList,
    timezones: raw.timezones && raw.timezones.length > 0 ? raw.timezones : ['UTC'],
    continents: raw.continents || [raw.region],
    borders: raw.borders || [],
    googleMapsUrl: raw.maps?.googleMaps,
    carDrivingSide: raw.car?.side || 'right',
    unMember: Boolean(raw.unMember),
    independent: Boolean(raw.independent),
    cca2: raw.cca2 || '',
    cca3: raw.cca3 || '',
    latlng: raw.latlng,
    topLevelDomain: raw.tld && raw.tld.length > 0 ? raw.tld.join(', ') : undefined
  };
}

/**
 * Search for countries by name using REST Countries API
 * Handles:
 * - Empty query rejection
 * - 404 Country not found
 * - Network timeouts / CORS issues with fallback catalog matching
 */
export async function searchCountry(countryQuery: string): Promise<CountryDetails[]> {
  const query = countryQuery.trim();
  if (!query) {
    throw new Error('Please enter a country name to search.');
  }

  const cacheKey = query.toLowerCase();
  if (countryCache.has(cacheKey)) {
    return [countryCache.get(cacheKey)!];
  }

  try {
    const url = `${BASE_URL}/name/${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (response.status === 404) {
      // Check if we have a partial match in our fallback catalog first
      const fallbackMatch = INITIAL_COUNTRIES_CATALOG.filter(c =>
        c.commonName.toLowerCase().includes(query.toLowerCase()) ||
        c.officialName.toLowerCase().includes(query.toLowerCase())
      );
      if (fallbackMatch.length > 0) {
        return fallbackMatch;
      }
      throw new Error(`Country "${query}" could not be found. Please check spelling (e.g., "Germany", "Japan", "Brazil").`);
    }

    if (!response.ok) {
      throw new Error(`REST Countries API error (${response.status}): ${response.statusText}`);
    }

    const data: RestCountryRaw[] = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No information returned for "${query}".`);
    }

    const formattedList = data.map(formatCountryData);
    
    // Cache the primary results
    if (formattedList.length > 0) {
      countryCache.set(cacheKey, formattedList[0]);
      countryCache.set(formattedList[0].commonName.toLowerCase(), formattedList[0]);
    }

    return formattedList;
  } catch (err: unknown) {
    // If network failure or offline, try to resolve from catalog
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // If it's already our friendly 404 message or empty message, rethrow
    if (errorMessage.includes('could not be found') || errorMessage.includes('Please enter a country')) {
      throw err;
    }

    // Try fallback catalog match before giving up
    const fallbackMatch = INITIAL_COUNTRIES_CATALOG.filter(c =>
      c.commonName.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase() === query.toLowerCase()
    );

    if (fallbackMatch.length > 0) {
      return fallbackMatch;
    }

    throw new Error(
      `Unable to reach REST Countries API: ${errorMessage}. Please check your internet connection or try again.`
    );
  }
}

/**
 * Fetch country by 3-letter Alpha Code (e.g. for borders navigation)
 */
export async function getCountryByCode(code: string): Promise<CountryDetails> {
  const cleanCode = code.trim().toUpperCase();

  // Check cache
  if (countryCache.has(cleanCode)) {
    return countryCache.get(cleanCode)!;
  }

  // Check initial catalog
  const catalogMatch = INITIAL_COUNTRIES_CATALOG.find(c => c.cca3 === cleanCode || c.cca2 === cleanCode);
  if (catalogMatch) {
    return catalogMatch;
  }

  try {
    const url = `${BASE_URL}/alpha/${encodeURIComponent(cleanCode)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Could not fetch details for code "${code}"`);
    }

    const data = await response.json();
    const raw: RestCountryRaw = Array.isArray(data) ? data[0] : data;
    const formatted = formatCountryData(raw);

    countryCache.set(cleanCode, formatted);
    countryCache.set(formatted.commonName.toLowerCase(), formatted);
    borderNameCache.set(cleanCode, formatted.commonName);

    return formatted;
  } catch (err: unknown) {
    // Fallback if unable
    const errText = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load country with code "${cleanCode}": ${errText}`);
  }
}
