import React from 'react';
import { ViewTab } from '../types/country';
import { Compass, BookOpen, Code2, CheckCircle2, Globe2 } from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Globe2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Travel Destination Explorer
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                  REST Countries v3.1
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Beginner-friendly country intelligence & software engineering project suite
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 md:pb-0" aria-label="Tabs">
            <button
              onClick={() => onTabChange('explorer')}
              className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'explorer'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Live Explorer</span>
            </button>

            <button
              onClick={() => onTabChange('python-code')}
              className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'python-code'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Python Code (app.py)</span>
            </button>

            <button
              onClick={() => onTabChange('docs')}
              className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'docs'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Project Docs (01–14)</span>
            </button>

            <button
              onClick={() => onTabChange('qa-sandbox')}
              className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'qa-sandbox'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>QA Test Suite</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
