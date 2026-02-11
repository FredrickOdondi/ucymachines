"""LinkedIn Profile Scraper - Finds LinkedIn profiles for specific positions."""
import json
from typing import List, Dict
import time
import random
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

class LinkedInScraper:
    """Finds LinkedIn profiles for target positions at companies."""
    
    TARGET_POSITIONS = {
        "executive": [
            "Chief Executive Officer", "CEO",
            "Chief Operating Officer", "COO",
            "Chief Financial Officer", "CFO",
            "Chief Technology Officer", "CTO",
            "Chief Supply Chain Officer", "CSCO",
            "Chief Procurement Officer", "CPO",
            "Chief Manufacturing Officer", "CMO",
        ],
        "management": [
            "Vice President Manufacturing",
            "VP Manufacturing",
            "Plant Manager",
            "General Manager",
            "Director of Operations",
            "Director of Production",
            "Director of Manufacturing",
            "Director of Maintenance",
            "Manager Manufacturing",
            "Head of Facilities",
            "Head of Automation",
        ],
        "german_executive": [
            "Geschäftsführer",
            "Vorstandsvorsitzender",
        ],
        "german_management": [
            "Geschäftsführer Operations",
            "Kaufmännischer Geschäftsführer",
            "Leiter Supply Chain Management",
            "Leiter Einkauf",
            "Einkaufsleiter",
            "Leiter Produktion",
            "Produktionsleiter",
            "Betriebsleiter",
            "Leiter Operations",
            "Bereichsleiter Produktion",
            "Leiter Betriebstechnik",
            "Leiter Anlagen",
            "Werkleiter",
            "Standortleiter",
            "Leiter Fertigung",
            "Leiter Instandhaltung",
            "Leiter Automatisierungstechnik",
            "Leiter Automatisierung",
        ]
    }
    
    def __init__(self):
        self.ddgs = DDGS()
        self.request_delay = 0.5  # seconds between requests to avoid rate limiting
        self.last_request_time = 0
        self.max_results_per_search = 3  # Limit results per search
        self.search_timeout = 5  # seconds per search
    
    def search_linkedin_profile(self, company_name: str, position: str, country: str = "") -> List[Dict]:
        """Search for LinkedIn profile using DuckDuckGo with rate limiting."""
        try:
            # Rate limiting: add delay between requests
            elapsed = time.time() - self.last_request_time
            if elapsed < self.request_delay:
                time.sleep(self.request_delay - elapsed)
            
            # Build search query
            query = f"{company_name} {position} linkedin"
            if country and country.lower() != "international":
                query += f" {country}"
            
            start_time = time.time()
            results = self.ddgs.text(query, max_results=self.max_results_per_search)
            self.last_request_time = time.time()
            
            profiles = []
            for result in results:
                # Timeout protection
                if time.time() - start_time > self.search_timeout:
                    break
                    
                if 'linkedin.com/in/' in result.get('href', '').lower():
                    # Extract name and position from the title
                    title = result.get('title', '')
                    name, actual_position = self._extract_person_info(title, position)
                    
                    # Only include if we got a valid name
                    if name and name.lower() != 'linkedin':
                        profiles.append({
                            "name": name,
                            "position": actual_position,
                            "search_position": position,
                            "url": result.get('href'),
                            "title": title,
                            "snippet": result.get('body', '')[:200]
                        })
            
            return profiles
        except Exception as e:
            print(f"Error searching LinkedIn for {company_name} {position}: {e}")
            return []
    
    def _extract_person_info(self, title: str, fallback_position: str) -> tuple:
        """Extract person name and actual position from LinkedIn title.
        
        Examples:
        - "John Smith | CEO at Siemens" -> ("John Smith", "CEO")
        - "Jane Doe – VP Operations | Manufacturing" -> ("Jane Doe", "VP Operations")
        """
        if not title:
            return "", fallback_position
        
        # Common separators used in LinkedIn titles
        separators = ['|', '–', '-', '•']
        parts = []
        
        for sep in separators:
            if sep in title:
                parts = title.split(sep)
                break
        
        if not parts:
            parts = [title]
        
        # First part is usually the name
        name = parts[0].strip() if parts else ""
        name = name.replace('LinkedIn', '').strip()
        
        # Extract position from remaining parts
        position = fallback_position
        for part in parts[1:]:
            part_clean = part.strip()
            part_lower = part_clean.lower()
            
            # Look for position keywords
            position_keywords = ['ceo', 'coo', 'cfo', 'cto', 'chief', 'director', 'manager', 
                               'head of', 'vice president', 'vp', 'leiter', 'geschäftsführer',
                               'president', 'officer', 'officer', 'lead', 'founder']
            
            if any(keyword in part_lower for keyword in position_keywords):
                # Clean up the position - remove company references
                position = part_clean.replace(' at ', ' | ').split('|')[0].strip()
                position = position.replace('at ', '').strip()
                position = position.replace('&', '|').split('|')[0].strip()
                # Remove trailing company names
                if ' | ' not in position:
                    # Cut at common company indicators
                    for indicator in [' at ', ' ag ', ' gmbh', ' limited', ' inc', ' corp']:
                        if indicator in position.lower():
                            position = position[:position.lower().find(indicator)].strip()
                            break
                break
        
        return name, position
    
    def find_profiles_for_company(self, company: Dict, positions: List[str] = None, save_to_db: bool = True) -> Dict:
        """Find LinkedIn profiles for a company across multiple positions."""
        if positions is None:
            # Default to a subset of positions
            positions = self.TARGET_POSITIONS["executive"][:3] + self.TARGET_POSITIONS["management"][:3]
        
        # Limit positions to search to avoid excessive API calls
        max_positions = 8
        if len(positions) > max_positions:
            # Sample positions instead of searching all
            positions = random.sample(positions, max_positions)
        
        # Preserve original company data and add profiles
        company_data = company.copy()
        company_data["profiles_found"] = []
        company_data["positions_searched"] = len(positions)
        found_profiles_set = set()  # Track unique profiles by URL to avoid duplicates
        
        # Get company ID if saving to DB
        company_id = None
        if save_to_db:
            try:
                from api.sqlite_store import SQLiteStore
                company_id = SQLiteStore.add_company(company)
            except Exception as e:
                print(f"Warning: Could not save company to SQLite: {e}")
        
        for position in positions:
            profiles = self.search_linkedin_profile(
                company.get("name", company.get("company_name", "")),
                position,
                company.get("country")
            )
            
            if profiles:
                for profile in profiles:
                    # Use URL as unique identifier
                    url = profile['url']
                    name = profile.get("name", "").strip()
                    # Only include profiles with valid names - skip "Unknown" or empty
                    if url not in found_profiles_set and name and name.lower() != "unknown":
                        found_profiles_set.add(url)
                        profile_data = {
                            "name": name,
                            "position": profile.get("position", position),
                            "search_position": profile.get("search_position"),
                            "url": profile.get("url"),
                            "title": profile.get("title", ""),
                            "snippet": profile.get("snippet", "")
                        }
                        company_data["profiles_found"].append(profile_data)
                        
                        # Save to SQLite if company_id is available
                        if save_to_db and company_id:
                            try:
                                from api.sqlite_store import SQLiteStore
                                SQLiteStore.add_profile(company_id, profile_data)
                            except Exception as e:
                                pass  # Silent fail for DB saves
        
        company_data["total_profiles"] = len(company_data["profiles_found"])
        return company_data
    
    def find_profiles_batch(self, companies: List[Dict], positions: List[str] = None, max_companies: int = 20, save_to_db: bool = True) -> List[Dict]:
        """Find LinkedIn profiles for multiple companies with smart limiting."""
        # Limit companies to search to avoid excessive processing
        if len(companies) > max_companies:
            companies = companies[:max_companies]

        results = []
        for idx, company in enumerate(companies):
            result = self.find_profiles_for_company(company, positions, save_to_db=save_to_db)
            results.append(result)

            # Update progress in database for real-time tracking
            if save_to_db:
                try:
                    from api.sqlite_store import SQLiteStore
                    SQLiteStore.update_search_progress(idx + 1, len(companies))
                except Exception as e:
                    pass  # Silent fail

            # Print progress every 5 companies
            if (idx + 1) % 5 == 0:
                print(f"Processed {idx + 1}/{len(companies)} companies...")

        return results
    
    def get_profiles_json(self, data: List[Dict]) -> str:
        """Return profiles as JSON."""
        return json.dumps(data, indent=2)


if __name__ == "__main__":
    scraper = LinkedInScraper()
    
    # Test with a sample company
    test_company = {
        "name": "Siemens",
        "country": "Germany"
    }
    
    result = scraper.find_profiles_for_company(test_company)
    print(f"Found {result['total_profiles']} profiles for {test_company['name']}")
