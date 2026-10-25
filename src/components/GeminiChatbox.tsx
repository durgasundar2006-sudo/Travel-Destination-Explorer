import React, { useState, useRef, useEffect } from 'react';
import { CountryDetails } from '../types/country';
import { ChatMessage, ChatCountryContext } from '../types/chat';
import { sendChatMessage } from '../services/geminiChatApi';
import { TripPlannerSection } from './TripPlannerSection';
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  Compass,
  MapPin,
  Utensils,
  BookOpen,
  Luggage,
  Languages,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  MessageSquare,
  Download,
  Filter,
  CheckCheck
} from 'lucide-react';

const CHAT_STORAGE_KEY = 'travel_explorer_chat_history_v2';

interface GeminiChatboxProps {
  country: CountryDetails | null;
  className?: string;
  initialTab?: 'chat' | 'planner';
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

export const GeminiChatbox: React.FC<GeminiChatboxProps> = ({
  country,
  className = '',
  initialTab = 'chat',
  externalPrompt = null,
  onClearExternalPrompt
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'planner'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load persistent chat history from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
    }
    return [];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterByCountry, setFilterByCountry] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastCountryRef = useRef<string | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, loading, activeTab]);

  // Save to localStorage whenever messages change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [messages]);

  // When country changes, KEEP all previous chats and append milestone transition
  useEffect(() => {
    if (country) {
      if (lastCountryRef.current && lastCountryRef.current !== country.id) {
        const transitionNotice: ChatMessage = {
          id: `switch-${country.id}-${Date.now()}`,
          role: 'assistant',
          text: `📍 *Now exploring **${country.commonName}** (${country.capital})*\nAll your previous chats have been preserved. What would you like to know about ${country.commonName}?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          countryName: country.commonName
        };
        setMessages((prev) => [...prev, transitionNotice]);
      } else if (messages.length === 0) {
        const initialGreeting: ChatMessage = {
          id: `init-${country.id}-${Date.now()}`,
          role: 'assistant',
          text: `Hello! I'm your **Gemini AI Travel Guide** for **${country.commonName}** 🌟\n\nI can help you design custom itineraries in **${country.capital}**, recommend authentic local foods, explain cultural customs, or suggest what to pack. You can also use the **Trip Planner** tab to generate a multi-day plan!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          countryName: country.commonName
        };
        setMessages([initialGreeting]);
      }
      lastCountryRef.current = country.id;
    }
  }, [country?.id]);

  // Handle external prompts (e.g. clicking "Ask AI" on a map landmark)
  useEffect(() => {
    if (externalPrompt) {
      setActiveTab('chat');
      handleSend(externalPrompt);
      if (onClearExternalPrompt) {
        onClearExternalPrompt();
      }
    }
  }, [externalPrompt]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    setInputValue('');
    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      countryName: country?.commonName
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const countryContext: ChatCountryContext | undefined = country
      ? {
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
        }
      : undefined;

    try {
      const replyText = await sendChatMessage(text, countryContext, messages);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        countryName: country?.commonName
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err);
      setErrorMessage(errStr);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your saved chat history?')) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      if (country) {
        setMessages([
          {
            id: `init-${country.id}-${Date.now()}`,
            role: 'assistant',
            text: `Chat cleared! Ready to help you explore **${country.commonName}** or plan your trip. What's on your mind?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            countryName: country.commonName
          }
        ]);
      } else {
        setMessages([]);
      }
      setErrorMessage(null);
    }
  };

  const handleExportAllChats = () => {
    if (messages.length === 0) return;
    let exportText = `# Gemini AI Travel Guide — Chat History\nExported on: ${new Date().toLocaleString()}\n\n`;

    messages.forEach((m) => {
      exportText += `### [${m.timestamp}] ${m.role === 'user' ? '👤 Traveler' : '🤖 Gemini'} ${m.countryName ? `(${m.countryName})` : ''}\n${m.text}\n\n---\n\n`;
    });

    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_guide_chat_history_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter messages if user only wants to see messages related to currently selected country
  const displayedMessages = React.useMemo(() => {
    if (!filterByCountry || !country?.commonName) {
      return messages;
    }
    return messages.filter(
      (m) => !m.countryName || m.countryName.toLowerCase() === country.commonName.toLowerCase()
    );
  }, [messages, filterByCountry, country?.commonName]);

  // Quick suggestions tailored to current country
  const quickPrompts = country
    ? [
        { label: '3-Day Itinerary', icon: Calendar, action: () => setActiveTab('planner') },
        { label: 'Must-Try Foods', icon: Utensils, action: () => handleSend(`What are the top 5 authentic traditional foods and drinks I must try in ${country.commonName}?`) },
        { label: 'Local Etiquette', icon: BookOpen, action: () => handleSend(`What are the key cultural etiquette rules and customs travelers should respect in ${country.commonName}?`) },
        { label: 'Packing & Season', icon: Luggage, action: () => handleSend(`What is the best time of year to visit ${country.commonName}, and what clothing/essentials should I pack?`) },
        { label: 'Useful Phrases', icon: Languages, action: () => handleSend(`Teach me 5 essential polite phrases in the local language of ${country.commonName} (${country.languages.join(', ')}) with pronunciation.`) }
      ]
    : [
        { label: 'Trip Planner', icon: Calendar, action: () => setActiveTab('planner') },
        { label: 'Destination Ideas', icon: Compass, action: () => handleSend('Suggest 3 amazing destinations for a first-time solo traveler.') }
      ];

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden h-[620px] lg:h-[720px] ${className}`}>
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-bold tracking-tight">Gemini Travel Companion</h3>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded">
                gemini-3.8-flash
              </span>
            </div>
            {country ? (
              <div className="flex items-center space-x-1 text-xs text-sky-200/90 truncate max-w-[190px] sm:max-w-xs">
                <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">Grounded in <strong>{country.commonName}</strong> ({country.capital})</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Global Travel AI Assistant</p>
            )}
          </div>
        </div>

        {activeTab === 'chat' && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExportAllChats}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Export all chats as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Clear saved chat history"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Segmented Mode Selector: AI Chat vs Trip Planner */}
      <div className="bg-slate-950 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chat</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'planner'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Trip Planner</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Chats Filter / Preserved Badge */}
        {activeTab === 'chat' && country && messages.length > 2 && (
          <button
            onClick={() => setFilterByCountry(!filterByCountry)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filterByCountry
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle between all saved chats and only current country"
          >
            <Filter className="w-3 h-3" />
            <span>{filterByCountry ? country.commonName : 'All Saved Chats'}</span>
          </button>
        )}
      </div>

      {/* VIEW 1: TRIP PLANNER VIEW */}
      {activeTab === 'planner' && (
        <div className="flex-1 overflow-hidden">
          <TripPlannerSection
            country={country}
            onSendToChat={(prompt) => {
              setActiveTab('chat');
              handleSend(prompt);
            }}
          />
        </div>
      )}

      {/* VIEW 2: AI CHAT VIEW */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Quick Prompts Bar */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
              Suggestions:
            </span>
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={item.action}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-sky-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {displayedMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                      isUser
                        ? 'bg-sky-600 text-white'
                        : 'bg-gradient-to-tr from-sky-500 to-teal-500 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition-opacity bg-slate-50 hover:bg-slate-100 cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {/* Tag of country if relevant */}
                    {msg.countryName && (
                      <div className="mb-1 text-[10px] font-semibold tracking-wide uppercase opacity-75">
                        📍 {msg.countryName}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                          return (
                            <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1">
                              {paragraph.split('\n').filter(Boolean).map((line, lIdx) => (
                                <li key={lIdx}>
                                  {renderFormattedText(line.replace(/^[-*]\s+/, ''))}
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        if (/^\d+\.\s/.test(paragraph)) {
                          return (
                            <ol key={pIdx} className="list-decimal pl-4 space-y-1 my-1">
                              {paragraph.split('\n').filter(Boolean).map((line, lIdx) => (
                                <li key={lIdx}>
                                  {renderFormattedText(line.replace(/^\d+\.\s+/, ''))}
                                </li>
                              ))}
                            </ol>
                          );
                        }

                        return (
                          <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                            {renderFormattedText(paragraph)}
                          </p>
                        );
                      })}
                    </div>

                    <div className={`mt-1.5 text-[10px] ${isUser ? 'text-sky-200 text-right' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-slate-400 font-medium ml-2">
                      Gemini is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">AI Assistant Notice:</p>
                  <p className="mt-0.5 opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  country
                    ? `Ask about ${country.commonName} (itineraries, customs, food, etc.)...`
                    : 'Ask travel questions...'
                }
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-800 transition-all placeholder:text-slate-400 font-medium"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="inline-flex items-center justify-center p-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                title="Send prompt"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCheck className="w-3 h-3" /> Chats kept in browser
              </span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to parse markdown bold and italics cleanly
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
