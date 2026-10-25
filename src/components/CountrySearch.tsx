import React, { useState } from 'react';
import { Search, Sparkles, X, Clock, MapPin, Compass } from 'lucide-react';
import { POPULAR_COUNTRIES_LIST } from '../data/fallbackCountries';

interface CountrySearchProps {
  onSearch: (countryName: string) => void;
  isLoading: boolean;
  history: string[];
  onSelectFromHistory: (countryName: string) => void;
}

const REGION_SHORTCUTS = [
  { name: 'All Regions', sample: '' },
  { name: 'Asia', sample: 'Japan' },
  { name: 'Europe', sample: 'France' },
  { name: 'Americas', sample: 'Brazil' },
  { name: 'Africa', sample: 'Egypt' },
  { name: 'Oceania', sample: 'Australia' }
];

export const CountrySearch: React.FC<CountrySearchProps> = ({
  onSearch,
  isLoading,
  history,
  onSelectFromHistory
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputVal);
  };

  const handleClear = () => {
    setInputVal('');
  };

  const handleQuickPick = (country: string) => {
    setInputVal(country);
    onSearch(country);
  };

  const handleRandomPick = () => {
    const randomIndex = Math.floor(Math.random() * POPULAR_COUNTRIES_LIST.length);
    const chosen = POPULAR_COUNTRIES_LIST[randomIndex];
    setInputVal(chosen);
    onSearch(chosen);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 mb-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-600" />
            <span>Search Country Destination</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Type any country name (common or official) to fetch real-time REST Countries API data.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomPick}
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors self-start sm:self-auto cursor-pointer"
          title="Pick a random popular country"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Surprise Destination</span>
        </button>
      </div>

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="e.g. Japan, France, Brazil, Egypt, Canada, New Zealand..."
            className="w-full pl-10 pr-10 py-3 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            disabled={isLoading}
          />
          {inputVal && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-sky-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Search Country</span>
        </button>
      </form>

      {/* Popular Destination Quick Chips */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            Popular Destinations:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_COUNTRIES_LIST.slice(0, 10).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleQuickPick(name)}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Region quick exploration */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-medium">Explore by Region:</span>
        {REGION_SHORTCUTS.slice(1).map((r) => (
          <button
            key={r.name}
            type="button"
            onClick={() => handleQuickPick(r.sample)}
            className="text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
          >
            {r.name} ({r.sample})
          </button>
        ))}
      </div>

      {/* Recent searches history */}
      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center flex-wrap gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-400">
            <Clock className="w-3.5 h-3.5" /> Recent:
          </span>
          {history.slice(0, 5).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelectFromHistory(item)}
              className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
