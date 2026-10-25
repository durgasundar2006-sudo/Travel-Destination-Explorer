import React, { useState } from 'react';
import { CountryDetails } from '../types/country';
import { GeneratedItinerary, ItineraryRequest } from '../types/itinerary';
import { generateItinerary } from '../services/itineraryApi';
import {
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Coins,
  Sun,
  Sunrise,
  Moon,
  Utensils,
  Compass,
  Copy,
  Check,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  X,
  MessageSquare,
  Luggage,
  ShieldAlert
} from 'lucide-react';

interface TripPlannerSectionProps {
  country: CountryDetails | null;
  onSendToChat?: (promptText: string) => void;
  onCloseModal?: () => void;
  isModal?: boolean;
}

const TRAVEL_STYLES = [
  { id: 'Culture & Landmarks', label: '🏛️ Culture & Landmarks' },
  { id: 'Food & Culinary', label: '🍜 Food & Culinary' },
  { id: 'Nature & Outdoors', label: '🌲 Nature & Outdoors' },
  { id: 'Adventure & Exploration', label: '🏄 Adventure' },
  { id: 'Relaxed Leisure', label: '🏖️ Relaxed & Scenic' },
  { id: 'Budget Explorer', label: '🎒 Budget Backpacker' }
];

const PACES = [
  { id: 'Relaxed', label: 'Relaxed', desc: 'Slow, leisure mornings' },
  { id: 'Balanced', label: 'Balanced', desc: 'Good mix of sites & rest' },
  { id: 'Fast-Paced', label: 'Fast-Paced', desc: 'See everything possible' }
];

const BUDGETS = [
  { id: 'Budget', label: '$ Budget', desc: 'Hostels, transit, street food' },
  { id: 'Moderate', label: '$$ Balanced', desc: 'Mid-range hotels & dining' },
  { id: 'Luxury', label: '$$$ Luxury', desc: 'Top stays & private tours' }
];

