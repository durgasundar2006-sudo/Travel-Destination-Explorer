"""
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
    .metric-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

# App Header
st.markdown('<div class="main-title">🌍 Travel Destination Explorer</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Search any country across the globe to view real-time travel and geographic insights powered by REST Countries API.</div>', unsafe_allow_html=True)

# Sidebar with quick guides and suggestions
with st.sidebar:
    st.header("✈️ Quick Explorer")
    st.caption("Select a popular destination or enter your own search:")
    
    popular_suggestions = ["Japan", "France", "Brazil", "Canada", "Egypt", "Australia", "Italy", "India"]
    selected_suggestion = st.selectbox("Quick Picks:", ["-- Select or type below --"] + popular_suggestions)
    
    st.markdown("---")
    st.subheader("ℹ️ Project Info")
    st.write("**Course / Scope:** Beginner Python + Streamlit")
    st.write("**Data Provider:** REST Countries API v3.1")
    st.write("**Libraries:** `urllib.request`, `json`, `streamlit`")
    st.write("**Backend / DB:** None required (stateless client)")

# Determine search term (from quick select or manual input)
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
        st.write("") # Spacing
        st.write("") # Spacing
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
    
    # Create request with a standard browser User-Agent
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

# Process search
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
            # When multiple countries match, select the first or let user view options
            country = data[0]
            
            # Extract basic required fields
            name_info = country.get("name", {})
            common_name = name_info.get("common", "Unknown")
            official_name = name_info.get("official", common_name)
            
            # Capital (list in API)
            capitals = country.get("capital", [])
            capital_str = ", ".join(capitals) if capitals else "No official capital"
            
            # Region & Subregion
            region = country.get("region", "Not specified")
            subregion = country.get("subregion", "N/A")
            
            # Population
            population = country.get("population", 0)
            population_formatted = f"{population:,}"
            
            # Area in km² and sq mi
            area = country.get("area", 0)
            area_formatted = f"{area:,.1f} km²" if area else "Not available"
            area_sq_miles = f"{area * 0.386102:,.1f} sq mi" if area else "N/A"
            
            # Languages (dict: code -> language name)
            languages_dict = country.get("languages", {})
            languages_str = ", ".join(languages_dict.values()) if languages_dict else "Not specified"
            
            # Currencies (dict: code -> {name, symbol})
            currencies_dict = country.get("currencies", {})
            currencies_list = []
            for cur_code, cur_info in currencies_dict.items():
                cur_name = cur_info.get("name", cur_code)
                cur_symbol = cur_info.get("symbol", "")
                currencies_list.append(f"{cur_name} ({cur_code} - {cur_symbol})")
            currencies_str = ", ".join(currencies_list) if currencies_list else "None recorded"
            
            # Flag image URL
            flags = country.get("flags", {})
            flag_url = flags.get("png") or flags.get("svg")
            flag_alt = flags.get("alt", f"Flag of {common_name}")
            
            # Top visual header card
            st.markdown(f"""
            <div class="country-header">
                <h1 style="margin:0; font-size:2rem;">{common_name}</h1>
                <p style="margin:0.2rem 0 0 0; opacity:0.9; font-size:1.1rem;">Official: <em>{official_name}</em></p>
                <p style="margin:0.4rem 0 0 0; opacity:0.85;">📍 {region} • {subregion}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # 2-Column layout: Flag on left, Key Details on right
            col_flag, col_details = st.columns([1, 2])
            
            with col_flag:
                st.subheader("🏳️ National Flag")
                if flag_url:
                    st.image(flag_url, caption=flag_alt, use_container_width=True)
                else:
                    st.info("No flag image available.")
                    
                # Coat of arms if present
                coat_of_arms = country.get("coatOfArms", {}).get("png")
                if coat_of_arms:
                    with st.expander("🛡️ View Coat of Arms"):
                        st.image(coat_of_arms, use_container_width=True)
            
            with col_details:
                st.subheader("📋 Destination Quick Facts")
                
                # Metrics Row
                m1, m2, m3 = st.columns(3)
                with m1:
                    st.metric(label="🏛️ Capital City", value=capital_str)
                with m2:
                    st.metric(label="👥 Population", value=population_formatted)
                with m3:
                    st.metric(label="📐 Total Land Area", value=area_formatted)
                
                st.markdown("---")
                
                # Detailed Info Cards
                st.write(f"**🌐 Geographic Region:** {region} ({subregion})")
                st.write(f"**🗣️ Spoken Languages:** {languages_str}")
                st.write(f"**💰 National Currencies:** {currencies_str}")
                st.write(f"**📏 Area in Imperial:** {area_sq_miles}")
                
                # Borders
                borders = country.get("borders", [])
                if borders:
                    st.write(f"**🤝 Bordering Nations (ISO codes):** {', '.join(borders)}")
                else:
                    st.write("**🤝 Bordering Nations:** None (Island or isolated territory)")
                
                # Maps link
                maps_info = country.get("maps", {})
                google_maps = maps_info.get("googleMaps")
                if google_maps:
                    st.markdown(f"[🗺️ Open {common_name} in Google Maps]({google_maps})")
            
            # Show if multiple results were returned by the query
            if len(data) > 1:
                st.markdown("---")
                st.caption(f"ℹ️ Found {len(data)} countries matching '{query_to_search}'. Displayed top match '{common_name}'. Other matches: {', '.join([c.get('name', {}).get('common', '') for c in data[1:]])}")

else:
    # Helpful empty state
    st.info("💡 **Welcome to Travel Destination Explorer!** Enter a country name above (e.g. *Japan*, *Brazil*, *France*, *Egypt*) and click **Search Country** to explore its details.")
