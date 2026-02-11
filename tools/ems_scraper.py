"""EMS Company Scraper - Extracts company data from multiple EMS directories."""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
import json
import re

class EMSScraper:
    """Scrapes EMS companies from various online directories."""

    # European countries list
    EUROPEAN_COUNTRIES = {
        'Germany', 'Austria', 'Switzerland', 'United Kingdom', 'UK', 'Great Britain',
        'France', 'Netherlands', 'Belgium', 'Luxembourg',
        'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria',
        'Italy', 'Spain', 'Portugal', 'Greece', 'Croatia', 'Slovenia', 'Serbia',
        'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Ireland', 'Estonia',
        'Latvia', 'Lithuania', 'Ukraine', 'Moldova', 'Belarus',
        'Albania', 'Bosnia', 'Kosovo', 'Montenegro', 'North Macedonia',
        'Malta', 'Cyprus', 'Liechtenstein', 'Monaco', 'San Marino', 'Vatican',
        'Deutschland', 'Österreich', 'Schweiz', 'Polska', 'Italia', 'España',
        'Sverige', 'Norge', 'Danmark', 'Suomi', 'Nederland', 'België',
        'Frankrijk', 'Česko', 'Magyarország', 'România', 'България',
        'Portugal', 'Ελλάδα', 'Hrvatska', 'Slovenija', 'Srbija'
    }

    SOURCES = {
        "ems_scout": "https://ems-scout.de/ems-suche/",
        "ems_anbieter": "https://www.ems-anbieter.info/ems-anbieter-a-z",
        "ems1": "https://www.ems1.com/company-directory/",
        "hardwarebee": "https://hardwarebee.com/vendor_category/ems-companies/",
        "ensun": "https://ensun.io/search/electronic-manufacturing-service-ems"
    }

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        self.companies = []

    def _is_european_country(self, country: str) -> bool:
        """Check if country is in Europe."""
        if not country:
            return False
        return country.strip() in self.EUROPEAN_COUNTRIES

    def _is_legitimate_company(self, name: str) -> bool:
        """Enhanced legitimacy checks for company names."""
        if not name or len(name) < 5:
            return False

        name_lower = name.lower().strip()

        # Must have company-like indicators (GmbH, Ltd, AG, SA, Srl, etc.) OR be longer
        company_indicators = [
            'gmbh', 'ltd', 'limited', 'ag', 'sa', 'srl', 'spa', 'sas',
            'inc', 'corp', 'corporation', 'llc', 'bv', 'nv', 'plc',
            'oo', 'zo', 'kft', 'ro', 'sro', 'doo', 'ad', 'ae',
            'electronics', 'systems', 'technology', 'technologies', 'solutions',
            'manufacturing', 'industrial', 'automation', 'engineering', 'group',
            'international', 'europe', 'eu', 'gmbh &', 'kg', 'ohg'
        ]

        # Check if name contains company indicators OR is reasonably long with multiple words
        has_indicator = any(ind in name_lower for ind in company_indicators)
        is_long_enough = len(name) >= 15 and len(name.split()) >= 2

        if not (has_indicator or is_long_enough):
            return False

        # Filter out non-company terms more aggressively
        illegitimate_terms = {
            'suche', 'home', 'kontakt', 'über', 'mehr', 'weitere', 'nächste',
            'vorherige', 'back', 'next', 'search', 'menu', 'navigation', 'login',
            'register', 'newsletter', 'cookie', 'impressum', 'datenschutz',
            'click', 'here', 'link', 'show', 'news', 'browsing', 'category',
            'browse', 'results', 'page', 'show more', 'show all', 'more',
            'previous', 'loading', 'please wait', 'german', 'english', 'french',
            'ems', 'directory', 'company', 'vendor', 'search results', 'categories',
            'all', 'der', 'die', 'das', 'und', 'oder', 'the', 'and', 'or',
            'view', 'type', 'country', 'location', 'region', 'state', 'province',
            'bauteilmarkt', 'ems lexikon', 'ems-dienstleister', 'dienstleister',
            'lexikon', 'kategorie', 'unternehmen', 'lieferant', 'anbieter',
            'alle kategorien', 'alle länder', 'investor', 'relations', 'careers',
            'jobs', 'about', 'services', 'products', 'portfolio', 'newsroom',
            'press', 'media', 'downloads', 'support', 'contact', 'faq'
        }

        if name_lower in illegitimate_terms:
            return False

        # Filter out names with suspicious patterns
        if any(char in name for char in ['„', '"', '"', '»', '«', '➜', '>', '<', '...']):
            return False

        # Must contain at least one letter and one number/special combo typical of company names
        if not any(c.isalpha() for c in name):
            return False

        return True

    def _is_valid_company_name(self, text: str) -> bool:
        """Legacy method - kept for compatibility but delegates to _is_legitimate_company."""
        return self._is_legitimate_company(text)
    
    def _is_valid_company_name(self, text: str) -> bool:
        """Check if text looks like a company name."""
        # Filter out quotes, arrows, symbols
        if any(c in text for c in ['„', '"', '„', '"', '»', '«', '➜', '>', '<']):
            return False
        
        # Filter out pure numbers or very short text
        if len(text) < 5 or len(text) > 80:
            return False
        
        # Must contain at least one letter
        if not any(c.isalpha() for c in text):
            return False
        
        # Filter obvious non-company words and categories
        non_company = {
            'suche', 'home', 'kontakt', 'über', 'mehr', 'weitere', 'nächste', 
            'vorherige', 'back', 'next', 'search', 'menu', 'navigation', 'login',
            'register', 'newsletter', 'cookie', 'impressum', 'datenschutz',
            'click', 'here', 'link', 'show', 'news', 'browsing', 'category',
            'browse', 'results', 'page', 'show more', 'show all', 'more',
            'previous', 'loading', 'please wait', 'german', 'english', 'france',
            'ems', 'directory', 'company', 'vendor', 'search results', 'categories',
            'all', 'der', 'die', 'das', 'und', 'oder', 'the', 'and', 'or',
            'view', 'type', 'country', 'location', 'region', 'state', 'province',
            'bauteilmarkt', 'ems lexikon', 'ems-dienstleister', 'dienstleister',
            'lexikon', 'kategorie', 'unternehmen', 'lieferant', 'anbieter',
            '> alle', 'alle kategorien', 'alle länder',
            # Common country/region names to filter
            'afghanistan', 'albanien', 'belgien', 'bosnien', 'deutsch', 'deutschland', 'england',
            'frankreich', 'griechenland', 'großbritannien', 'irland', 'island',
            'italien', 'kroatien', 'lettland', 'litauen', 'luxemburg', 'malta',
            'niederlande', 'österreich', 'polen', 'portugal', 'rumänien', 'russland',
            'schweden', 'schweiz', 'serbien', 'slowakei', 'slovenien', 'spanien',
            'tschechien', 'türkei', 'ukraine', 'ungarn', 'usa', 'vereinigte',
            'dänemark', 'estland', 'finnland', 'moldawien', 'norwegen', 'tschechische',
            'bulgarien', 'litauen', 'kroatien', 'serbien', 'slovenjski', 'slovenien',
            'bosnien u. herzeg.', 'tschechische rep.', 'slowenien', 'herzegowina',
            '> alle länder', 'alle länder',
        }
        
        if text.lower().strip() in non_company:
            return False
        
        # Don't include if it looks like just a word or very generic
        word_count = len(text.split())
        if word_count == 1 and len(text) < 8:
            return False
        
        return True
    
    def scrape_ems_scout(self) -> List[Dict]:
        """Scrape from ems-scout.de - German EMS directory"""
        try:
            response = requests.get(self.SOURCES["ems_scout"], headers=self.headers, timeout=15)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []

            # Look for any links that might be company names
            for link in soup.find_all('a', href=True):
                text = link.get_text(strip=True)
                if self._is_legitimate_company(text):
                    companies.append({
                        "name": text,
                        "source": "ems_scout",
                        "url": self.SOURCES["ems_scout"],
                        "country": "Germany",
                        "linkedin_profiles": []
                    })

            # Remove duplicates
            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c

            return list(unique.values())[:200]
        except Exception as e:
            print(f"Error scraping ems_scout: {e}")
            return []
    
    def scrape_ems_anbieter(self) -> List[Dict]:
        """Scrape from ems-anbieter.info - German EMS providers"""
        try:
            response = requests.get(self.SOURCES["ems_anbieter"], headers=self.headers, timeout=15)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []

            # Extract from links and headings
            for elem in soup.find_all(['a', 'h2', 'h3', 'h4']):
                text = elem.get_text(strip=True)
                if self._is_legitimate_company(text):
                    companies.append({
                        "name": text,
                        "source": "ems_anbieter",
                        "url": self.SOURCES["ems_anbieter"],
                        "country": "Germany",
                        "linkedin_profiles": []
                    })

            # Deduplicate
            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c

            return list(unique.values())[:200]
        except Exception as e:
            print(f"Error scraping ems_anbieter: {e}")
            return []
    
    def scrape_ems1(self) -> List[Dict]:
        """Scrape from ems1.com - Skip US-focused (not European)"""
        # Skipping - primarily US companies
        print("[EMSScraper] Skipping ems1.com - primarily US companies")
        return []

    def scrape_hardwarebee(self) -> List[Dict]:
        """Scrape from hardwarebee.com - Vendor directory (European only)"""
        try:
            response = requests.get(self.SOURCES["hardwarebee"], headers=self.headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []

            for elem in soup.find_all(['a', 'h2', 'h3', 'h4', 'div']):
                text = elem.get_text(strip=True)
                # Only add if it looks like a legitimate European company
                if self._is_legitimate_company(text):
                    # Default to European, will be filtered further if needed
                    companies.append({
                        "name": text,
                        "source": "hardwarebee",
                        "url": self.SOURCES["hardwarebee"],
                        "country": "Europe",
                        "linkedin_profiles": []
                    })

            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c

            return list(unique.values())[:200]
        except Exception as e:
            print(f"Error scraping hardwarebee: {e}")
            return []

    def scrape_ensun(self) -> List[Dict]:
        """Scrape from ensun.io - Global EMS search (European only)"""
        try:
            response = requests.get(self.SOURCES["ensun"], headers=self.headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []

            for elem in soup.find_all(['a', 'h2', 'h3', 'h4']):
                text = elem.get_text(strip=True)
                if self._is_legitimate_company(text):
                    companies.append({
                        "name": text,
                        "source": "ensun",
                        "url": self.SOURCES["ensun"],
                        "country": "Europe",
                        "linkedin_profiles": []
                    })

            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c

            return list(unique.values())[:200]
        except Exception as e:
            print(f"Error scraping ensun: {e}")
            return []
    
    def scrape_all(self, save_to_db: bool = True) -> List[Dict]:
        """Scrape all sources and return consolidated list of European companies."""
        all_companies = []

        print("[EMSScraper] Scraping European EMS companies...")

        all_companies.extend(self.scrape_ems_scout())
        all_companies.extend(self.scrape_ems_anbieter())
        all_companies.extend(self.scrape_ems1())
        all_companies.extend(self.scrape_hardwarebee())
        all_companies.extend(self.scrape_ensun())

        # Remove duplicates based on company name
        unique_companies = {}
        for company in all_companies:
            key = company['name'].lower().strip()
            if key not in unique_companies:
                unique_companies[key] = company

        # Filter to only European companies
        european_companies = []
        for company in unique_companies.values():
            country = company.get('country', '')
            if self._is_european_country(country):
                european_companies.append(company)

        self.companies = european_companies

        print(f"[EMSScraper] Found {len(unique_companies)} total companies, {len(european_companies)} European companies")

        # Save to SQLite if requested
        if save_to_db and self.companies:
            try:
                from api.sqlite_store import SQLiteStore
                added = SQLiteStore.add_companies_batch(self.companies)
                print(f"[EMSScraper] Saved {added} European companies to SQLite")
            except Exception as e:
                print(f"[EMSScraper] Warning: Could not save to SQLite: {e}")

        return self.companies
    
    def get_companies_json(self) -> str:
        """Return companies as JSON."""
        return json.dumps(self.companies, indent=2)


if __name__ == "__main__":
    scraper = EMSScraper()
    companies = scraper.scrape_all()
    print(f"Found {len(companies)} unique EMS companies")
    for company in companies[:5]:
        print(f"- {company['name']} (from {company['source']})")
