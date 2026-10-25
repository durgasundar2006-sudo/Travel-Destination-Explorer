/**
 * Types for REST Countries API v3.1 and App State
 */

export interface CountryCurrency {
  name: string;
  symbol: string;
}

export interface CountryLanguage {
  [code: string]: string;
}

export interface RestCountryRaw {
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { official: string; common: string }>;
  };
  tld?: string[];
  cca2: string;
  ccn3?: string;
  cca3: string;
  cioc?: string;
  independent?: boolean;
  status?: string;
  unMember?: boolean;
  currencies?: Record<string, CountryCurrency>;
  capital?: string[];
  altSpellings?: string[];
  region: string;
  subregion?: string;
  languages?: CountryLanguage;
  latlng?: [number, number];
  landlocked?: boolean;
  borders?: string[];
  area: number;
  flag?: string;
  flags: {
    png: string;
    svg: string;
    alt?: string;
  };
  coatOfArms?: {
    png?: string;
    svg?: string;
  };
  population: number;
  car?: {
    signs?: string[];
    side: 'left' | 'right';
  };
  timezones?: string[];
  continents?: string[];
  maps?: {
    googleMaps: string;
    openStreetMaps: string;
  };
}

export interface CountryDetails {
  id: string;
  commonName: string;
  officialName: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  populationFormatted: string;
  areaKm2: number;
  areaSqMiles: number;
  areaFormatted: string;
  flagUrl: string;
  flagAlt: string;
  coatOfArmsUrl?: string;
  emojiFlag: string;
  languages: string[];
  currencies: {
    code: string;
    name: string;
    symbol: string;
  }[];
  timezones: string[];
  continents: string[];
  borders: string[];
  borderNames?: { code: string; name: string }[];
  googleMapsUrl?: string;
  carDrivingSide?: 'left' | 'right';
  unMember: boolean;
  independent: boolean;
  cca2: string;
  cca3: string;
  latlng?: [number, number];
  topLevelDomain?: string;
}

export type ViewTab = 'explorer' | 'docs' | 'python-code' | 'qa-sandbox';

export interface SearchState {
  query: string;
  loading: boolean;
  error: string | null;
  selectedCountry: CountryDetails | null;
  searchResults: CountryDetails[];
  history: string[];
}
