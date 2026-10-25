import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, CheckCircle2, FileCode, Play } from 'lucide-react';

const PYTHON_CODE_CONTENT = `"""
Travel Destination Explorer
============================
A beginner-friendly Streamlit web app to search and explore country information
using the REST Countries API, urllib.request, and json.

Features:
- Search by country name
- Real-time retrieval via REST Countries API v3.1
- Displays Flag, Capital, Region, Population, Area, Languages, and Currencies
- Graceful handling of empty input, invalid country names (404), and network errors
"""

import streamlit as st
import urllib.request
import urllib.error
import urllib.parse
import json

# Set Streamlit page configuration
st.set_page_config(
    page_title="Travel Destination Explorer",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.2rem;
    }
    .subtitle {
        color: #64748b;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .country-header {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        padding: 1.5rem;
        border-radius: 12px;
        color: white;
        margin-bottom: 1.5rem;
    }
</style>
""", unsafe_allow_html=True)

# App Header
st.markdown('<div class="main-title">🌍 Travel Destination Explorer</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Search any country to view real-time travel and geographic insights powered by REST Countries API.</div>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("✈️ Quick Explorer")
    st.caption("Select a popular destination or enter your own search:")
    
    popular_suggestions = ["Japan", "France", "Brazil", "Canada", "Egypt", "Australia", "Italy", "India"]
    selected_suggestion = st.selectbox("Quick Picks:", ["-- Select or type below --"] + popular_suggestions)
    
    st.markdown("---")
    st.subheader("ℹ️ Project Info")
    st.write("**Course / Scope:** Beginner Python + Streamlit")
    st.write("**Data Provider:** REST Countries API v3.1")
    st.write("**Libraries:** urllib.request, json, streamlit")
    st.write("**Backend / DB:** None required (stateless client)")

default_query = selected_suggestion if selected_suggestion != "-- Select or type below --" else ""

# Country Search Form
with st.form(key="country_search_form"):
    col_input, col_btn = st.columns([4, 1])
    with col_input:
        country_query = st.text_input(
            "Enter Country Name:",
            value=default_query,
            placeholder="e.g. Japan, France, Brazil, Canada..."
        )
    with col_btn:
        st.write("")
        st.write("")
        search_clicked = st.form_submit_button("🔍 Search Country", use_container_width=True)

def fetch_country_data(country_name: str):
    """
    Fetches country data from REST Countries API using urllib.request and json.
    Handles HTTP errors (such as 404 Not Found) and URLErrors (network failures).
    """
    clean_name = country_name.strip()
    if not clean_name:
        return None, "empty"
    
    # URL encode query to support names with spaces or accents
    encoded_name = urllib.parse.quote(clean_name)
    api_url = f"https://restcountries.com/v3.1/name/{encoded_name}"
    
    req = urllib.request.Request(
        api_url,
        headers={"User-Agent": "TravelDestinationExplorer/1.0"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                raw_data = response.read().decode('utf-8')
                parsed_json = json.loads(raw_data)
                return parsed_json, None
            else:
                return None, f"Unexpected response status: {response.status}"
    except urllib.error.HTTPError as http_err:
        if http_err.code == 404:
            return None, "not_found"
        return None, f"HTTP Error {http_err.code}: {http_err.reason}"
    except urllib.error.URLError as url_err:
        return None, f"Connection Error: {url_err.reason}. Please check your internet connection."
    except Exception as exc:
        return None, f"Unexpected error occurred: {str(exc)}"

query_to_search = country_query.strip()

if search_clicked or (selected_suggestion != "-- Select or type below --"):
    if not query_to_search:
        st.warning("⚠️ Please enter a country name before clicking search.")
    else:
        with st.spinner(f"Retrieving destination data for '{query_to_search}'..."):
            data, error = fetch_country_data(query_to_search)
        
        if error == "not_found":
            st.error(f"❌ Country **'{query_to_search}'** could not be found. Please check spelling (e.g., 'Brazil', 'Germany', 'Australia').")
        elif error:
            st.error(f"⚠️ {error}")
        elif data and len(data) > 0:
            country = data[0]
            
            # Extract basic required fields
            name_info = country.get("name", {})
            common_name = name_info.get("common", "Unknown")
            official_name = name_info.get("official", common_name)
            
            capitals = country.get("capital", [])
            capital_str = ", ".join(capitals) if capitals else "No official capital"
            
            region = country.get("region", "Not specified")
            subregion = country.get("subregion", "N/A")
            
            population = country.get("population", 0)
            population_formatted = f"{population:,}"
            
            area = country.get("area", 0)
            area_formatted = f"{area:,.1f} km²" if area else "Not available"
            area_sq_miles = f"{area * 0.386102:,.1f} sq mi" if area else "N/A"
            
            languages_dict = country.get("languages", {})
            languages_str = ", ".join(languages_dict.values()) if languages_dict else "Not specified"
            
            currencies_dict = country.get("currencies", {})
            currencies_list = []
            for cur_code, cur_info in currencies_dict.items():
                cur_name = cur_info.get("name", cur_code)
                cur_symbol = cur_info.get("symbol", "")
                currencies_list.append(f"{cur_name} ({cur_code} - {cur_symbol})")
            currencies_str = ", ".join(currencies_list) if currencies_list else "None recorded"
            
            flags = country.get("flags", {})
            flag_url = flags.get("png") or flags.get("svg")
            flag_alt = flags.get("alt", f"Flag of {common_name}")
            
            # Header card
            st.markdown(f"""
            <div class="country-header">
                <h1 style="margin:0; font-size:2rem;">{common_name}</h1>
                <p style="margin:0.2rem 0 0 0; opacity:0.9; font-size:1.1rem;">Official: <em>{official_name}</em></p>
                <p style="margin:0.4rem 0 0 0; opacity:0.85;">📍 {region} • {subregion}</p>
            </div>
            """, unsafe_allow_html=True)
            
            col_flag, col_details = st.columns([1, 2])
            
            with col_flag:
                st.subheader("🏳️ National Flag")
                if flag_url:
                    st.image(flag_url, caption=flag_alt, use_container_width=True)
                else:
                    st.info("No flag image available.")
                    
                coat_of_arms = country.get("coatOfArms", {}).get("png")
                if coat_of_arms:
                    with st.expander("🛡️ View Coat of Arms"):
                        st.image(coat_of_arms, use_container_width=True)
            
            with col_details:
                st.subheader("📋 Destination Quick Facts")
                
                m1, m2, m3 = st.columns(3)
                with m1:
                    st.metric(label="🏛️ Capital City", value=capital_str)
                with m2:
                    st.metric(label="👥 Population", value=population_formatted)
                with m3:
                    st.metric(label="📐 Total Land Area", value=area_formatted)
                
                st.markdown("---")
                st.write(f"**🌐 Geographic Region:** {region} ({subregion})")
                st.write(f"**🗣️ Spoken Languages:** {languages_str}")
                st.write(f"**💰 National Currencies:** {currencies_str}")
                st.write(f"**📏 Imperial Area:** {area_sq_miles}")
                
                borders = country.get("borders", [])
                if borders:
                    st.write(f"**🤝 Bordering Nations (ISO codes):** {', '.join(borders)}")
                else:
                    st.write("**🤝 Bordering Nations:** None (Island or isolated territory)")
                
                maps_info = country.get("maps", {})
                google_maps = maps_info.get("googleMaps")
                if google_maps:
                    st.markdown(f"[🗺️ Open {common_name} in Google Maps]({google_maps})")
            
            if len(data) > 1:
                st.markdown("---")
                st.caption(f"ℹ️ Found {len(data)} countries matching '{query_to_search}'. Top match displayed.")
else:
    st.info("💡 **Welcome to Travel Destination Explorer!** Enter a country name above (e.g. *Japan*, *Brazil*, *France*, *Egypt*) and click **Search Country**.")
`;

