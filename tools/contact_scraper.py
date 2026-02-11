import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

class ContactScraper:
    """
    Real web scraper that extracts contact information from company websites.
    """
    
    @staticmethod
    def extract_contacts_from_company(company_name: str, company_url: str = None) -> list:
        """
        Extracts real names and email addresses from the company website.
        """
        print(f"  [ContactScraper] Scraping contacts for: {company_name}")
        
        # If no URL provided, try to find company website
        if not company_url:
            company_url = ContactScraper._find_company_website(company_name)
            if not company_url:
                print(f"  [ContactScraper] Could not find official website for {company_name}")
                return []
        
        contacts = []
        
        try:
            # Scrape main page
            main_contacts = ContactScraper._scrape_page(company_url)
            contacts.extend(main_contacts)
            
            # Try common contact pages
            base_url = ContactScraper._get_base_url(company_url)
            contact_pages = [
                '/contact', '/about', '/team', '/leadership', '/about-us',
                '/contact-us', '/management', '/staff', '/people'
            ]
            
            for page_path in contact_pages:
                try:
                    page_url = urljoin(base_url, page_path)
                    page_contacts = ContactScraper._scrape_page(page_url)
                    contacts.extend(page_contacts)
                    time.sleep(0.5)  # Be polite, don't hammer the server
                except:
                    continue
            
            # Deduplicate contacts by email
            unique_contacts = []
            seen_emails = set()
            
            for contact in contacts:
                email = contact.get('email', '')
                if email and email not in seen_emails:
                    seen_emails.add(email)
                    unique_contacts.append(contact)
            
            print(f"  [ContactScraper] Found {len(unique_contacts)} unique contacts")
            if unique_contacts:
                return unique_contacts[:5]  # Return top 5 contacts
            else:
                # Fallback: Try to infer email format from web search
                print(f"  [ContactScraper] No contacts found from scraping, trying inference fallback")
                return ContactScraper._generate_inferred_contacts(company_name)
            
        except Exception as e:
            print(f"  [ContactScraper] Error scraping {company_name}: {e}")
            # Fallback: Try to infer email format from web search and generate plausible addresses
            return ContactScraper._generate_inferred_contacts(company_name)
    
    @staticmethod
    def _find_company_website(company_name: str) -> str:
        """Try to find company website URL from search results using LLM validation."""
        try:
            from ddgs import DDGS
            search_query = f"{company_name} official headquarters website"
            
            ddgs = DDGS()
            results = list(ddgs.text(search_query, max_results=5))
            
            if not results:
                return None
                
            # Use LLM to pick the most likely official website
            llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
            
            prompt = f"""
            Identify the official corporate website for '{company_name}' from these search results.
            Return ONLY the URL of the most likely official homepage. If none are official, return 'None'.
            
            Results:
            {results}
            """
            
            response = llm.invoke(prompt)
            url = response.content.strip()
            
            if "http" in url:
                return url
            return None
        except Exception as e:
            print(f"  [ContactScraper] Search Error: {e}")
            return None
    
    @staticmethod
    def _get_base_url(url: str) -> str:
        """Extract base URL from full URL."""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"
    
    @staticmethod
    def _scrape_page(url: str, timeout: int = 10) -> list:
        """
        Scrape a single page for contact information.
        """
        contacts = []
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=timeout)
            if response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            text_content = soup.get_text()
            
            # Extract emails
            emails = ContactScraper._extract_emails(text_content)
            
            # Extract names (look for common patterns)
            names = ContactScraper._extract_names(soup, text_content)
            
            # Match names with emails
            for i, email in enumerate(emails[:5]):  # Limit to 5
                contact = {
                    'email': email,
                    'name': names[i] if i < len(names) else ContactScraper._guess_name_from_email(email),
                    'role': ContactScraper._guess_role(soup, names[i] if i < len(names) else ''),
                    'source_url': url
                }
                contacts.append(contact)
            
            return contacts
            
        except Exception as e:
            print(f"  [ContactScraper] Error scraping page {url}: {e}")
            return []
    
    @staticmethod
    def _extract_emails(text: str) -> list:
        """Extract email addresses from text."""
        # Regex for email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)

        # Filter out common generic emails, images, etc.
        filtered = []
        exclude_patterns = ['example.com', 'yourdomain', 'yourcompany', '.png', '.jpg',
                           'noreply', 'no-reply', 'donotreply', 'test.com', 'testing.',
                           'localhost', '@example', '@your', 'email@', 'contact@']

        for email in emails:
            if not any(pattern in email.lower() for pattern in exclude_patterns):
                # Additional validation: check domain looks real
                domain = email.split('@')[1] if '@' in email else ''
                if '.' in domain and len(domain.split('.')) >= 2:
                    filtered.append(email)

        return list(set(filtered))  # Remove duplicates
    
    @staticmethod
    def _extract_names(soup: BeautifulSoup, text: str) -> list:
        """Extract potential contact names from page structure."""
        names = []
        
        # Look for common name patterns in HTML structure
        # Team pages often have name in h3, h4, or strong tags
        for tag in soup.find_all(['h3', 'h4', 'h5', 'strong', 'b']):
            text = tag.get_text().strip()
            # Check if it looks like a name (2-3 words, capitalized)
            if ContactScraper._is_likely_name(text):
                names.append(text)
        
        # Look for "Name:" or "Contact:" patterns
        name_pattern = r'(?:Name|Contact|Person):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)'
        matches = re.findall(name_pattern, text)
        names.extend(matches)
        
        return list(set(names))[:10]  # Unique names, max 10
    
    @staticmethod
    def _is_likely_name(text: str) -> bool:
        """Check if text looks like a person's name."""
        words = text.split()
        if len(words) < 2 or len(words) > 4:
            return False

        # Check if all words are capitalized
        if not all(word[0].isupper() for word in words if word):
            return False

        # Check reasonable length
        if len(text) > 50 or len(text) < 5:
            return False

        return True

    @staticmethod
    def _extract_name_from_text(text: str, email: str) -> str:
        """Try to extract a name associated with an email from text."""
        # Extract name from email local part
        local = email.split('@')[0]
        parts = re.split(r'[._-]', local)

        if len(parts) >= 2:
            # Try to capitalize like a name
            name_parts = [part.capitalize() for part in parts if len(part) > 1]
            if len(name_parts) >= 2:
                # Look for this name pattern in the text to validate
                potential_name = ' '.join(name_parts[:2])
                if potential_name in text:
                    return potential_name

        # Look for patterns like "Name: <email>" or "<email> - Name"
        patterns = [
            r'([A-Z][a-z]+\s+[A-Z][a-z]+).*?' + re.escape(email),
            re.escape(email) + r'.*?([A-Z][a-z]+\s+[A-Z][a-z]+)'
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        # Fallback to email-based guess
        if len(parts) >= 2:
            name_parts = [part.capitalize() for part in parts if len(part) > 1]
            return ' '.join(name_parts[:2])

        return "Contact"
    
    @staticmethod
    def _guess_name_from_email(email: str) -> str:
        """Extract likely name from email address."""
        # Split email by @ and take local part
        local = email.split('@')[0]
        
        # Common patterns: firstname.lastname, firstnamelastname, f.lastname
        parts = re.split(r'[._-]', local)
        
        if len(parts) >= 2:
            # Capitalize each part
            name_parts = [part.capitalize() for part in parts if len(part) > 1]
            return ' '.join(name_parts[:2])  # Take first 2 parts
        
        return local.capitalize()
    
    @staticmethod
    def _guess_role(soup: BeautifulSoup, name: str) -> str:
        """Try to find job title/role associated with a name."""
        if not name:
            return "Contact"
        
        # Look for common title patterns near the name
        text = soup.get_text()
        
        # Find name position and look around it
        name_index = text.find(name)
        if name_index == -1:
            return "Contact"
        
        # Get surrounding context (200 chars)
        context = text[max(0, name_index-100):min(len(text), name_index+100)]
        
        # Common titles
        titles = ['CEO', 'President', 'Director', 'Manager', 'VP', 'Vice President',
                 'Chief', 'Officer', 'Head', 'Lead', 'Coordinator', 'Specialist']
        
        for title in titles:
            if title.lower() in context.lower():
                return title
        
        return "Contact"
    
    @staticmethod
    def _generate_inferred_contacts(company_name: str) -> list:
        """
        Extract REAL email addresses from web search results - NO fake/generated emails.
        Only returns emails that actually exist in search results.
        """
        try:
            print(f"  [ContactScraper] Searching for real email addresses for {company_name}...")

            # Search for company email addresses
            from ddgs import DDGS
            search_queries = [
                f"{company_name} contact email",
                f"{company_name} @ email",
                f"site:linkedin.com {company_name} email"
            ]

            ddgs = DDGS()
            found_contacts = {}  # Use dict to deduplicate by email

            for search_query in search_queries:
                try:
                    results = list(ddgs.text(search_query, max_results=10))

                    # Extract email and name patterns from search results
                    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

                    for result in results:
                        text = result.get('body', '') + ' ' + result.get('title', '')
                        emails = re.findall(email_pattern, text)

                        for email in emails:
                            # Skip generic emails
                            exclude_patterns = ['info@', 'contact@', 'sales@', 'support@',
                                              'office@', 'admin@', 'noreply', 'no-reply']
                            if any(pattern in email.lower() for pattern in exclude_patterns):
                                continue

                            # Try to find a name associated with this email in the text
                            name = ContactScraper._extract_name_from_text(text, email)

                            if email not in found_contacts:
                                found_contacts[email] = {
                                    'email': email,
                                    'name': name,
                                    'role': 'Contact',
                                    'source_url': result.get('href', ''),
                                    'inference_based': False
                                }
                except:
                    continue

            contacts = list(found_contacts.values())

            if contacts:
                print(f"  [ContactScraper] Found {len(contacts)} REAL email addresses from search")
                return contacts[:5]
            else:
                print(f"  [ContactScraper] No real emails found for {company_name}")
                return []

        except Exception as e:
            print(f"  [ContactScraper] Search error: {e}")
            return []
