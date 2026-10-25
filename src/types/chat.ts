export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  countryName?: string;
}

export interface ChatCountryContext {
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
