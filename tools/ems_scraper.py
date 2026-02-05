"""EMS Company Scraper - Extracts company data from multiple EMS directories."""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
import json
import re

class EMSScraper:
    """Scrapes EMS companies from various online directories."""
    
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
                if self._is_valid_company_name(text):
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
            
            return list(unique.values())[:150]
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
                if self._is_valid_company_name(text):
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
            
            return list(unique.values())[:150]
        except Exception as e:
            print(f"Error scraping ems_anbieter: {e}")
            return []
    
    def scrape_ems1(self) -> List[Dict]:
        """Scrape from ems1.com - US EMS directory"""
        try:
            response = requests.get(self.SOURCES["ems1"], headers=self.headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []
            
            for elem in soup.find_all(['a', 'h2', 'h3', 'h4', 'td']):
                text = elem.get_text(strip=True)
                if self._is_valid_company_name(text):
                    companies.append({
                        "name": text,
                        "source": "ems1",
                        "url": self.SOURCES["ems1"],
                        "country": "USA",
                        "linkedin_profiles": []
                    })
            
            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c
            
            return list(unique.values())[:150]
        except Exception as e:
            print(f"Error scraping ems1: {e}")
            return []
    
    def scrape_hardwarebee(self) -> List[Dict]:
        """Scrape from hardwarebee.com - Vendor directory"""
        try:
            response = requests.get(self.SOURCES["hardwarebee"], headers=self.headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []
            
            for elem in soup.find_all(['a', 'h2', 'h3', 'h4']):
                text = elem.get_text(strip=True)
                if self._is_valid_company_name(text):
                    companies.append({
                        "name": text,
                        "source": "hardwarebee",
                        "url": self.SOURCES["hardwarebee"],
                        "country": "International",
                        "linkedin_profiles": []
                    })
            
            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c
            
            return list(unique.values())[:150]
        except Exception as e:
            print(f"Error scraping hardwarebee: {e}")
            return []
    
    def scrape_ensun(self) -> List[Dict]:
        """Scrape from ensun.io - Global EMS search"""
        try:
            response = requests.get(self.SOURCES["ensun"], headers=self.headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []
            
            for elem in soup.find_all(['a', 'h2', 'h3', 'h4']):
                text = elem.get_text(strip=True)
                if self._is_valid_company_name(text):
                    companies.append({
                        "name": text,
                        "source": "ensun",
                        "url": self.SOURCES["ensun"],
                        "country": "International",
                        "linkedin_profiles": []
                    })
            
            unique = {}
            for c in companies:
                key = c['name'].lower()
                if key not in unique:
                    unique[key] = c
            
            return list(unique.values())[:150]
        except Exception as e:
            print(f"Error scraping ensun: {e}")
            return []
    
    def scrape_all(self, save_to_db: bool = True) -> List[Dict]:
        """Scrape all sources and return consolidated list of companies."""
        all_companies = []
        
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
        
        self.companies = list(unique_companies.values())
        
        # Save to SQLite if requested
        if save_to_db and self.companies:
            try:
                from api.sqlite_store import SQLiteStore
                added = SQLiteStore.add_companies_batch(self.companies)
                print(f"[EMSScraper] Saved {added} companies to SQLite")
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