export const StreamlitCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CODE_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_CODE_CONTENT], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                <FileCode className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Python + Streamlit Source (`app.py`)</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pure beginner-friendly implementation matching all Project Brief & Constraint requirements:
              uses <code>streamlit</code>, standard library <code>urllib.request</code> and <code>json</code>,
              with zero database or complex dependencies.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download app.py</span>
            </button>
          </div>
        </div>

        {/* Local Run Instructions */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2 font-sans font-semibold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Step 1: Install Streamlit
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Terminal / Shell</span>
            </div>
            <code className="text-emerald-400">pip install streamlit</code>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2 font-sans font-semibold">
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Step 2: Run Streamlit Web App
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Terminal / Shell</span>
            </div>
            <code className="text-emerald-400">streamlit run app.py</code>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-sky-50/60 border border-sky-100 rounded-xl p-3">
          <span className="font-semibold text-sky-900">Constraint Verification:</span>
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Python + Streamlit
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> urllib.request (no requests lib needed)
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> json.loads parsing
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> REST Countries API v3.1
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero database overhead
          </span>
        </div>
      </div>

      {/* Code Display Box */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs">
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="ml-2 text-slate-300 font-semibold">app.py</span>
          </div>
          <span className="font-mono text-slate-400">Python 3.9+</span>
        </div>

        <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[650px] overflow-y-auto selection:bg-sky-500/30">
          <code>{PYTHON_CODE_CONTENT}</code>
        </pre>
      </div>
    </div>
  );
};
