import React, { useState, useMemo } from 'react';
import { PROJECT_DOCUMENTS, ProjectDoc } from '../data/projectDocsData';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Download,
  Filter,
  BadgeCheck,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export const ProjectDocsViewer: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState(false);

  const categories = ['All', 'Strategy', 'Requirements', 'Architecture', 'Implementation', 'Quality & Release'];

  // Filter documents
  const filteredDocs = useMemo(() => {
    return PROJECT_DOCUMENTS.filter((doc) => {
      const matchCategory = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.promptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const activeDoc: ProjectDoc = useMemo(() => {
    return (
      PROJECT_DOCUMENTS.find((d) => d.id === selectedDocId) ||
      filteredDocs[0] ||
      PROJECT_DOCUMENTS[0]
    );
  }, [selectedDocId, filteredDocs]);

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const fullMarkdown = PROJECT_DOCUMENTS.map(
      (doc) => `<!-- ==================================================================== -->
<!-- ${doc.promptNumber}: ${doc.title} (${doc.role}) -->
<!-- ==================================================================== -->\n\n${doc.content}\n\n`
    ).join('\n---\n\n');

    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TRAVEL_DESTINATION_EXPLORER_PROJECT_DOCS.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Software Engineering Project Documentation (Prompts 01–14)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Complete, rigorous product lifecycle documentation answering every prompt requirement:
              Problem Analysis, PRD, UI/UX, Architecture, Data Model, API, Implementation, Pitch Scripts, 15-Q Audit, Test Matrix, and Release Management.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCurrent}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Doc!' : 'Copy Current'}</span>
            </button>

            <button
              onClick={handleDownloadAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download All (Markdown)</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search prompts, requirements, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Sidebar of Prompts + Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prompts List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1.5 max-h-[720px] overflow-y-auto">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Project Deliverables ({filteredDocs.length})</span>
            <span>Prompts 01–14</span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching prompts found for "{searchQuery}".
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = doc.id === activeDoc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border border-sky-300 text-sky-950 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-sky-200 text-sky-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {doc.promptNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {doc.category}
                      </span>
                    </div>
                    <div className={`text-xs font-bold leading-snug ${isSelected ? 'text-sky-900' : 'text-slate-900'}`}>
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      Role: {doc.role}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${isSelected ? 'text-sky-600 translate-x-0.5' : 'text-slate-300'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Document Reader */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-5 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-md font-mono border border-sky-200">
                {activeDoc.promptNumber}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                {activeDoc.category}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-md flex items-center gap-1 border border-emerald-100">
                <UserCheck className="w-3.5 h-3.5" />
                Role: {activeDoc.role}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-sky-50 text-sky-700 rounded-md flex items-center gap-1 ml-auto">
                <BadgeCheck className="w-3.5 h-3.5 text-sky-600" />
                Reviewed & Verified
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900">
              {activeDoc.title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeDoc.summary}
            </p>
          </div>

          {/* Render Document Markdown Content with rich styling */}
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-slate-600 prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm prose-li:text-slate-600 prose-table:text-xs sm:prose-table:text-sm prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sky-700 prose-code:text-xs">
            {activeDoc.content.split('\n\n').map((paragraph, idx) => {
              // Tables
              if (paragraph.includes('|') && paragraph.includes('\n|')) {
                const rows = paragraph.trim().split('\n').filter(r => !r.includes('---'));
                if (rows.length > 0) {
                  const headers = rows[0].split('|').map(c => c.trim()).filter(Boolean);
                  const dataRows = rows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(Boolean));
                  return (
                    <div key={idx} className="my-4 overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="min-w-full divide-y divide-slate-200 text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {dataRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 text-xs text-slate-700 font-medium">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
              }

              // Code block
              if (paragraph.startsWith('```')) {
                const lines = paragraph.split('\n');
                const codeBody = lines.slice(1, lines.length - 1).join('\n');
                return (
                  <pre key={idx} className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto my-3 leading-relaxed">
                    <code>{codeBody}</code>
                  </pre>
                );
              }

              // Heading 1
              if (paragraph.startsWith('# ')) {
                return (
                  <h2 key={idx} className="text-xl font-extrabold text-slate-900 mt-6 mb-2 border-b border-slate-100 pb-2">
                    {paragraph.replace('# ', '')}
                  </h2>
                );
              }

              // Heading 2
              if (paragraph.startsWith('## ')) {
                return (
                  <h3 key={idx} className="text-base font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-sky-600 rounded-full inline-block" />
                    {paragraph.replace('## ', '')}
                  </h3>
                );
              }

              // Heading 3
              if (paragraph.startsWith('### ')) {
                return (
                  <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-1">
                    {paragraph.replace('### ', '')}
                  </h4>
                );
              }

              // Unordered list
              if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                const items = paragraph.split('\n').filter(Boolean);
                return (
                  <ul key={idx} className="list-disc pl-5 my-2 space-y-1 text-xs sm:text-sm text-slate-600">
                    {items.map((item, iIdx) => (
                      <li key={iIdx}>
                        {item.replace(/^[-*]\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              // Numbered list
              if (/^\d+\.\s/.test(paragraph)) {
                const items = paragraph.split('\n').filter(Boolean);
                return (
                  <ol key={idx} className="list-decimal pl-5 my-2 space-y-1 text-xs sm:text-sm text-slate-600">
                    {items.map((item, iIdx) => (
                      <li key={iIdx}>
                        {item.replace(/^\d+\.\s+/, '')}
                      </li>
                    ))}
                  </ol>
                );
              }

              // Standard paragraph
              return (
                <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed my-2">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