export const TripPlannerSection: React.FC<TripPlannerSectionProps> = ({
  country,
  onSendToChat,
  onCloseModal,
  isModal = false
}) => {
  // Builder form state
  const [days, setDays] = useState<number>(3);
  const [travelStyle, setTravelStyle] = useState<string>('Culture & Landmarks');
  const [pace, setPace] = useState<'Relaxed' | 'Moderate' | 'Fast-Paced'>('Moderate');
  const [budgetTier, setBudgetTier] = useState<'Budget' | 'Moderate' | 'Luxury'>('Moderate');
  const [startingCity, setStartingCity] = useState<string>(country?.capital || '');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Results & UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [isExpandedModal, setIsExpandedModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync starting city when country changes
  React.useEffect(() => {
    if (country?.capital) {
      setStartingCity(country.capital);
    }
  }, [country?.capital]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!country) return;

    setLoading(true);
    setError(null);

    const request: ItineraryRequest = {
      countryContext: {
        commonName: country.commonName,
        officialName: country.officialName,
        capital: country.capital,
        region: country.region,
        subregion: country.subregion,
        population: country.populationFormatted,
        area: country.areaFormatted,
        languages: country.languages,
        currencies: country.currencies,
        borders: country.borders
      },
      days,
      travelStyle,
      pace,
      budgetTier,
      startingCity: startingCity.trim() || country.capital,
      specialNotes: specialNotes.trim() || undefined
    };

    try {
      const result = await generateItinerary(request);
      setItinerary(result);
      setActiveDayIndex(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyItinerary = () => {
    if (!itinerary) return;

    let text = `# ${itinerary.tripTitle}\n\n${itinerary.summary}\n\n**Destination:** ${itinerary.countryName}\n**Style:** ${itinerary.travelStyle} (${itinerary.pace})\n**Estimated Daily Budget:** ${itinerary.estimatedDailyBudget}\n\n`;

    itinerary.days.forEach((d) => {
      text += `## ${d.title} (${d.location})\n`;
      text += `* **Morning:** ${d.morning}\n`;
      text += `* **Afternoon:** ${d.afternoon}\n`;
      text += `* **Evening:** ${d.evening}\n`;
      text += `* **Must-Try Dish:** ${d.highlightMeal}\n`;
      text += `* **Transit Tip:** ${d.transitTip}\n\n`;
    });

    if (itinerary.packingAdvice?.length > 0) {
      text += `### Packing Checklist:\n${itinerary.packingAdvice.map((p) => `- ${p}`).join('\n')}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!itinerary) return;

    let text = `# ${itinerary.tripTitle}\n\n${itinerary.summary}\n\n`;
    text += `* **Country:** ${itinerary.countryName}\n`;
    text += `* **Duration:** ${itinerary.daysCount} Days\n`;
    text += `* **Style & Pace:** ${itinerary.travelStyle} • ${itinerary.pace}\n`;
    text += `* **Budget Tier:** ${itinerary.budgetTier} (${itinerary.estimatedDailyBudget})\n\n---\n\n`;

    itinerary.days.forEach((d) => {
      text += `## ${d.title}\n`;
      text += `**Location:** ${d.location}\n\n`;
      text += `* **🌅 Morning:** ${d.morning}\n`;
      text += `* **☀️ Afternoon:** ${d.afternoon}\n`;
      text += `* **🌙 Evening:** ${d.evening}\n`;
      text += `* **🍽️ Food Highlight:** ${d.highlightMeal}\n`;
      text += `* **🚇 Transit:** ${d.transitTip}\n`;
      if (d.budgetTip) text += `* **💡 Budget Note:** ${d.budgetTip}\n`;
      text += `\n---\n\n`;
    });

    if (itinerary.packingAdvice?.length > 0) {
      text += `### 🎒 Packing & Travel Tips:\n${itinerary.packingAdvice.map((p) => `- ${p}`).join('\n')}\n`;
    }

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itinerary.countryName.toLowerCase()}_${itinerary.daysCount}day_itinerary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAskInChat = (dayPlan: typeof itinerary extends null ? never : any) => {
    if (!onSendToChat || !country) return;
    const prompt = `Can you customize Day ${dayPlan.dayNumber} (${dayPlan.title}) of my ${country.commonName} trip with more hidden gem recommendations and specific restaurants in ${dayPlan.location}?`;
    onSendToChat(prompt);
  };

  if (!country) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm">Please search and select a country first to build an itinerary.</p>
      </div>
    );
  }

  const activeDay = itinerary?.days[activeDayIndex] || itinerary?.days[0];

  return (
    <div className={`flex flex-col h-full bg-slate-50/70 overflow-hidden ${isExpandedModal ? 'fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-300' : ''}`}>
      {/* Top Header Bar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Trip Itinerary Planner</span>
              <span className="text-[10px] font-normal px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
                {country.commonName}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Personalized multi-day plans powered by Gemini 3.8 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {!isModal && (
            <button
              onClick={() => setIsExpandedModal(!isExpandedModal)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={isExpandedModal ? 'Minimize modal' : 'Expand to full screen modal'}
            >
              {isExpandedModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error notice if any */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Planner Notice:</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* View 1: Builder Form (When no itinerary generated yet or user clicked "Customize") */}
        {!itinerary ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Duration Selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Trip Duration</span>
                <span className="text-sky-600 font-extrabold text-sm font-mono">{days} Days</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 5, 7, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      days === d
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Style */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Travel Style & Focus
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TRAVEL_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTravelStyle(s.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-all cursor-pointer truncate ${
                      travelStyle === s.id
                        ? 'bg-sky-50 text-sky-900 border border-sky-300 font-semibold'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pace & Budget 2-Col */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pace */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Pace
                </label>
                <div className="space-y-1">
                  {PACES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPace(p.id as any)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        pace === p.id
                          ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-300'
                          : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[10px] text-slate-400">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Budget Level
                </label>
                <div className="space-y-1">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetTier(b.id as any)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        budgetTier === b.id
                          ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-300'
                          : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                      }`}
                    >
                      <span>{b.label}</span>
                      <span className="text-[10px] text-slate-400">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Starting City */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Starting City / Base</span>
                <span className="text-[10px] text-slate-400 font-normal">Capital: {country.capital}</span>
              </label>
              <input
                type="text"
                value={startingCity}
                onChange={(e) => setStartingCity(e.target.value)}
                placeholder={`e.g. ${country.capital}`}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 font-medium"
              />
            </div>

            {/* Submit Generate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Designing {days}-Day Itinerary with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Build {days}-Day Itinerary for {country.commonName}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* View 2: Generated Itinerary Details */
          <div className="space-y-4">
            {/* Header summary card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono">
                      {itinerary.daysCount} Days
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {itinerary.travelStyle}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {itinerary.estimatedDailyBudget}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                    {itinerary.tripTitle}
                  </h4>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 self-start sm:self-center">
                  <button
                    onClick={handleCopyItinerary}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Copy complete itinerary"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Download as Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setItinerary(null)}
                    className="px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50 rounded-lg border border-sky-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                {itinerary.summary}
              </p>
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {itinerary.days.map((day, idx) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeDayIndex === idx
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  Day {day.dayNumber}
                </button>
              ))}
            </div>

            {/* Active Day Detail Card */}
            {activeDay && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                      Day {activeDay.dayNumber} Schedule
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900">
                      {activeDay.title}
                    </h5>
                  </div>
                  <div className="flex items-center text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 mr-1" />
                    <span>{activeDay.location}</span>
                  </div>
                </div>

                {/* Timeline: Morning, Afternoon, Evening */}
                <div className="space-y-3">
                  {/* Morning */}
                  <div className="flex items-start space-x-3 text-xs sm:text-sm">
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-xl shrink-0 mt-0.5">
                      <Sunrise className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
                        Morning
                      </span>
                      <p className="text-slate-600 leading-relaxed mt-0.5">
                        {activeDay.morning}
                      </p>
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className="flex items-start space-x-3 text-xs sm:text-sm">
                    <div className="p-2 bg-sky-50 text-sky-700 rounded-xl shrink-0 mt-0.5">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
                        Afternoon
                      </span>
                      <p className="text-slate-600 leading-relaxed mt-0.5">
                        {activeDay.afternoon}
                      </p>
                    </div>
                  </div>

                  {/* Evening */}
                  <div className="flex items-start space-x-3 text-xs sm:text-sm">
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl shrink-0 mt-0.5">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
                        Evening
                      </span>
                      <p className="text-slate-600 leading-relaxed mt-0.5">
                        {activeDay.evening}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day Highlights: Food & Transit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                      <Utensils className="w-3.5 h-3.5 text-amber-700" />
                      <span>Must-Try Dish</span>
                    </div>
                    <p className="text-amber-800 leading-snug">{activeDay.highlightMeal}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <Compass className="w-3.5 h-3.5 text-sky-600" />
                      <span>Transit & Navigation</span>
                    </div>
                    <p className="text-slate-600 leading-snug">{activeDay.transitTip}</p>
                  </div>
                </div>

                {/* Ask AI to Customize Day button */}
                {onSendToChat && (
                  <button
                    onClick={() => handleAskInChat(activeDay)}
                    className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-sky-200 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                    <span>Ask Gemini to refine Day {activeDay.dayNumber} in Chat</span>
                  </button>
                )}
              </div>
            )}

            {/* Packing Advice list */}
            {itinerary.packingAdvice?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800 uppercase tracking-wider">
                  <Luggage className="w-4 h-4 text-sky-600" />
                  <span>Essential Packing & Preparation for {country.commonName}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itinerary.packingAdvice.map((item, i) => (
                    <div key={i} className="flex items-start space-x-2 text-slate-600">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
