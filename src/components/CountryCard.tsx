import React, { useState } from 'react';
import { CountryDetails } from '../types/country';
import {
  MapPin,
  Users,
  Maximize2,
  Languages,
  Coins,
  Globe,
  Compass,
  ExternalLink,
  Car,
  Clock,
  Shield,
  Copy,
  Check,
  Calculator,
  Calendar
} from 'lucide-react';
import { InteractiveLandmarkMap } from './InteractiveLandmarkMap';

interface CountryCardProps {
  country: CountryDetails;
  onSelectBorder?: (borderCode: string) => void;
  matchesCount?: number;
  allMatches?: CountryDetails[];
  onSelectMatch?: (country: CountryDetails) => void;
  onOpenTripPlanner?: () => void;
  onAskAboutLandmark?: (landmarkName: string) => void;
}

export const CountryCard: React.FC<CountryCardProps> = ({
  country,
  onSelectBorder,
  matchesCount = 1,
  allMatches = [],
  onSelectMatch,
  onOpenTripPlanner,
  onAskAboutLandmark
}) => {
  const [copied, setCopied] = useState(false);
  const [showCoatOfArms, setShowCoatOfArms] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState<number>(100);

  const handleCopySummary = () => {
    const summaryText = `🌍 ${country.commonName} (${country.officialName})
Capital: ${country.capital}
Region: ${country.region} (${country.subregion})
Population: ${country.populationFormatted}
Area: ${country.areaFormatted} (${country.areaSqMiles.toLocaleString()} sq mi)
Languages: ${country.languages.join(', ')}
Currencies: ${country.currencies.map(c => `${c.name} [${c.code} ${c.symbol}]`).join(', ')}
Timezones: ${country.timezones.join(', ')}
Borders: ${country.borders.length > 0 ? country.borders.join(', ') : 'None (Island / Coast)'}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primaryCurrency = country.currencies[0] || { code: 'CUR', symbol: '$', name: 'Currency' };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 text-white p-6 sm:p-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-2xl sm:text-3xl" role="img" aria-label="Flag">
                {country.emojiFlag}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/15 text-sky-100 rounded-full backdrop-blur-sm border border-white/20">
                {country.region}
              </span>
              {country.subregion && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-white/10 text-slate-200 rounded-full">
                  {country.subregion}
                </span>
              )}
              {country.unMember && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-300" /> UN Member State
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {country.commonName}
            </h1>
            <p className="text-sm sm:text-base text-sky-100/90 italic font-normal">
              Official: {country.officialName}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center">
            {country.googleMapsUrl && (
              <a
                href={country.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-sky-300" />
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 text-sky-300" />
              </a>
            )}

            {onOpenTripPlanner && (
              <button
                onClick={onOpenTripPlanner}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white shadow-sm transition-all cursor-pointer"
                title="Open AI Trip Planner"
              >
                <Calendar className="w-4 h-4" />
                <span>Plan Trip</span>
              </button>
            )}

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
              title="Copy country facts to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-sky-300" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Disambiguation notice if query matched multiple results */}
      {matchesCount > 1 && allMatches.length > 1 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">Multiple Matches ({matchesCount}):</span>
            <span>Displaying top result <strong>{country.commonName}</strong>. Other matches:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {allMatches.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMatch && onSelectMatch(m)}
                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  m.id === country.id
                    ? 'bg-amber-200 font-bold text-amber-950'
                    : 'bg-white/80 hover:bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {m.commonName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Body Grid */}
      <div className="p-6 sm:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Assets (Flag + Coat of Arms) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-600" />
                  National Flag
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ISO: {country.cca2} / {country.cca3}
                </span>
              </div>

              {/* Flag Image */}
              <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner group">
                {country.flagUrl ? (
                  <img
                    src={country.flagUrl}
                    alt={country.flagAlt || `Flag of ${country.commonName}`}
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-4xl">{country.emojiFlag}</div>
                )}
              </div>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed italic">
                {country.flagAlt || `Official flag of ${country.commonName}`}
              </p>
            </div>

            {/* Coat of Arms Toggle / Expander */}
            {country.coatOfArmsUrl && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <button
                  onClick={() => setShowCoatOfArms(!showCoatOfArms)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-sky-600" />
                    {showCoatOfArms ? 'Hide Coat of Arms' : 'View Official Coat of Arms'}
                  </span>
                  <span className="text-slate-400">{showCoatOfArms ? '▲' : '▼'}</span>
                </button>

                {showCoatOfArms && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-col items-center">
                    <img
                      src={country.coatOfArmsUrl}
                      alt={`Coat of arms of ${country.commonName}`}
                      className="max-h-40 w-auto object-contain drop-shadow"
                    />
                    <p className="mt-2 text-[11px] text-slate-400">National Emblem / Coat of Arms</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Metric Cards & Facts */}
          <div className="lg:col-span-7 space-y-6">
            {/* Core Metrics 3-Col Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Capital City */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-sky-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Capital City</span>
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 truncate" title={country.capital}>
                    {country.capital}
                  </div>
                  <span className="text-[11px] text-sky-800">Administrative center</span>
                </div>
              </div>

              {/* Population */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Population</span>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {country.populationFormatted}
                  </div>
                  <span className="text-[11px] text-emerald-800">Total residents</span>
                </div>
              </div>

              {/* Total Land Area */}
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Land Area</span>
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {country.areaFormatted}
                  </div>
                  <span className="text-[11px] text-amber-800">
                    ≈ {country.areaSqMiles.toLocaleString()} sq mi
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Field Breakdown Grid */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Geographic & Cultural Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* Languages */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                    <Languages className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Languages Spoken</span>
                    <span className="font-medium text-slate-800 leading-snug">
                      {country.languages.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Currencies */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">National Currencies</span>
                    <span className="font-medium text-slate-800 leading-snug">
                      {country.currencies.map(c => `${c.name} (${c.code} · ${c.symbol})`).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Driving Side */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0 mt-0.5">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Road Traffic Side</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {country.carDrivingSide === 'left' ? '🚗 Drives on the Left (LHD)' : '🚗 Drives on the Right (RHD)'}
                    </span>
                  </div>
                </div>

                {/* Timezones */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Timezones</span>
                    <span className="font-mono text-xs font-medium text-slate-800">
                      {country.timezones.slice(0, 3).join(', ')}
                      {country.timezones.length > 3 && ` +${country.timezones.length - 3} more`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bordering Countries Interactive Section */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-600" />
                  Bordering Nations ({country.borders.length})
                </span>
                <span className="text-xs text-slate-400">Click code to navigate</span>
              </div>

              {country.borders.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {country.borders.map((borderCode) => {
                    const borderMeta = country.borderNames?.find(b => b.code === borderCode);
                    return (
                      <button
                        key={borderCode}
                        onClick={() => onSelectBorder && onSelectBorder(borderCode)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        title={borderMeta ? `View details for ${borderMeta.name}` : `View details for country code ${borderCode}`}
                      >
                        <span className="font-mono">{borderCode}</span>
                        {borderMeta && <span className="font-normal text-slate-500">• {borderMeta.name}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-1">
                  No land borders recorded (island territory or maritime-only boundaries).
                </p>
              )}
            </div>

            {/* Practical Traveler Quick Calculator Tool */}
            <div className="bg-gradient-to-br from-slate-50 to-sky-50/40 border border-sky-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-sky-600" />
                  Traveler Currency Note ({primaryCurrency.code})
                </span>
                <span className="text-xs font-mono text-sky-700 font-semibold">
                  {primaryCurrency.symbol}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Local currency in <strong>{country.commonName}</strong> is the <strong>{primaryCurrency.name}</strong> ({primaryCurrency.code}).
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-slate-400 mr-1.5">Amount:</span>
                  <input
                    type="number"
                    min="1"
                    value={calculatorAmount}
                    onChange={(e) => setCalculatorAmount(Number(e.target.value) || 0)}
                    className="w-16 font-mono font-bold text-slate-800 focus:outline-none"
                  />
                  <span className="text-slate-500 ml-1">{primaryCurrency.code}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Formatted: <span className="font-bold text-slate-900">{primaryCurrency.symbol} {calculatorAmount.toLocaleString()} {primaryCurrency.code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map & Major Landmarks Section */}
        <div className="pt-2 border-t border-slate-100">
          <InteractiveLandmarkMap
            country={country}
            onAskAboutLandmark={onAskAboutLandmark}
          />
        </div>
      </div>
    </div>
  );
};
