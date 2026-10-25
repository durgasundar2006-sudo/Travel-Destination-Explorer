import React, { useState } from 'react';
import { ViewTab, CountryDetails } from './types/country';
import { Header } from './components/Header';
import { CountrySearch } from './components/CountrySearch';
import { CountryCard } from './components/CountryCard';
import { GeminiChatbox } from './components/GeminiChatbox';
import { StreamlitCodeViewer } from './components/StreamlitCodeViewer';
import { ProjectDocsViewer } from './components/ProjectDocsViewer';
import { TestVerificationSandbox } from './components/TestVerificationSandbox';
import { searchCountry, getCountryByCode } from './services/countriesApi';
import { INITIAL_COUNTRIES_CATALOG } from './data/fallbackCountries';
import {
  AlertCircle,
  AlertTriangle,
  Compass,
  Sparkles,
  CheckCircle2,
  Globe2,
  Bot,
  PanelRightClose,
  PanelRightOpen,
  Calendar
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('explorer');
  const [selectedCountry, setSelectedCountry] = useState<CountryDetails | null>(
    INITIAL_COUNTRIES_CATALOG[0] // Start with Japan so the user immediately sees a rich country card
  );
  const [allMatches, setAllMatches] = useState<CountryDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ type: 'warning' | 'error'; message: string } | null>(null);
  const [history, setHistory] = useState<string[]>(['Japan', 'France', 'Brazil']);
  const [showAiGuide, setShowAiGuide] = useState(true);
  const [aiTab, setAiTab] = useState<'chat' | 'planner'>('chat');

  // Handle country search submission
  const handleSearch = async (countryName: string) => {
    const trimmed = countryName.trim();
    if (!trimmed) {
      setError({
        type: 'warning',
        message: 'Please enter a country name before clicking search.'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchCountry(trimmed);
      if (results && results.length > 0) {
        setSelectedCountry(results[0]);
        setAllMatches(results);

        // Update search history (unique, max 8)
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.toLowerCase() !== results[0].commonName.toLowerCase());
          return [results[0].commonName, ...filtered].slice(0, 8);
        });
      } else {
        setError({
          type: 'error',
          message: `No details found for "${trimmed}". Please check your spelling and try again.`
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError({
        type: 'error',
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle border navigation click (e.g. click "ESP" on France)
  const handleSelectBorder = async (borderCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const neighbor = await getCountryByCode(borderCode);
      setSelectedCountry(neighbor);
      setAllMatches([neighbor]);

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== neighbor.commonName.toLowerCase());
        return [neighbor.commonName, ...filtered].slice(0, 8);
      });

      // Scroll smoothly to top of card
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError({
        type: 'error',
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (country: CountryDetails) => {
    setSelectedCountry(country);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Universal Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Explorer View */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* Search Input Box */}
            <CountrySearch
              onSearch={handleSearch}
              isLoading={loading}
              history={history}
              onSelectFromHistory={handleSearch}
            />

            {/* Error or Warning Banner */}
            {error && (
              <div
                role="alert"
                className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all shadow-sm ${
                  error.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {error.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{error.type === 'warning' ? 'Search Validation' : 'Lookup Notice'}</p>
                  <p className="mt-0.5 opacity-90">{error.message}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-xs font-bold opacity-60 hover:opacity-100 uppercase tracking-wider cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Side-by-side View Controls Bar */}
            {selectedCountry && !loading && (
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-2xs">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Globe2 className="w-4 h-4 text-sky-600" />
                    Viewing: {selectedCountry.commonName}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 hidden sm:inline">{selectedCountry.region} ({selectedCountry.subregion})</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Trip Planner Fast Access Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiGuide(true);
                      setAiTab(aiTab === 'planner' ? 'chat' : 'planner');
                    }}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      showAiGuide && aiTab === 'planner'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title="Toggle Multi-Day Trip Planner"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{showAiGuide && aiTab === 'planner' ? 'Viewing Planner' : 'Trip Planner'}</span>
                  </button>

                  {/* AI Guide View Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAiGuide(!showAiGuide)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      showAiGuide
                        ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={showAiGuide ? 'Hide AI Chatbox' : 'Show AI Chatbox'}
                  >
                    <Bot className="w-3.5 h-3.5 text-sky-600" />
                    <span>{showAiGuide ? 'AI Panel: Open' : 'Open AI Panel'}</span>
                    {showAiGuide ? (
                      <PanelRightClose className="w-3.5 h-3.5 text-sky-500" />
                    ) : (
                      <PanelRightOpen className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm animate-pulse space-y-6">
                <div className="h-28 bg-slate-200 rounded-xl w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-24 bg-slate-200 rounded-xl" />
                  <div className="h-24 bg-slate-200 rounded-xl" />
                  <div className="h-24 bg-slate-200 rounded-xl" />
                </div>
                <div className="h-48 bg-slate-200 rounded-xl" />
              </div>
            )}

            {/* Main Side-by-Side Grid: Country Card + Gemini AI Chatbox */}
            {!loading && selectedCountry && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Country Atlas Card */}
                <div className={showAiGuide ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
                  <CountryCard
                    country={selectedCountry}
                    onSelectBorder={handleSelectBorder}
                    matchesCount={allMatches.length}
                    allMatches={allMatches}
                    onSelectMatch={handleSelectMatch}
                    onOpenTripPlanner={() => {
                      setShowAiGuide(true);
                      setAiTab('planner');
                    }}
                  />
                </div>

                {/* Embedded Gemini AI Chatbox */}
                {showAiGuide && (
                  <div className="lg:col-span-5 sticky top-20">
                    <GeminiChatbox country={selectedCountry} initialTab={aiTab} />
                  </div>
                )}
              </div>
            )}

            {/* Quick Project Summary Card under the explorer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center space-x-2 text-sky-700 font-bold text-sm mb-1">
                  <Compass className="w-4 h-4" />
                  <span>REST Countries API v3.1</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real-time open country demographics, ISO alpha codes, currencies, geographical borders, and flag assets.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini 3.8 Flash AI Guide</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Server-side conversational travel assistant grounded in the currently selected destination with prompt chips.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Documentation Suite</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Includes full project documentation for Prompts 01 through 14: PRD, Architecture, QA Matrix, and Python script.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Python Code View */}
        {activeTab === 'python-code' && <StreamlitCodeViewer />}

        {/* Project Docs View */}
        {activeTab === 'docs' && <ProjectDocsViewer />}

        {/* QA Test Sandbox View */}
        {activeTab === 'qa-sandbox' && <TestVerificationSandbox />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-700">Travel Destination Explorer</span>
            <span>• Enhanced with Gemini AI Travel Guide</span>
          </div>
          <div>
            Powered by <a href="https://restcountries.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">REST Countries API</a> &amp; Google Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
}
